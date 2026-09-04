import { PlanServiceError } from './errors.js';

export const mapPlanDate = (value: Date | null | undefined): string | null =>
  value?.toISOString() ?? null;

export const mapPlanServiceError = (error: { message: string }): PlanServiceError =>
  new PlanServiceError({ message: error.message, cause: error });
