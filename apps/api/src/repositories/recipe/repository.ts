import { Context, Effect, Layer } from 'effect';
import { PrismaService } from '../../infrastructure/prisma.js';
import { RecipeRepositoryError } from './errors.js';
import {
  buildRecipeData,
  buildRecipeIngredients,
  buildRecipeSteps,
  resolveIngredientIds
} from './internal.js';
import { recipeDetails, type IRecipeRepository } from './types.js';
import { getErrorMessage } from '../utils.js';

export class RecipeRepository extends Context.Tag('RecipeRepository')<
  RecipeRepository,
  IRecipeRepository
>() {}

export const RecipeRepositoryLive = Layer.effect(
  RecipeRepository,
  Effect.gen(function* () {
    const db = yield* PrismaService;
    const repository: IRecipeRepository = {
      list: (householdId) =>
        Effect.tryPromise({
          try: () => db.recipe.findMany({ where: { householdId }, orderBy: { createdAt: 'desc' } }),
          catch: (error) =>
            new RecipeRepositoryError({ message: getErrorMessage(error), cause: error })
        }),
      get: (householdId, id) =>
        Effect.tryPromise({
          try: () => db.recipe.findFirst({ where: { id, householdId }, include: recipeDetails }),
          catch: (error) =>
            new RecipeRepositoryError({ message: getErrorMessage(error), cause: error })
        }),
      create: (householdId, data) =>
        Effect.tryPromise({
          try: async () => {
            const ingredientIds = await resolveIngredientIds(
              db,
              householdId,
              data.ingredients.map((ingredient) => ingredient.name)
            );
            return db.recipe.create({
              data: {
                householdId,
                ...buildRecipeData(data),
                sourceType: 'book',
                servings: 1,
                ingredients: {
                  create: buildRecipeIngredients(data, ingredientIds)
                },
                steps: {
                  create: buildRecipeSteps(data)
                }
              },
              include: recipeDetails
            });
          },
          catch: (error) =>
            new RecipeRepositoryError({ message: getErrorMessage(error), cause: error })
        }),
      update: (householdId, id, data) =>
        Effect.tryPromise({
          try: () =>
            db
              .$transaction(async (tx) => {
                const recipe = await tx.recipe.findFirstOrThrow({ where: { id, householdId } });
                const ingredientIds = await resolveIngredientIds(
                  tx as unknown as PrismaService['Type'],
                  householdId,
                  data.ingredients.map((ingredient) => ingredient.name)
                );
                await tx.recipe.update({
                  where: { id: recipe.id },
                  data: buildRecipeData(data)
                });
                await tx.recipeIngredient.deleteMany({ where: { recipeId: id } });
                await tx.recipeStep.deleteMany({ where: { recipeId: id } });
                await tx.recipeIngredient.createMany({
                  data: buildRecipeIngredients(data, ingredientIds).map((ingredient) => ({
                    ...ingredient,
                    recipeId: id
                  }))
                });
                await tx.recipeStep.createMany({
                  data: buildRecipeSteps(data).map((step) => ({ ...step, recipeId: id }))
                });
              })
              .then(() => undefined),
          catch: (error) =>
            new RecipeRepositoryError({ message: getErrorMessage(error), cause: error })
        }),
      delete: (householdId, id) =>
        Effect.tryPromise({
          try: () => db.recipe.deleteMany({ where: { id, householdId } }).then(() => undefined),
          catch: (error) =>
            new RecipeRepositoryError({ message: getErrorMessage(error), cause: error })
        })
    };

    return RecipeRepository.of(repository);
  })
);
