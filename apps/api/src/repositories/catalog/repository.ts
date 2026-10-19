import { Context, Effect, Layer } from 'effect';
import { PrismaService } from '../../infrastructure/prisma.js';
import { tryRepositoryPromise } from '../utils.js';
import { CatalogRepositoryError } from './errors.js';
import { backfillCatalog, mergeIngredientAliases, mergeIngredientData } from './internal.js';
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
          await db.$transaction(async (tx) => {
            const entry = await tx.ingredient.findFirstOrThrow({ where: { id, householdId } });
            const name = data.name?.trim() || entry.name;
            await tx.ingredient.update({
              where: { id },
              data: {
                status: 'confirmed',
                name,
                aliases: mergeIngredientAliases(
                  { name, aliases: entry.aliases },
                  { name: entry.name, aliases: [] }
                ),
                ...(data.isStaple === undefined ? {} : { isStaple: data.isStaple })
              }
            });
          });
        }, CatalogRepositoryError),
      merge: (householdId, sourceId, targetId) =>
        tryRepositoryPromise(
          () =>
            db
              .$transaction(async (tx) => {
                if (sourceId === targetId)
                  throw new Error('Eine Zutat kann nicht mit sich selbst zusammengeführt werden.');
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
                  data: mergeIngredientData(target, source)
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
