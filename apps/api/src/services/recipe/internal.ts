import { RecipeServiceError } from './errors.js';

export const mapRecipeServiceError = (error: { message: string }): RecipeServiceError =>
  new RecipeServiceError({ message: error.message, cause: error });
