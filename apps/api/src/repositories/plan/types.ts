import type { Effect } from 'effect';
import type { PlanRepositoryError } from './errors.js';

export type IPlanRepository = {
  list: (householdId: string) => Effect.Effect<unknown[], PlanRepositoryError>;
  toggle: (householdId: string, recipeId: string) => Effect.Effect<boolean, PlanRepositoryError>;
  portions: (
    householdId: string,
    recipeId: string,
    portions: number
  ) => Effect.Effect<number, PlanRepositoryError>;
};
