import { Context, Effect, Layer } from 'effect';
import { PrismaService } from '../../infrastructure/prisma.js';
import { tryRepositoryPromise } from '../utils.js';
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
        tryRepositoryPromise(async () => {
          const [recipes, items] = await Promise.all([
            db.recipe.findMany({ where: { householdId }, orderBy: { name: 'asc' } }),
            db.weeklyPlanItem.findMany({ where: { householdId } })
          ]);
          return addPlanState(recipes, items);
        }, PlanRepositoryError),
      toggle: (householdId, recipeId) =>
        tryRepositoryPromise(async () => {
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
        }, PlanRepositoryError),
      portions: (householdId, recipeId, portions) =>
        tryRepositoryPromise(async () => {
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
        }, PlanRepositoryError)
    };

    return PlanRepository.of(repository);
  })
);
