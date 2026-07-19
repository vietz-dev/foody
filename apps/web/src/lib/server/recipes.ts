import { prisma } from './prisma';

export interface RecipeIngredientInput {
	quantity: number;
	unit: string;
	name: string;
}

export interface RecipeStepInput {
	description: string;
}

export interface CreateRecipeInput {
	householdId: string;
	name: string;
	bookTitle?: string;
	bookPage?: number;
	servings: number;
	prepTimeMinutes?: number;
	notes?: string;
	ingredients: RecipeIngredientInput[];
	steps: RecipeStepInput[];
}

export interface UpdateRecipeInput {
	name: string;
	bookTitle?: string;
	bookPage?: number;
	servings: number;
	prepTimeMinutes?: number;
	notes?: string;
	ingredients: RecipeIngredientInput[];
	steps: RecipeStepInput[];
}

export function listRecipes(householdId: string) {
	return prisma.recipe.findMany({
		where: { householdId },
		orderBy: { createdAt: 'desc' }
	});
}

export async function getRecipeWithDetails(recipeId: string) {
	const recipe = await prisma.recipe.findUnique({
		where: { id: recipeId },
		include: {
			ingredients: { orderBy: { sortOrder: 'asc' } },
			steps: { orderBy: { sortOrder: 'asc' } }
		}
	});
	if (!recipe) return null;

	// Decimal -> plain number, so callers never need to know about Prisma.Decimal.
	return {
		...recipe,
		ingredients: recipe.ingredients.map((ing) => ({
			...ing,
			quantity: ing.quantity != null ? ing.quantity.toNumber() : null
		}))
	};
}

export type RecipeWithDetails = NonNullable<Awaited<ReturnType<typeof getRecipeWithDetails>>>;

// Zutatenmengen werden beim Speichern immer auf 1 Portion normalisiert
// (recipe.servings ist danach konstant 1) — der Nutzer gibt die Portionenzahl
// des Original-Rezepts nur als Divisor an.
export function createRecipe(data: CreateRecipeInput) {
	const divisor = data.servings > 0 ? data.servings : 1;

	return prisma.recipe.create({
		data: {
			householdId: data.householdId,
			name: data.name,
			sourceType: 'book',
			bookTitle: data.bookTitle,
			bookPage: data.bookPage,
			servings: 1,
			prepTimeMinutes: data.prepTimeMinutes,
			notes: data.notes,
			ingredients: {
				create: data.ingredients.map((ing, i) => ({
					sortOrder: i,
					quantity: ing.quantity / divisor,
					unit: ing.unit,
					name: ing.name,
					isRawText: false
				}))
			},
			steps: {
				create: data.steps.map((step, i) => ({
					sortOrder: i,
					description: step.description
				}))
			}
		}
	});
}

export async function updateRecipe(recipeId: string, data: UpdateRecipeInput) {
	const divisor = data.servings > 0 ? data.servings : 1;

	await prisma.$transaction(async (tx) => {
		await tx.recipe.update({
			where: { id: recipeId },
			data: {
				name: data.name,
				bookTitle: data.bookTitle,
				bookPage: data.bookPage,
				prepTimeMinutes: data.prepTimeMinutes,
				notes: data.notes
			}
		});
		await tx.recipeIngredient.deleteMany({ where: { recipeId } });
		await tx.recipeStep.deleteMany({ where: { recipeId } });
		await tx.recipeIngredient.createMany({
			data: data.ingredients.map((ing, i) => ({
				recipeId,
				sortOrder: i,
				quantity: ing.quantity / divisor,
				unit: ing.unit,
				name: ing.name,
				isRawText: false
			}))
		});
		await tx.recipeStep.createMany({
			data: data.steps.map((step, i) => ({
				recipeId,
				sortOrder: i,
				description: step.description
			}))
		});
	});
}

export function deleteRecipe(recipeId: string) {
	// onDelete: Cascade on RecipeIngredient/RecipeStep/WeeklyPlanItem handles the rest.
	return prisma.recipe.delete({ where: { id: recipeId } });
}
