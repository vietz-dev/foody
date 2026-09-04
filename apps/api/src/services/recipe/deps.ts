import { Layer } from 'effect';
import type { RecipeRepository } from '../../repositories/recipe/repository.js';
import { RecipeService, RecipeServiceLive } from './service.js';

export const makeRecipeServiceDeps = (
  recipeRepository: Layer.Layer<RecipeRepository>
): Layer.Layer<RecipeService> => RecipeServiceLive.pipe(Layer.provide(recipeRepository));
