import { Data } from 'effect';

export class RecipeServiceError extends Data.TaggedError('RecipeServiceError')<{
  message: string;
  cause: unknown;
}> {}
