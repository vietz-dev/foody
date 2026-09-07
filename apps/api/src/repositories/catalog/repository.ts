import { Context, Effect, Layer } from 'effect';
import { PrismaService } from '../../infrastructure/prisma.js';
import { tryRepositoryPromise } from '../utils.js';
import { CatalogRepositoryError } from './errors.js';
import { backfillCatalog, mergeIngredientAliases } from './internal.js';
import { catalogEntrySelect, type ICatalogRepository } from './types.js';

export class CatalogRepository extends Context.Tag('CatalogRepository')<
  CatalogRepository,
  ICatalogRepository
>() {}

export const CatalogRepositoryLive = Layer.effect(
  CatalogRepository,
  Effect.gen(function* () {
    const db = yield* PrismaService;
    const repository: ICatalogRepository = {
      list: (householdId) =>
        tryRepositoryPromise(async () => {
          const all = await db.ingredient.findMany({
            where: { householdId },
            orderBy: { name: 'asc' },
            select: catalogEntrySelect
          });
          return {
            pending: all.filter((entry) => entry.status === 'pending'),
            confirmed: all.filter((entry) => entry.status === 'confirmed'),
            suggestions: {}
          };
        }, CatalogRepositoryError),
      overview: (householdId) =>
        tryRepositoryPromise(async () => {
          const [defaultServingRecipes, pendingCount] = await Promise.all([
            db.recipe.findMany({
              where: { householdId, OR: [{ declaredServings: null }, { declaredServings: 2 }] },
              orderBy: { name: 'asc' },
              select: { id: true, name: true, declaredServings: true }
            }),
            db.ingredient.count({ where: { householdId, status: 'pending' } })
          ]);
          return { defaultServingRecipes, pendingCount };
        }, CatalogRepositoryError),
      confirm: (householdId, id, data) =>
        tryRepositoryPromise(async () => {
          await db.ingredient.updateMany({
            where: { id, householdId },
            data: {
              status: 'confirmed',
              ...(data.name?.trim() ? { name: data.name.trim() } : {}),
              ...(data.isStaple === undefined ? {} : { isStaple: data.isStaple })
            }
          });
        }, CatalogRepositoryError),
      merge: (householdId, sourceId, targetId) =>
        tryRepositoryPromise(
          () =>
            db
              .$transaction(async (tx) => {
                const [source, target] = await Promise.all([
                  tx.ingredient.findFirstOrThrow({ where: { id: sourceId, householdId } }),
                  tx.ingredient.findFirstOrThrow({ where: { id: targetId, householdId } })
                ]);
                await tx.recipeIngredient.updateMany({
                  where: { ingredientId: sourceId },
                  data: { ingredientId: targetId }
                });
                await tx.ingredient.update({
                  where: { id: targetId },
                  data: { status: 'confirmed', aliases: mergeIngredientAliases(target, source) }
                });
                await tx.ingredient.delete({ where: { id: sourceId } });
              })
              .then(() => undefined),
          CatalogRepositoryError
        ),
      backfill: (householdId) =>
        tryRepositoryPromise(() => backfillCatalog(db, householdId), CatalogRepositoryError)
    };

    return CatalogRepository.of(repository);
  })
);
