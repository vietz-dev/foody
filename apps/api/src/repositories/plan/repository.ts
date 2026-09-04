import { Context, Effect, Layer } from 'effect';
import { PrismaService } from '../../infrastructure/prisma.js';
import { getErrorMessage } from '../utils.js';
import { PlanRepositoryError } from './errors.js';
import { addPlanState, normalizePortions } from './internal.js';
import type { IPlanRepository } from './types.js';

export class PlanRepository extends Context.Tag('PlanRepository')<
  PlanRepository,
  IPlanRepository
>() {}

export const PlanRepositoryLive = Layer.effect(
  PlanRepository,
  Effect.gen(function* () {
    const db = yield* PrismaService;
    const repository: IPlanRepository = {
      list: (householdId) =>
        Effect.tryPromise({
          try: async () => {
            const [recipes, items] = await Promise.all([
              db.recipe.findMany({ where: { householdId }, orderBy: { name: 'asc' } }),
              db.weeklyPlanItem.findMany({ where: { householdId } })
            ]);
            return addPlanState(recipes, items);
          },
          catch: (error) =>
            new PlanRepositoryError({ message: getErrorMessage(error), cause: error })
        }),
      toggle: (householdId, recipeId) =>
        Effect.tryPromise({
          try: async () => {
            const existing = await db.weeklyPlanItem.findUnique({
              where: { householdId_recipeId: { householdId, recipeId } }
            });
            if (existing) {
              const selected = !existing.selected;
              await db.weeklyPlanItem.update({
                where: { id: existing.id },
                data: selected ? { selected, selectedAt: new Date() } : { selected }
              });
              return selected;
            }
            await db.weeklyPlanItem.create({
              data: { householdId, recipeId, selected: true, selectedAt: new Date() }
            });
            return true;
          },
          catch: (error) =>
            new PlanRepositoryError({ message: getErrorMessage(error), cause: error })
        }),
      portions: (householdId, recipeId, portions) =>
        Effect.tryPromise({
          try: async () => {
            const value = normalizePortions(portions);
            const item = await db.weeklyPlanItem.findUnique({
              where: { householdId_recipeId: { householdId, recipeId } }
            });
            if (item) {
              await db.weeklyPlanItem.update({
                where: { id: item.id },
                data: { portions: value }
              });
            }
            return value;
          },
          catch: (error) =>
            new PlanRepositoryError({ message: getErrorMessage(error), cause: error })
        })
    };

    return PlanRepository.of(repository);
  })
);
