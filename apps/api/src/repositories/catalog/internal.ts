import { normalizeIngredientName } from '../utils.js';
import type { PrismaClient } from '../../generated/prisma/client.js';
import type { CatalogBackfillResult, ResolveCatalogGroupRequest } from './types.js';

export const mergeIngredientAliases = (
  target: { name: string; aliases: string[] },
  source: { name: string; aliases: string[] }
): string[] => {
  const knownAliases = new Set([
    normalizeIngredientName(target.name),
    ...target.aliases.map(normalizeIngredientName)
  ]);
  const aliases = [...target.aliases];

  for (const value of [source.name, ...source.aliases]) {
    const normalizedValue = normalizeIngredientName(value);
    if (normalizedValue && !knownAliases.has(normalizedValue)) {
      knownAliases.add(normalizedValue);
      aliases.push(value.trim());
    }
  }

  return aliases;
};

type MergeEntry = {
  name: string;
  aliases: string[];
  isStaple: boolean;
  picnicProductId: string | null;
  picnicProductName: string | null;
  picnicUnitQuantity: string | null;
};

type MembershipClient = Pick<PrismaClient, 'ingredient' | 'ingredientExpression'>;

const aliasesFromExpressions = async (db: MembershipClient, ingredientId: string, name: string) => {
  const expressions = await db.ingredientExpression.findMany({
    where: { ingredientId },
    orderBy: { createdAt: 'asc' }
  });
  return expressions.reduce(
    (aliases, expression) =>
      mergeIngredientAliases({ name, aliases }, { name: expression.name, aliases: [] }),
    [] as string[]
  );
};

export const mergeIngredientData = (target: MergeEntry, source: MergeEntry) => ({
  status: 'confirmed' as const,
  aliases: mergeIngredientAliases(target, source),
  isStaple: target.isStaple || source.isStaple,
  picnicProductId: target.picnicProductId ?? source.picnicProductId,
  picnicProductName: target.picnicProductId ? target.picnicProductName : source.picnicProductName,
  picnicUnitQuantity: target.picnicProductId ? target.picnicUnitQuantity : source.picnicUnitQuantity
});

export const resolveCatalogGroup = async (
  db: PrismaClient,
  householdId: string,
  { targetId, sourceIds, name, acceptPicnicConflict }: ResolveCatalogGroupRequest
): Promise<void> => {
  const ids = [targetId, ...sourceIds];
  if (new Set(ids).size !== ids.length)
    throw new Error('Eine Zutat darf nur einmal in der Gruppe stehen.');
  const canonicalName = name.trim();
  if (!canonicalName) throw new Error('Bitte einen Namen eingeben.');

  await db.$transaction(async (tx) => {
    const entries = await tx.ingredient.findMany({ where: { householdId, id: { in: ids } } });
    if (entries.length !== ids.length)
      throw new Error('Mindestens eine Zutat gehört nicht mehr zu diesem Haushalt.');
    const byId = new Map(entries.map((entry) => [entry.id, entry]));
    let target = byId.get(targetId)!;
    const mappedProducts = new Set(
      entries.flatMap((entry) => (entry.picnicProductId ? [entry.picnicProductId] : []))
    );
    if (mappedProducts.size > 1 && (!acceptPicnicConflict || !target.picnicProductId))
      throw new Error(
        'Unterschiedliche Picnic-Produkte: Bitte eine zugeordnete Zielzutat bestätigen.'
      );

    for (const sourceId of sourceIds) {
      const source = byId.get(sourceId)!;
      const expressions = await tx.ingredientExpression.findMany({
        where: { ingredientId: sourceId }
      });
      await tx.recipeIngredient.updateMany({
        where: { ingredientId: sourceId },
        data: { ingredientId: targetId }
      });

      for (const expression of expressions) {
        const existing = await tx.ingredientExpression.findUnique({
          where: { ingredientId_name: { ingredientId: targetId, name: expression.name } }
        });
        if (existing) {
          await tx.recipeIngredient.updateMany({
            where: { expressionId: expression.id },
            data: { expressionId: existing.id }
          });
          await tx.ingredientExpression.delete({ where: { id: expression.id } });
        } else {
          await tx.ingredientExpression.update({
            where: { id: expression.id },
            data: { ingredientId: targetId }
          });
        }
      }
      target = { ...target, ...mergeIngredientData(target, source) };
      await tx.ingredient.delete({ where: { id: sourceId } });
    }

    await tx.ingredientExpression.upsert({
      where: { ingredientId_name: { ingredientId: targetId, name: canonicalName } },
      create: { ingredientId: targetId, name: canonicalName },
      update: {}
    });

    await tx.ingredient.update({
      where: { id: targetId },
      data: {
        status: 'confirmed',
        name: canonicalName,
        aliases: await aliasesFromExpressions(tx, targetId, canonicalName),
        isStaple: target.isStaple,
        picnicProductId: target.picnicProductId,
        picnicProductName: target.picnicProductName,
        picnicUnitQuantity: target.picnicUnitQuantity
      }
    });
  });
};

export const detachCatalogExpression = async (
  db: PrismaClient,
  householdId: string,
  expressionId: string
): Promise<void> => {
  await db.$transaction(async (tx) => {
    const expression = await tx.ingredientExpression.findFirst({
      where: { id: expressionId, ingredient: { householdId } },
      include: { ingredient: true }
    });
    if (!expression) throw new Error('Dieser Ausdruck gehört nicht zum Haushalt.');

    const remaining = await tx.ingredientExpression.findMany({
      where: { ingredientId: expression.ingredientId, id: { not: expressionId } },
      orderBy: { createdAt: 'asc' }
    });
    if (!remaining.length)
      throw new Error('Die letzte Zutat einer Gruppe kann nicht entfernt werden.');
    if (
      remaining.some(
        (member) =>
          normalizeIngredientName(member.name) === normalizeIngredientName(expression.name)
      )
    )
      throw new Error('Gleichlautende Ausdrücke können nicht getrennt zugeordnet werden.');

    const detached = await tx.ingredient.create({
      data: {
        householdId,
        name: expression.name,
        status: 'pending',
        aliases: []
      }
    });
    await tx.ingredientExpression.update({
      where: { id: expressionId },
      data: { ingredientId: detached.id }
    });
    await tx.recipeIngredient.updateMany({
      where: { expressionId },
      data: { ingredientId: detached.id }
    });

    const originalName = expression.ingredient.name;
    const nameStillPresent = remaining.some(
      (member) => normalizeIngredientName(member.name) === normalizeIngredientName(originalName)
    );
    const remainingName = nameStillPresent ? originalName : remaining[0].name;
    await tx.ingredient.update({
      where: { id: expression.ingredientId },
      data: {
        name: remainingName,
        aliases: await aliasesFromExpressions(tx, expression.ingredientId, remainingName)
      }
    });
  });
};

export const backfillCatalog = async (
  db: PrismaClient,
  householdId: string
): Promise<CatalogBackfillResult> => {
  const rows = await db.recipeIngredient.findMany({
    where: { ingredientId: null, recipe: { householdId } },
    select: { id: true, name: true }
  });
  const all = await db.ingredient.findMany({ where: { householdId } });
  let linkedCount = 0;

  for (const row of rows) {
    const key = normalizeIngredientName(row.name);
    let match = all.find(
      (entry) =>
        normalizeIngredientName(entry.name) === key ||
        entry.aliases.some((alias) => normalizeIngredientName(alias) === key)
    );
    if (!match && key) {
      match = await db.ingredient.create({
        data: { householdId, name: row.name.trim(), status: 'pending', aliases: [] }
      });
      all.push(match);
    }
    if (match) {
      const name = row.name.trim();
      const expression = await db.ingredientExpression.upsert({
        where: { ingredientId_name: { ingredientId: match.id, name } },
        create: { ingredientId: match.id, name },
        update: {}
      });
      if (normalizeIngredientName(name) !== normalizeIngredientName(match.name)) {
        const aliases = mergeIngredientAliases(match, { name, aliases: [] });
        await db.ingredient.update({ where: { id: match.id }, data: { aliases } });
        match.aliases = aliases;
      }
      await db.recipeIngredient.update({
        where: { id: row.id },
        data: { ingredientId: match.id, expressionId: expression.id }
      });
      linkedCount++;
    }
  }

  return {
    linkedCount,
    pendingCount: all.filter((entry) => entry.status === 'pending').length
  };
};
