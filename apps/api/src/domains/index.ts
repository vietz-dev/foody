import { Layer } from 'effect';
import { PrismaLive } from '../infrastructure/prisma.js';
import { CatalogRepositoryLive, CatalogServiceLive } from './catalog/index.js';
import { PlanRepositoryLive, PlanServiceLive } from './planning/index.js';
import { RecipeRepositoryLive, RecipeServiceLive } from './recipes/index.js';
import { ShoppingRepositoryLive, ShoppingListServiceLive } from './shopping-list/index.js';

export { CatalogService } from './catalog/index.js';
export { PlanService } from './planning/index.js';
export { RecipeService } from './recipes/index.js';
export { ShoppingListService } from './shopping-list/index.js';

export const AppLive = Layer.mergeAll(
  RecipeServiceLive,
  PlanServiceLive,
  CatalogServiceLive,
  ShoppingListServiceLive
).pipe(
  Layer.provide(
    Layer.mergeAll(
      RecipeRepositoryLive,
      PlanRepositoryLive,
      CatalogRepositoryLive,
      ShoppingRepositoryLive
    ).pipe(Layer.provide(PrismaLive))
  )
);
