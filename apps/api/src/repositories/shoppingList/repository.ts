import { Context, Effect, Layer } from 'effect';
import { PrismaService } from '../../infrastructure/prisma.js';
import { getErrorMessage } from '../utils.js';
import { ShoppingListRepositoryError } from './errors.js';
import { buildShoppingList } from './internal.js';
import type { IShoppingListRepository } from './types.js';

export class ShoppingListRepository extends Context.Tag('ShoppingListRepository')<
  ShoppingListRepository,
  IShoppingListRepository
>() {}

export const ShoppingListRepositoryLive = Layer.effect(
  ShoppingListRepository,
  Effect.gen(function* () {
    const db = yield* PrismaService;
    const repository: IShoppingListRepository = {
      get: (householdId) =>
        Effect.tryPromise({
          try: async () => {
            const [items, catalog] = await Promise.all([
              db.weeklyPlanItem.findMany({
                where: { householdId, selected: true },
                include: { recipe: { include: { ingredients: true } } }
              }),
              db.ingredient.findMany({ where: { householdId } })
            ]);
            return buildShoppingList(items, catalog);
          },
          catch: (error) =>
            new ShoppingListRepositoryError({ message: getErrorMessage(error), cause: error })
        })
    };

    return ShoppingListRepository.of(repository);
  })
);
