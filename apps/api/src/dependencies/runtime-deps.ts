import { AuthLive, AuthTag, authConfigFromEnv, defineContext } from '@vietz-dev/auth';
import { Context, Effect, Layer } from 'effect';
import { PrismaLive, PrismaService } from '../infrastructure/prisma.js';
import { makeCatalogRepositoryDeps } from '../repositories/catalog/deps.js';
import { makePlanRepositoryDeps } from '../repositories/plan/deps.js';
import { makeRecipeRepositoryDeps } from '../repositories/recipe/deps.js';
import { makeShoppingListRepositoryDeps } from '../repositories/shoppingList/deps.js';
import { makeCatalogServiceDeps } from '../services/catalog/deps.js';
import type { CatalogService } from '../services/catalog/service.js';
import { makePlanServiceDeps } from '../services/plan/deps.js';
import type { PlanService } from '../services/plan/service.js';
import { makeRecipeServiceDeps } from '../services/recipe/deps.js';
import type { RecipeService } from '../services/recipe/service.js';
import { makeShoppingListServiceDeps } from '../services/shoppingList/deps.js';
import type { ShoppingListService } from '../services/shoppingList/service.js';

export const Auth = AuthTag<'householdId'>();
export type Auth = Context.Tag.Identifier<typeof Auth>;

export type RuntimeDeps = RecipeService | PlanService | CatalogService | ShoppingListService | Auth;

// Session-only Better Auth on the same Prisma client the repositories use.
const authLayer = Layer.unwrapEffect(
  Effect.map(PrismaService, (prisma) =>
    AuthLive(
      authConfigFromEnv(process.env, {
        prisma,
        context: defineContext({
          field: 'householdId',
          create: async () => (await prisma.household.create({ data: { name: 'Zuhause' } })).id
        })
      })
    )
  )
).pipe(Layer.provide(PrismaLive));

const recipeRepository = makeRecipeRepositoryDeps(PrismaLive);
const planRepository = makePlanRepositoryDeps(PrismaLive);
const catalogRepository = makeCatalogRepositoryDeps(PrismaLive);
const shoppingListRepository = makeShoppingListRepositoryDeps(PrismaLive);

export const AppLive: Layer.Layer<RuntimeDeps> = Layer.mergeAll(
  makeRecipeServiceDeps(recipeRepository),
  makePlanServiceDeps(planRepository),
  makeCatalogServiceDeps(catalogRepository),
  makeShoppingListServiceDeps(shoppingListRepository),
  authLayer
);
