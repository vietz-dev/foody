import { Context, Effect, Layer } from 'effect';
import type { RecipeInput } from '@foody/contracts';
import { RecipeRepository } from '../../repositories/recipe/repository.js';
import { RecipeServiceError } from './errors.js';
import { mapRecipeServiceError } from './internal.js';
import { mapRecipe, mapRecipeDetails } from './utils.js';

export type IRecipeService = {
  list: (householdId: string) => Effect.Effect<any[], RecipeServiceError>;
  get: (householdId: string, id: string) => Effect.Effect<any | null, RecipeServiceError>;
  create: (householdId: string, input: RecipeInput) => Effect.Effect<any, RecipeServiceError>;
  update: (
    householdId: string,
    id: string,
    input: RecipeInput
  ) => Effect.Effect<{ success: true }, RecipeServiceError>;
  delete: (householdId: string, id: string) => Effect.Effect<{ success: true }, RecipeServiceError>;
};

export class RecipeService extends Context.Tag('RecipeService')<RecipeService, IRecipeService>() {}

export const RecipeServiceLive = Layer.effect(
  RecipeService,
  Effect.gen(function* () {
    const repository = yield* RecipeRepository;
    const service: IRecipeService = {
      list: (householdId) =>
        repository.list(householdId).pipe(
          Effect.map((rows) => rows.map(mapRecipe)),
          Effect.mapError(mapRecipeServiceError)
        ),
      get: (householdId, id) =>
        repository.get(householdId, id).pipe(
          Effect.map((row) => (row ? mapRecipeDetails(row) : null)),
          Effect.mapError(mapRecipeServiceError)
        ),
      create: (householdId, input) =>
        repository
          .create(householdId, input)
          .pipe(Effect.map(mapRecipeDetails), Effect.mapError(mapRecipeServiceError)),
      update: (householdId, id, input) =>
        repository
          .update(householdId, id, input)
          .pipe(Effect.as({ success: true as const }), Effect.mapError(mapRecipeServiceError)),
      delete: (householdId, id) =>
        repository
          .delete(householdId, id)
          .pipe(Effect.as({ success: true as const }), Effect.mapError(mapRecipeServiceError))
    };

    return RecipeService.of(service);
  })
);
