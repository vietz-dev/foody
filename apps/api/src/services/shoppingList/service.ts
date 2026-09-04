import { Context, Effect, Layer } from 'effect';
import { ShoppingListRepository } from '../../repositories/shoppingList/repository.js';
import type { ShoppingList } from '../../repositories/shoppingList/types.js';
import { ShoppingListServiceError } from './errors.js';
import { mapShoppingListServiceError } from './internal.js';

export type IShoppingListService = {
  get: (householdId: string) => Effect.Effect<ShoppingList, ShoppingListServiceError>;
};

export class ShoppingListService extends Context.Tag('ShoppingListService')<
  ShoppingListService,
  IShoppingListService
>() {}

export const ShoppingListServiceLive = Layer.effect(
  ShoppingListService,
  Effect.gen(function* () {
    const repository = yield* ShoppingListRepository;
    return ShoppingListService.of({
      get: (householdId) =>
        repository.get(householdId).pipe(Effect.mapError(mapShoppingListServiceError))
    });
  })
);
