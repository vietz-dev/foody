import { Data } from 'effect';

export class PicnicServiceError extends Data.TaggedError('PicnicServiceError')<{
  message: string;
  cause: unknown;
}> {}

/** No Picnic account linked, or the stored session was rejected by Picnic. */
export class PicnicNotConnectedError extends Data.TaggedError('PicnicNotConnectedError')<{
  message: string;
}> {}
