import { Data } from 'effect';

export class PlanServiceError extends Data.TaggedError('PlanServiceError')<{
  message: string;
  cause: unknown;
}> {}
