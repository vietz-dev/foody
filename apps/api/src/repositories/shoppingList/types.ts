import type { Effect } from 'effect';
import type { ShoppingListRepositoryError } from './errors.js';

export type ShoppingList = {
  einkaufen: ShoppingListItem[];
  vorrat: ShoppingListItem[];
  nichtZugeordnet: ShoppingListItem[];
};

export type ShoppingListItem = {
  ingredientId: string | null;
  name: string;
  quantities: Array<{ amount: number; unit: string }>;
  recipeCount: number;
  unquantified: boolean;
};

export type IShoppingListRepository = {
  get: (householdId: string) => Effect.Effect<ShoppingList, ShoppingListRepositoryError>;
};
