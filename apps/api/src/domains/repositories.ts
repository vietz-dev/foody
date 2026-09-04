import { Context, Effect, Layer } from 'effect';
import { PrismaService } from '../infrastructure/prisma.js';

export class RecipeRepository extends Context.Tag('RecipeRepository')<
  RecipeRepository,
  {
    list: (householdId: string) => Effect.Effect<unknown[], unknown>;
    get: (householdId: string, id: string) => Effect.Effect<unknown | null, unknown>;
    create: (householdId: string, data: any) => Effect.Effect<unknown, unknown>;
    update: (householdId: string, id: string, data: any) => Effect.Effect<void, unknown>;
    delete: (householdId: string, id: string) => Effect.Effect<void, unknown>;
  }
>() {}

export const RecipeRepositoryLive = Layer.effect(
  RecipeRepository,
  Effect.gen(function* () {
    const db = yield* PrismaService;
    const details = {
      ingredients: { orderBy: { sortOrder: 'asc' as const } },
      steps: { orderBy: { sortOrder: 'asc' as const } }
    };
    return RecipeRepository.of({
      list: (householdId) =>
        Effect.tryPromise(() =>
          db.recipe.findMany({ where: { householdId }, orderBy: { createdAt: 'desc' } })
        ),
      get: (householdId, id) =>
        Effect.tryPromise(() =>
          db.recipe.findFirst({ where: { id, householdId }, include: details })
        ),
      create: (householdId, data) =>
        Effect.tryPromise(async () => {
          const ingredientIds = await resolveIngredientIds(
            db,
            householdId,
            data.ingredients.map((i: any) => i.name)
          );
          return db.recipe.create({
            data: {
              householdId,
              name: data.name,
              sourceType: 'book',
              bookTitle: data.bookTitle,
              bookPage: data.bookPage,
              servings: 1,
              declaredServings: data.servings,
              prepTimeMinutes: data.prepTimeMinutes,
              notes: data.notes,
              ingredients: {
                create: data.ingredients.map((i: any, n: number) => ({
                  name: i.name,
                  quantity: i.quantity / Math.max(1, data.servings),
                  unit: i.unit,
                  sortOrder: n,
                  ingredientId: ingredientIds.get(i.name)
                }))
              },
              steps: {
                create: data.steps.map((s: any, n: number) => ({
                  description: s.description,
                  sortOrder: n
                }))
              }
            },
            include: details
          });
        }),
      update: (householdId, id, data) =>
        Effect.tryPromise(() =>
          db
            .$transaction(async (tx: any) => {
              const recipe = await tx.recipe.findFirstOrThrow({ where: { id, householdId } });
              const ingredientIds = await resolveIngredientIds(
                tx,
                householdId,
                data.ingredients.map((i: any) => i.name)
              );
              await tx.recipe.update({
                where: { id: recipe.id },
                data: {
                  name: data.name,
                  bookTitle: data.bookTitle,
                  bookPage: data.bookPage,
                  declaredServings: data.servings,
                  prepTimeMinutes: data.prepTimeMinutes,
                  notes: data.notes
                }
              });
              await tx.recipeIngredient.deleteMany({ where: { recipeId: id } });
              await tx.recipeStep.deleteMany({ where: { recipeId: id } });
              await tx.recipeIngredient.createMany({
                data: data.ingredients.map((i: any, n: number) => ({
                  recipeId: id,
                  name: i.name,
                  quantity: i.quantity / Math.max(1, data.servings),
                  unit: i.unit,
                  sortOrder: n,
                  ingredientId: ingredientIds.get(i.name)
                }))
              });
              await tx.recipeStep.createMany({
                data: data.steps.map((s: any, n: number) => ({
                  recipeId: id,
                  description: s.description,
                  sortOrder: n
                }))
              });
            })
            .then(() => undefined)
        ),
      delete: (householdId, id) =>
        Effect.tryPromise(() =>
          db.recipe.deleteMany({ where: { id, householdId } }).then(() => undefined)
        )
    });
  })
);

export class PlanRepository extends Context.Tag('PlanRepository')<
  PlanRepository,
  {
    list: (householdId: string) => Effect.Effect<unknown[], unknown>;
    toggle: (householdId: string, recipeId: string) => Effect.Effect<boolean, unknown>;
    portions: (
      householdId: string,
      recipeId: string,
      portions: number
    ) => Effect.Effect<number, unknown>;
  }
>() {}

export const PlanRepositoryLive = Layer.effect(
  PlanRepository,
  Effect.gen(function* () {
    const db = yield* PrismaService;
    return PlanRepository.of({
      list: (householdId) =>
        Effect.tryPromise(async () => {
          const [recipes, items] = await Promise.all([
            db.recipe.findMany({ where: { householdId }, orderBy: { name: 'asc' } }),
            db.weeklyPlanItem.findMany({ where: { householdId } })
          ]);
          const map = new Map(items.map((i: any) => [i.recipeId, i]));
          return recipes.map((r: any) => ({
            ...r,
            planned: map.get(r.id)?.selected ?? false,
            plannedAt: map.get(r.id)?.selectedAt ?? null,
            portions: map.get(r.id)?.portions ?? 2
          }));
        }),
      toggle: (householdId, recipeId) =>
        Effect.tryPromise(async () => {
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
        }),
      portions: (householdId, recipeId, portions) =>
        Effect.tryPromise(async () => {
          const value = Math.max(
            1,
            Number.isFinite(Math.trunc(portions)) ? Math.trunc(portions) : 1
          );
          const item = await db.weeklyPlanItem.findUnique({
            where: { householdId_recipeId: { householdId, recipeId } }
          });
          if (item)
            await db.weeklyPlanItem.update({ where: { id: item.id }, data: { portions: value } });
          return value;
        })
    });
  })
);

export class CatalogRepository extends Context.Tag('CatalogRepository')<
  CatalogRepository,
  {
    list: (householdId: string) => Effect.Effect<any, unknown>;
    overview: (
      householdId: string
    ) => Effect.Effect<{ defaultServingRecipes: unknown[]; pendingCount: number }, unknown>;
    confirm: (householdId: string, id: string, data: any) => Effect.Effect<void, unknown>;
    merge: (
      householdId: string,
      sourceId: string,
      targetId: string
    ) => Effect.Effect<void, unknown>;
    backfill: (
      householdId: string
    ) => Effect.Effect<{ linkedCount: number; pendingCount: number }, unknown>;
  }
>() {}

const normalize = (value: string) => value.trim().toLowerCase().replace(/\s+/g, ' ');

async function resolveIngredientIds(db: any, householdId: string, names: string[]) {
  const catalog = await db.ingredient.findMany({ where: { householdId } });
  const result = new Map<string, string>();
  for (const raw of names) {
    const key = normalize(raw);
    if (!key || result.has(raw)) continue;
    let match = catalog.find(
      (entry: any) =>
        normalize(entry.name) === key ||
        entry.aliases.some((alias: string) => normalize(alias) === key)
    );
    if (!match) {
      match = await db.ingredient.create({
        data: { householdId, name: raw.trim(), status: 'pending', aliases: [] }
      });
      catalog.push(match);
    }
    result.set(raw, match.id);
  }
  return result;
}
export const CatalogRepositoryLive = Layer.effect(
  CatalogRepository,
  Effect.gen(function* () {
    const db = yield* PrismaService;
    const entries = (householdId: string) =>
      db.ingredient.findMany({
        where: { householdId },
        orderBy: { name: 'asc' },
        select: { id: true, name: true, isStaple: true, aliases: true, status: true }
      });
    return CatalogRepository.of({
      list: (householdId) =>
        Effect.tryPromise(async () => {
          const all = await entries(householdId);
          return {
            pending: all.filter((x: any) => x.status === 'pending'),
            confirmed: all.filter((x: any) => x.status === 'confirmed'),
            suggestions: {}
          };
        }),
      overview: (householdId) =>
        Effect.tryPromise(async () => {
          const [defaultServingRecipes, pendingCount] = await Promise.all([
            db.recipe.findMany({
              where: { householdId, OR: [{ declaredServings: null }, { declaredServings: 2 }] },
              orderBy: { name: 'asc' },
              select: { id: true, name: true, declaredServings: true }
            }),
            db.ingredient.count({ where: { householdId, status: 'pending' } })
          ]);
          return { defaultServingRecipes, pendingCount };
        }),
      confirm: (householdId, id, data) =>
        Effect.tryPromise(async () => {
          await db.ingredient.updateMany({
            where: { id, householdId },
            data: {
              status: 'confirmed',
              ...(data.name?.trim() ? { name: data.name.trim() } : {}),
              ...(data.isStaple === undefined ? {} : { isStaple: data.isStaple })
            }
          });
        }),
      merge: (householdId, sourceId, targetId) =>
        Effect.tryPromise(() =>
          db
            .$transaction(async (tx: any) => {
              const [source, target] = await Promise.all([
                tx.ingredient.findFirstOrThrow({ where: { id: sourceId, householdId } }),
                tx.ingredient.findFirstOrThrow({ where: { id: targetId, householdId } })
              ]);
              const known = new Set([normalize(target.name), ...target.aliases.map(normalize)]);
              const aliases = [...target.aliases];
              for (const value of [source.name, ...source.aliases])
                if (normalize(value) && !known.has(normalize(value))) {
                  known.add(normalize(value));
                  aliases.push(value.trim());
                }
              await tx.recipeIngredient.updateMany({
                where: { ingredientId: sourceId },
                data: { ingredientId: targetId }
              });
              await tx.ingredient.update({
                where: { id: targetId },
                data: { status: 'confirmed', aliases }
              });
              await tx.ingredient.delete({ where: { id: sourceId } });
            })
            .then(() => undefined)
        ),
      backfill: (householdId) =>
        Effect.tryPromise(async () => {
          const rows = await db.recipeIngredient.findMany({
            where: { ingredientId: null, recipe: { householdId } },
            select: { id: true, name: true }
          });
          const all = await db.ingredient.findMany({ where: { householdId } });
          let linkedCount = 0;
          for (const row of rows) {
            const key = normalize(row.name);
            let match = all.find(
              (x: any) =>
                normalize(x.name) === key || x.aliases.some((a: string) => normalize(a) === key)
            );
            if (!match && key) {
              match = await db.ingredient.create({
                data: { householdId, name: row.name.trim(), status: 'pending', aliases: [] }
              });
              all.push(match);
            }
            if (match) {
              await db.recipeIngredient.update({
                where: { id: row.id },
                data: { ingredientId: match.id }
              });
              linkedCount++;
            }
          }
          return {
            linkedCount,
            pendingCount: all.filter((x: any) => x.status === 'pending').length
          };
        })
    });
  })
);

export class ShoppingRepository extends Context.Tag('ShoppingRepository')<
  ShoppingRepository,
  { get: (householdId: string) => Effect.Effect<any, unknown> }
>() {}
export const ShoppingRepositoryLive = Layer.effect(
  ShoppingRepository,
  Effect.gen(function* () {
    const db = yield* PrismaService;
    return ShoppingRepository.of({
      get: (householdId) =>
        Effect.tryPromise(async () => {
          const [items, catalog] = await Promise.all([
            db.weeklyPlanItem.findMany({
              where: { householdId, selected: true },
              include: { recipe: { include: { ingredients: true } } }
            }),
            db.ingredient.findMany({ where: { householdId } })
          ]);
          const byId = new Map(catalog.map((x: any) => [x.id, x]));
          const result = {
            einkaufen: [] as any[],
            vorrat: [] as any[],
            nichtZugeordnet: [] as any[]
          };
          const map = new Map<string, any>();
          for (const item of items)
            for (const ing of item.recipe.ingredients) {
              const key = ing.ingredientId
                ? `id:${ing.ingredientId}`
                : `raw:${normalize(ing.name)}`;
              const entry = map.get(key) ?? {
                ingredientId: ing.ingredientId,
                name: byId.get(ing.ingredientId ?? '')?.name ?? ing.name.trim(),
                quantities: [],
                recipeIds: new Set<string>(),
                unquantified: false
              };
              map.set(key, entry);
              entry.recipeIds.add(item.recipeId);
              if (ing.quantity == null) entry.unquantified = true;
              else {
                const unit = (ing.unit ?? '').trim();
                const existing = entry.quantities.find((q: any) => q.unit === unit);
                if (existing) existing.amount += Number(ing.quantity) * item.portions;
                else entry.quantities.push({ amount: Number(ing.quantity) * item.portions, unit });
              }
            }
          for (const entry of map.values()) {
            const item = {
              ingredientId: entry.ingredientId,
              name: entry.name,
              quantities: entry.quantities,
              recipeCount: entry.recipeIds.size,
              unquantified: entry.unquantified
            };
            const catalogEntry = byId.get(entry.ingredientId ?? '');
            (entry.ingredientId && catalogEntry?.isStaple
              ? result.vorrat
              : entry.ingredientId
                ? result.einkaufen
                : result.nichtZugeordnet
            ).push(item);
          }
          for (const key of Object.keys(result))
            result[key as keyof typeof result].sort((a, b) => a.name.localeCompare(b.name));
          return result;
        })
    });
  })
);
