import { prisma } from '$lib/server/prisma';
import {
	buildShoppingList,
	type CatalogIngredientInput,
	type PlanRecipeInput,
	type ShoppingList
} from './build-shopping-list';

export type { ShoppingList } from './build-shopping-list';

/**
 * getShoppingList — data-layer boundary for the weekly shopping list.
 *
 * Loads the currently selected weekly-plan recipes (with their ingredients,
 * quantities normalized per 1 portion) and the household's ingredient catalog,
 * then delegates all aggregation/scaling logic to the pure `buildShoppingList`.
 *
 * Kept self-contained so this function can later become a webhook boundary
 * without touching callers.
 */
export async function getShoppingList(householdId: string): Promise<ShoppingList> {
	const [planItems, catalog] = await Promise.all([
		prisma.weeklyPlanItem.findMany({
			where: { householdId, selected: true },
			include: { recipe: { include: { ingredients: true } } }
		}),
		prisma.ingredient.findMany({ where: { householdId } })
	]);

	const recipes: PlanRecipeInput[] = planItems.map((planItem) => ({
		recipeId: planItem.recipe.id,
		recipeName: planItem.recipe.name,
		portions: planItem.portions,
		ingredients: planItem.recipe.ingredients.map((ing) => ({
			name: ing.name,
			quantity: ing.quantity != null ? ing.quantity.toNumber() : null,
			unit: ing.unit,
			ingredientId: ing.ingredientId
		}))
	}));

	const catalogInput: CatalogIngredientInput[] = catalog.map((entry) => ({
		id: entry.id,
		name: entry.name,
		isStaple: entry.isStaple
	}));

	return buildShoppingList(recipes, catalogInput);
}
