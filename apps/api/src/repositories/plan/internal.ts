export const normalizePortions = (portions: number): number =>
  Math.max(1, Number.isFinite(Math.trunc(portions)) ? Math.trunc(portions) : 1);

export const addPlanState = <
  Recipe extends { id: string },
  PlanItem extends {
    recipeId: string;
    selected: boolean;
    selectedAt: Date | null;
    portions: number;
  }
>(
  recipes: Recipe[],
  items: PlanItem[]
) => {
  const itemsByRecipeId = new Map(items.map((item) => [item.recipeId, item]));
  return recipes.map((recipe) => ({
    ...recipe,
    planned: itemsByRecipeId.get(recipe.id)?.selected ?? false,
    plannedAt: itemsByRecipeId.get(recipe.id)?.selectedAt ?? null,
    portions: itemsByRecipeId.get(recipe.id)?.portions ?? 2
  }));
};
