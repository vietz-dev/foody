import { suggestPackCount } from '../../services/picnic/quantity.js';
import { normalizeIngredientName } from '../utils.js';
import type { ShoppingList, ShoppingListItem } from './types.js';

type CatalogEntry = {
  id: string;
  name: string;
  isStaple: boolean;
  picnicProductId?: string | null;
  picnicProductName?: string | null;
  picnicUnitQuantity?: string | null;
};
type PlannedRecipe = {
  recipeId: string;
  portions: number;
  recipe: {
    ingredients: Array<{
      ingredientId: string | null;
      name: string;
      quantity: unknown;
      unit: string | null;
    }>;
  };
};
type AggregatedItem = Omit<ShoppingListItem, 'recipeCount' | 'picnic'> & { recipeIds: Set<string> };

export const buildShoppingList = (
  items: PlannedRecipe[],
  catalog: CatalogEntry[]
): ShoppingList => {
  const catalogById = new Map(catalog.map((entry) => [entry.id, entry]));
  const result: ShoppingList = { einkaufen: [], vorrat: [], nichtZugeordnet: [] };
  const aggregatedItems = new Map<string, AggregatedItem>();

  for (const item of items) {
    for (const ingredient of item.recipe.ingredients) {
      const key = ingredient.ingredientId
        ? `id:${ingredient.ingredientId}`
        : `raw:${normalizeIngredientName(ingredient.name)}`;
      const entry = aggregatedItems.get(key) ?? {
        ingredientId: ingredient.ingredientId,
        name: catalogById.get(ingredient.ingredientId ?? '')?.name ?? ingredient.name.trim(),
        quantities: [],
        recipeIds: new Set<string>(),
        unquantified: false
      };
      aggregatedItems.set(key, entry);
      entry.recipeIds.add(item.recipeId);
      if (ingredient.quantity == null) {
        entry.unquantified = true;
      } else {
        const unit = (ingredient.unit ?? '').trim();
        const existing = entry.quantities.find((quantity) => quantity.unit === unit);
        if (existing) existing.amount += Number(ingredient.quantity) * item.portions;
        else entry.quantities.push({ amount: Number(ingredient.quantity) * item.portions, unit });
      }
    }
  }

  for (const entry of aggregatedItems.values()) {
    const catalogEntry = catalogById.get(entry.ingredientId ?? '');
    const item: ShoppingListItem = {
      ingredientId: entry.ingredientId,
      name: entry.name,
      quantities: entry.quantities,
      recipeCount: entry.recipeIds.size,
      unquantified: entry.unquantified,
      picnic: catalogEntry?.picnicProductId
        ? {
            id: catalogEntry.picnicProductId,
            name: catalogEntry.picnicProductName ?? '',
            unitQuantity: catalogEntry.picnicUnitQuantity ?? '',
            count: suggestPackCount(entry.quantities, catalogEntry.picnicUnitQuantity)
          }
        : null
    };
    const section =
      entry.ingredientId && catalogEntry?.isStaple
        ? result.vorrat
        : entry.ingredientId
          ? result.einkaufen
          : result.nichtZugeordnet;
    section.push(item);
  }

  for (const section of Object.values(result)) {
    section.sort((itemA, itemB) => itemA.name.localeCompare(itemB.name));
  }

  return result;
};
