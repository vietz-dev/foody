import { prisma } from './prisma';

export async function listRecipesWithPlanStatus(householdId: string) {
	const [recipes, planItems] = await Promise.all([
		prisma.recipe.findMany({ where: { householdId }, orderBy: { name: 'asc' } }),
		prisma.weeklyPlanItem.findMany({ where: { householdId } })
	]);

	const itemMap = new Map(planItems.map((item) => [item.recipeId, item]));

	return recipes.map((recipe) => {
		const item = itemMap.get(recipe.id);
		return {
			...recipe,
			planned: item?.selected ?? false,
			plannedAt: item?.selectedAt ?? null
		};
	});
}

export type RecipeWithPlanStatus = Awaited<ReturnType<typeof listRecipesWithPlanStatus>>[number];

export async function togglePlanItem(householdId: string, recipeId: string): Promise<boolean> {
	const existing = await prisma.weeklyPlanItem.findUnique({
		where: { householdId_recipeId: { householdId, recipeId } }
	});

	if (existing) {
		const selected = !existing.selected;
		await prisma.weeklyPlanItem.update({
			where: { id: existing.id },
			data: selected ? { selected, selectedAt: new Date() } : { selected }
		});
		return selected;
	}

	await prisma.weeklyPlanItem.create({
		data: { householdId, recipeId, selected: true, selectedAt: new Date() }
	});
	return true;
}
