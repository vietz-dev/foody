import { serve } from '@hono/node-server';
import { RPCHandler } from '@orpc/server/fetch';
import { implement, onError } from '@orpc/server';
import { Hono } from 'hono';
import { contract } from '@foody/contracts';
import { createHonoEffectRuntime } from '@foody/hono-effect';
import { AppLive } from './dependencies/runtime-deps.js';
import { CatalogService } from './services/catalog/service.js';
import { PlanService } from './services/plan/service.js';
import { RecipeService } from './services/recipe/service.js';
import { ShoppingListService } from './services/shoppingList/service.js';

export type Context = { householdId: string };
export type ContextResolver = (request: Request) => Promise<Context | null>;
const os = implement<typeof contract, Context>(contract);
const { runService } = createHonoEffectRuntime(AppLive);

const router = os.router({
  recipes: {
    list: os.recipes.list.handler(({ context }) =>
      runService(RecipeService, (service) => service.list(context.householdId))
    ),
    get: os.recipes.get.handler(({ input, context }) =>
      runService(RecipeService, (service) => service.get(context.householdId, input.id))
    ),
    create: os.recipes.create.handler(({ input, context }) =>
      runService(RecipeService, (service) => service.create(context.householdId, input))
    ),
    update: os.recipes.update.handler(({ input, context }) =>
      runService(RecipeService, (service) => service.update(context.householdId, input.id, input))
    ),
    delete: os.recipes.delete.handler(({ input, context }) =>
      runService(RecipeService, (service) => service.delete(context.householdId, input.id))
    ),
    scan: os.recipes.scan.handler(async () => ({}))
  },
  plan: {
    list: os.plan.list.handler(({ context }) =>
      runService(PlanService, (service) => service.list(context.householdId))
    ),
    toggle: os.plan.toggle.handler(({ input, context }) =>
      runService(PlanService, (service) => service.toggle(context.householdId, input.recipeId))
    ),
    setPortions: os.plan.setPortions.handler(({ input, context }) =>
      runService(PlanService, (service) =>
        service.portions(context.householdId, input.recipeId, input.portions)
      )
    )
  },
  shoppingList: {
    get: os.shoppingList.get.handler(({ context }) =>
      runService(ShoppingListService, (service) => service.get(context.householdId))
    )
  },
  catalog: {
    list: os.catalog.list.handler(({ context }) =>
      runService(CatalogService, (service) => service.list(context.householdId))
    ),
    confirm: os.catalog.confirm.handler(({ input, context }) =>
      runService(CatalogService, (service) => service.confirm(context.householdId, input.id, input))
    ),
    merge: os.catalog.merge.handler(({ input, context }) =>
      runService(CatalogService, (service) =>
        service.merge(context.householdId, input.sourceId, input.targetId)
      )
    )
  },
  admin: {
    overview: os.admin.overview.handler(({ context }) =>
      runService(CatalogService, (service) => service.overview(context.householdId))
    ),
    backfill: os.admin.backfill.handler(({ context }) =>
      runService(CatalogService, (service) => service.backfill(context.householdId))
    )
  }
});

export function createApp(resolveContext: ContextResolver = async () => null) {
  const app = new Hono();
  const handler = new RPCHandler(router, {
    interceptors: [onError((error) => console.error(error))]
  });
  app.get('/health', (c) => c.json({ status: 'ok' }));
  app.use('/rpc/*', async (c, next) => {
    const context = await resolveContext(c.req.raw);
    if (!context) return c.json({ error: 'Unauthorized' }, 401);
    const { matched, response } = await handler.handle(c.req.raw, { prefix: '/rpc', context });
    if (matched) return c.newResponse(response.body, response);
    await next();
  });
  return app;
}

const app = createApp();
export default app;
if (process.env.NODE_ENV !== 'test')
  serve({ fetch: app.fetch, port: Number(process.env.PORT ?? 3000) });
