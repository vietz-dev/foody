import { Context, Effect, Layer } from 'effect';
import type { RecipeInput } from '@foody/contracts';
import {
  CatalogRepository,
  CatalogRepositoryLive,
  PlanRepository,
  PlanRepositoryLive,
  RecipeRepository,
  RecipeRepositoryLive,
  ShoppingRepository,
  ShoppingRepositoryLive
} from './repositories.js';

const date = (value: Date | null | undefined) => value?.toISOString() ?? null;
const recipe = (value: any) => ({
  ...value,
  createdAt: value.createdAt.toISOString(),
  sourceUrl: value.sourceUrl ?? null,
  bookTitle: value.bookTitle ?? null,
  bookPage: value.bookPage ?? null,
  servings: value.servings ?? null,
  declaredServings: value.declaredServings ?? null,
  prepTimeMinutes: value.prepTimeMinutes ?? null,
  notes: value.notes ?? null
});
const details = (value: any) => ({
  ...recipe(value),
  ingredients: value.ingredients.map((i: any) => ({
    ...i,
    quantity: i.quantity == null ? null : Number(i.quantity),
    unit: i.unit ?? null,
    ingredientId: i.ingredientId ?? null
  })),
  steps: value.steps
});

export class RecipeService extends Context.Tag('RecipeService')<
  RecipeService,
  {
    list: (householdId: string) => Effect.Effect<any[], unknown>;
    get: (householdId: string, id: string) => Effect.Effect<any | null, unknown>;
    create: (householdId: string, input: RecipeInput) => Effect.Effect<any, unknown>;
    update: (
      householdId: string,
      id: string,
      input: RecipeInput
    ) => Effect.Effect<{ success: true }, unknown>;
    delete: (householdId: string, id: string) => Effect.Effect<{ success: true }, unknown>;
  }
>() {}
export const RecipeServiceLive = Layer.effect(
  RecipeService,
  Effect.gen(function* () {
    const repository = yield* RecipeRepository;
    return RecipeService.of({
      list: (h) => repository.list(h).pipe(Effect.map((rows) => rows.map(recipe))),
      get: (h, id) => repository.get(h, id).pipe(Effect.map((row) => (row ? details(row) : null))),
      create: (h, input) => repository.create(h, input).pipe(Effect.map(details)),
      update: (h, id, input) =>
        repository.update(h, id, input).pipe(Effect.as({ success: true as const })),
      delete: (h, id) => repository.delete(h, id).pipe(Effect.as({ success: true as const }))
    });
  })
);

export class PlanService extends Context.Tag('PlanService')<
  PlanService,
  {
    list: (householdId: string) => Effect.Effect<any[], unknown>;
    toggle: (
      householdId: string,
      recipeId: string
    ) => Effect.Effect<{ selected: boolean }, unknown>;
    portions: (
      householdId: string,
      recipeId: string,
      portions: number
    ) => Effect.Effect<{ portions: number }, unknown>;
  }
>() {}
export const PlanServiceLive = Layer.effect(
  PlanService,
  Effect.gen(function* () {
    const repository = yield* PlanRepository;
    return PlanService.of({
      list: (h) =>
        repository.list(h).pipe(
          Effect.map((rows) =>
            rows.map((r: any) => ({
              ...recipe(r),
              planned: r.planned,
              plannedAt: date(r.plannedAt),
              portions: r.portions
            }))
          )
        ),
      toggle: (h, id) => repository.toggle(h, id).pipe(Effect.map((selected) => ({ selected }))),
      portions: (h, id, value) =>
        repository.portions(h, id, value).pipe(Effect.map((portions) => ({ portions })))
    });
  })
);

export class CatalogService extends Context.Tag('CatalogService')<
  CatalogService,
  {
    list: (householdId: string) => Effect.Effect<any, unknown>;
    overview: (householdId: string) => Effect.Effect<any, unknown>;
    confirm: (
      householdId: string,
      id: string,
      data: any
    ) => Effect.Effect<{ success: true }, unknown>;
    merge: (
      householdId: string,
      sourceId: string,
      targetId: string
    ) => Effect.Effect<{ success: true }, unknown>;
    backfill: (
      householdId: string
    ) => Effect.Effect<{ success: true; linkedCount: number; pendingCount: number }, unknown>;
  }
>() {}
export const CatalogServiceLive = Layer.effect(
  CatalogService,
  Effect.gen(function* () {
    const repository = yield* CatalogRepository;
    return CatalogService.of({
      list: (h) => repository.list(h),
      overview: (h) => repository.overview(h),
      confirm: (h, id, data) =>
        repository.confirm(h, id, data).pipe(Effect.as({ success: true as const })),
      merge: (h, s, t) => repository.merge(h, s, t).pipe(Effect.as({ success: true as const })),
      backfill: (h) =>
        repository.backfill(h).pipe(Effect.map((r) => ({ success: true as const, ...r })))
    });
  })
);

export class ShoppingListService extends Context.Tag('ShoppingListService')<
  ShoppingListService,
  { get: (householdId: string) => Effect.Effect<any, unknown> }
>() {}
export const ShoppingListServiceLive = Layer.effect(
  ShoppingListService,
  Effect.gen(function* () {
    const repository = yield* ShoppingRepository;
    return ShoppingListService.of({ get: (h) => repository.get(h) });
  })
);
