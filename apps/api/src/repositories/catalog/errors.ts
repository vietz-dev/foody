import { Data } from 'effect';

export class CatalogRepositoryError extends Data.TaggedError('CatalogRepositoryError')<{
  message: string;
  cause: unknown;
}> {}
