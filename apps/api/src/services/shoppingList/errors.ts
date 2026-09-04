import { Data } from 'effect';

export class ShoppingListServiceError extends Data.TaggedError('ShoppingListServiceError')<{
  message: string;
  cause: unknown;
}> {}
