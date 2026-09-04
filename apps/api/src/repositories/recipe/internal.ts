import type { PrismaClient } from '../../generated/prisma/client.js';
import type { RecipeInput } from '@foody/contracts';
import { normalizeIngredientName } from '../utils.js';

type IngredientClient = Pick<PrismaClient, 'ingredient'>;

export async function resolveIngredientIds(
  db: IngredientClient,
  householdId: string,
  names: string[]
): Promise<Map<string, string>> {
  const catalog = await db.ingredient.findMany({ where: { householdId } });
  const result = new Map<string, string>();

  for (const raw of names) {
    const key = normalizeIngredientName(raw);
    if (!key || result.has(raw)) continue;

    let match = catalog.find(
      (entry) =>
        normalizeIngredientName(entry.name) === key ||
        entry.aliases.some((alias) => normalizeIngredientName(alias) === key)
    );
    if (!match) {
      match = await db.ingredient.create({
        data: { householdId, name: raw.trim(), status: 'pending', aliases: [] }
      });
      catalog.push(match);
    }
    result.set(raw, match.id);
  }

  return result;
}

export const buildRecipeData = (data: RecipeInput) => ({
  name: data.name,
  bookTitle: data.bookTitle,
  bookPage: data.bookPage,
  declaredServings: data.servings,
  prepTimeMinutes: data.prepTimeMinutes,
  notes: data.notes
});

export const buildRecipeIngredients = (data: RecipeInput, ingredientIds: Map<string, string>) =>
  data.ingredients.map((ingredient, index) => ({
    name: ingredient.name,
    quantity: ingredient.quantity / Math.max(1, data.servings),
    unit: ingredient.unit,
    sortOrder: index,
    ingredientId: ingredientIds.get(ingredient.name)
  }));

export const buildRecipeSteps = (data: RecipeInput) =>
  data.steps.map((step, index) => ({ description: step.description, sortOrder: index }));
