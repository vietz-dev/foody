import { Context, Effect, Layer } from 'effect';
import { PrismaService } from '../../infrastructure/prisma.js';
import type { PrismaClient } from '../../generated/prisma/client.js';
import { getErrorMessage } from '../utils.js';
import { backfillCatalog } from '../catalog/internal.js';
import { ShoppingListRepositoryError } from './errors.js';
import { buildShoppingList } from './internal.js';
import type { IShoppingListRepository, ShoppingList } from './types.js';

export async function loadShoppingList(
  db: PrismaClient,
  householdId: string
): Promise<ShoppingList> {
  const findItems = () =>
    db.weeklyPlanItem.findMany({
      where: { householdId, selected: true },
      include: { recipe: { include: { ingredients: true } } }
    });
  let items = await findItems();

  // Recipes saved before the catalog rollout have no ingredient IDs. Repair them
  // before grouping so they can use canonical names and Picnic mappings.
  if (
    items.some((item) => item.recipe.ingredients.some((ingredient) => !ingredient.ingredientId))
  ) {
    await backfillCatalog(db, householdId);
    items = await findItems();
  }

  const catalog = await db.ingredient.findMany({ where: { householdId } });
  return buildShoppingList(items, catalog);
}

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
          try: () => loadShoppingList(db, householdId),
          catch: (error) =>
            new ShoppingListRepositoryError({ message: getErrorMessage(error), cause: error })
        })
    };

    return ShoppingListRepository.of(repository);
  })
);
