import { Data } from 'effect';

export class RecipeRepositoryError extends Data.TaggedError('RecipeRepositoryError')<{
  message: string;
  cause: unknown;
}> {}
