import type { Effect } from 'effect';
import type { RecipeInput } from '@foody/contracts';
import type { RecipeRepositoryError } from './errors.js';

export type IRecipeRepository = {
  list: (householdId: string) => Effect.Effect<unknown[], RecipeRepositoryError>;
  get: (householdId: string, id: string) => Effect.Effect<unknown | null, RecipeRepositoryError>;
  create: (householdId: string, data: RecipeInput) => Effect.Effect<unknown, RecipeRepositoryError>;
  update: (
    householdId: string,
    id: string,
    data: RecipeInput
  ) => Effect.Effect<void, RecipeRepositoryError>;
  delete: (householdId: string, id: string) => Effect.Effect<void, RecipeRepositoryError>;
};

export const recipeDetails = {
  ingredients: { orderBy: { sortOrder: 'asc' as const } },
  steps: { orderBy: { sortOrder: 'asc' as const } }
};
