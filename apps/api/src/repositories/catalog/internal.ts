import { normalizeIngredientName } from '../utils.js';
import type { PrismaClient } from '../../generated/prisma/client.js';
import type { CatalogBackfillResult } from './types.js';

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
