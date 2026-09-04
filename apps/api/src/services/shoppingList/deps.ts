import { Layer } from 'effect';
import type { ShoppingListRepository } from '../../repositories/shoppingList/repository.js';
import { ShoppingListService, ShoppingListServiceLive } from './service.js';

export const makeShoppingListServiceDeps = (
  shoppingListRepository: Layer.Layer<ShoppingListRepository>
): Layer.Layer<ShoppingListService> =>
  ShoppingListServiceLive.pipe(Layer.provide(shoppingListRepository));
