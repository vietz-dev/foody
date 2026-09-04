import { Context, Effect, Layer } from 'effect';
import { PlanRepository } from '../../repositories/plan/repository.js';
import { mapRecipe } from '../recipe/utils.js';
import { PlanServiceError } from './errors.js';
import { mapPlanDate, mapPlanServiceError } from './internal.js';

export type IPlanService = {
  list: (householdId: string) => Effect.Effect<any[], PlanServiceError>;
  toggle: (
    householdId: string,
    recipeId: string
  ) => Effect.Effect<{ selected: boolean }, PlanServiceError>;
  portions: (
    householdId: string,
    recipeId: string,
    portions: number
  ) => Effect.Effect<{ portions: number }, PlanServiceError>;
};

export class PlanService extends Context.Tag('PlanService')<PlanService, IPlanService>() {}

export const PlanServiceLive = Layer.effect(
  PlanService,
  Effect.gen(function* () {
    const repository = yield* PlanRepository;
    const service: IPlanService = {
      list: (householdId) =>
        repository.list(householdId).pipe(
          Effect.map((rows) =>
            rows.map((row: any) => ({
              ...mapRecipe(row),
              planned: row.planned,
              plannedAt: mapPlanDate(row.plannedAt),
              portions: row.portions
            }))
          ),
          Effect.mapError(mapPlanServiceError)
        ),
      toggle: (householdId, recipeId) =>
        repository.toggle(householdId, recipeId).pipe(
          Effect.map((selected) => ({ selected })),
          Effect.mapError(mapPlanServiceError)
        ),
      portions: (householdId, recipeId, value) =>
        repository.portions(householdId, recipeId, value).pipe(
          Effect.map((portions) => ({ portions })),
          Effect.mapError(mapPlanServiceError)
        )
    };

    return PlanService.of(service);
  })
);
