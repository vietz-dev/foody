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
      await tx.recipeIngredient.updateMany({
        where: { ingredientId: sourceId },
        data: { ingredientId: targetId }
      });
      target = { ...target, ...mergeIngredientData(target, source) };
      await tx.ingredient.delete({ where: { id: sourceId } });
    }

    await tx.ingredient.update({
      where: { id: targetId },
      data: {
        status: 'confirmed',
        name: canonicalName,
        aliases: mergeIngredientAliases(
          { name: canonicalName, aliases: target.aliases },
          { name: target.name, aliases: [] }
        ),
        isStaple: target.isStaple,
        picnicProductId: target.picnicProductId,
        picnicProductName: target.picnicProductName,
        picnicUnitQuantity: target.picnicUnitQuantity
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
      await db.recipeIngredient.update({
        where: { id: row.id },
        data: { ingredientId: match.id }
      });
      linkedCount++;
    }
  }

  return {
    linkedCount,
    pendingCount: all.filter((entry) => entry.status === 'pending').length
  };
};
