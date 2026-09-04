import { Data } from 'effect';

export class CatalogServiceError extends Data.TaggedError('CatalogServiceError')<{
  message: string;
  cause: unknown;
}> {}
