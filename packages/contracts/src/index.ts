import { oc } from '@orpc/contract';
import { z } from 'zod';

const id = z.string().min(1);
const ingredient = z.object({ quantity: z.number(), unit: z.string(), name: z.string().min(1) });
const step = z.object({ description: z.string().min(1) });
const recipe = z.object({
  id,
  householdId: id,
  name: z.string(),
  sourceType: z.enum(['website', 'book', 'video']),
  sourceUrl: z.string().nullable(),
  bookTitle: z.string().nullable(),
  bookPage: z.number().int().nullable(),
  servings: z.number().int().nullable(),
  declaredServings: z.number().int().nullable(),
  prepTimeMinutes: z.number().int().nullable(),
  notes: z.string().nullable(),
  createdAt: z.string()
});
const recipeDetails = recipe.extend({
  ingredients: z.array(
    z.object({
      id,
      name: z.string(),
      quantity: z.number().nullable(),
      unit: z.string().nullable(),
      isRawText: z.boolean(),
      sortOrder: z.number().int(),
      ingredientId: id.nullable()
    })
  ),
  steps: z.array(z.object({ id, description: z.string(), sortOrder: z.number().int() }))
});
const recipeInput = z.object({
  name: z.string().min(1),
  bookTitle: z.string().optional(),
  bookPage: z.number().int().optional(),
  servings: z.number().int().min(1),
  prepTimeMinutes: z.number().int().optional(),
  notes: z.string().optional(),
  ingredients: z.array(ingredient),
  steps: z.array(step)
});
const planRecipe = recipe.extend({
  planned: z.boolean(),
  plannedAt: z.string().nullable(),
  portions: z.number().int(),
  declaredServings: z.number().int().nullable()
});
const picnicProductRef = z.object({ id, name: z.string(), unitQuantity: z.string() });
const picnicProduct = picnicProductRef.extend({
  price: z.number().int(),
  imageId: z.string().nullable()
});
const shoppingListItem = z.object({
  ingredientId: id.nullable(),
  name: z.string(),
  quantities: z.array(z.object({ amount: z.number(), unit: z.string() })),
  recipeCount: z.number().int(),
  unquantified: z.boolean(),
  /** Household mapping to a Picnic product plus the suggested pack count. */
  picnic: picnicProductRef.extend({ count: z.number().int() }).nullable()
});
const picnicConnectResult = z.discriminatedUnion('status', [
  z.object({ status: z.enum(['connected', '2fa_required']) }),
  z.object({ status: z.literal('failed'), message: z.string() })
]);
const catalogEntry = z.object({
  id,
  name: z.string(),
  isStaple: z.boolean(),
  aliases: z.array(z.string())
});

export const contract = {
  recipes: {
    list: oc.input(z.object({})).output(z.array(recipe)),
    get: oc.input(z.object({ id })).output(recipeDetails.nullable()),
    create: oc.input(recipeInput).output(recipeDetails),
    update: oc
      .input(z.object({ id }).extend(recipeInput.shape))
      .output(z.object({ success: z.literal(true) })),
    delete: oc.input(z.object({ id })).output(z.object({ success: z.literal(true) })),
    scan: oc.input(z.object({ images: z.array(z.string()).min(1) })).output(z.unknown())
  },
  plan: {
    list: oc.input(z.object({})).output(z.array(planRecipe)),
    toggle: oc.input(z.object({ recipeId: id })).output(z.object({ selected: z.boolean() })),
    setPortions: oc
      .input(z.object({ recipeId: id, portions: z.number() }))
      .output(z.object({ portions: z.number().int() }))
  },
  shoppingList: {
    get: oc.input(z.object({})).output(
      z.object({
        einkaufen: z.array(shoppingListItem),
        vorrat: z.array(shoppingListItem),
        nichtZugeordnet: z.array(shoppingListItem)
      })
    )
  },
  catalog: {
    list: oc.input(z.object({})).output(
      z.object({
        pending: z.array(catalogEntry),
        confirmed: z.array(catalogEntry),
        suggestions: z.record(id, catalogEntry.nullable())
      })
    ),
    confirm: oc
      .input(z.object({ id, name: z.string().optional(), isStaple: z.boolean().optional() }))
      .output(z.object({ success: z.literal(true) })),
    merge: oc
      .input(z.object({ sourceId: id, targetId: id }))
      .output(z.object({ success: z.literal(true) }))
  },
  picnic: {
    status: oc.input(z.object({})).output(
      z.object({
        status: z.enum(['disconnected', 'pending_2fa', 'connected']),
        email: z.string().nullable()
      })
    ),
    connect: oc
      .input(z.object({ email: z.string().email(), password: z.string().min(1) }))
      .output(picnicConnectResult),
    verify2fa: oc.input(z.object({ code: z.string().min(1) })).output(picnicConnectResult),
    disconnect: oc.input(z.object({})).output(z.object({ success: z.literal(true) })),
    search: oc.input(z.object({ query: z.string().min(1) })).output(z.array(picnicProduct)),
    mapIngredient: oc
      .input(z.object({ ingredientId: id, product: picnicProductRef.nullable() }))
      .output(z.object({ success: z.literal(true) })),
    pushCart: oc
      .input(
        z.object({ items: z.array(z.object({ productId: id, count: z.number().int().min(1) })) })
      )
      .output(z.object({ added: z.number().int(), cartCount: z.number().int() }))
  },
  admin: {
    overview: oc.input(z.object({})).output(
      z.object({
        defaultServingRecipes: z.array(
          z.object({ id, name: z.string(), declaredServings: z.number().int().nullable() })
        ),
        pendingCount: z.number().int()
      })
    ),
    backfill: oc.input(z.object({})).output(
      z.object({
        success: z.literal(true),
        linkedCount: z.number().int(),
        pendingCount: z.number().int()
      })
    )
  }
};

export type Contract = typeof contract;
export type RecipeInput = z.infer<typeof recipeInput>;
export type Recipe = z.infer<typeof recipe>;
export type RecipeDetails = z.infer<typeof recipeDetails>;
export type PlanRecipe = z.infer<typeof planRecipe>;
export type ShoppingListItem = z.infer<typeof shoppingListItem>;
export type PicnicProduct = z.infer<typeof picnicProduct>;
export type PicnicProductRef = z.infer<typeof picnicProductRef>;
