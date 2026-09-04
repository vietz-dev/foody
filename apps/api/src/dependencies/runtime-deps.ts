import { Layer } from 'effect';
import { PrismaLive } from '../infrastructure/prisma.js';
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

export type RuntimeDeps = RecipeService | PlanService | CatalogService | ShoppingListService;

const recipeRepository = makeRecipeRepositoryDeps(PrismaLive);
const planRepository = makePlanRepositoryDeps(PrismaLive);
const catalogRepository = makeCatalogRepositoryDeps(PrismaLive);
const shoppingListRepository = makeShoppingListRepositoryDeps(PrismaLive);

export const AppLive: Layer.Layer<RuntimeDeps> = Layer.mergeAll(
  makeRecipeServiceDeps(recipeRepository),
  makePlanServiceDeps(planRepository),
  makeCatalogServiceDeps(catalogRepository),
  makeShoppingListServiceDeps(shoppingListRepository)
);
