import { Data } from 'effect';

export class PicnicRepositoryError extends Data.TaggedError('PicnicRepositoryError')<{
  message: string;
  cause: unknown;
}> {}
