import { Effect } from 'effect';

export const getErrorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : String(error);

export const normalizeIngredientName = (value: string): string =>
  value.trim().toLowerCase().replace(/\s+/g, ' ');

type RepositoryErrorConstructor<E> = new (args: { message: string; cause: unknown }) => E;

export const tryRepositoryPromise = <A, E>(
  tryPromise: () => PromiseLike<A>,
  ErrorType: RepositoryErrorConstructor<E>
) =>
  Effect.tryPromise({
    try: tryPromise,
    catch: (cause) => new ErrorType({ message: getErrorMessage(cause), cause })
  });
