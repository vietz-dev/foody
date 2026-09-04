export const mapRecipe = (value: any) => ({
  ...value,
  createdAt: value.createdAt.toISOString(),
  sourceUrl: value.sourceUrl ?? null,
  bookTitle: value.bookTitle ?? null,
  bookPage: value.bookPage ?? null,
  servings: value.servings ?? null,
  declaredServings: value.declaredServings ?? null,
  prepTimeMinutes: value.prepTimeMinutes ?? null,
  notes: value.notes ?? null
});

export const mapRecipeDetails = (value: any) => ({
  ...mapRecipe(value),
  ingredients: value.ingredients.map((ingredient: any) => ({
    ...ingredient,
    quantity: ingredient.quantity == null ? null : Number(ingredient.quantity),
    unit: ingredient.unit ?? null,
    ingredientId: ingredient.ingredientId ?? null
  })),
  steps: value.steps
});
