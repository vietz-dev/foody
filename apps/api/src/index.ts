import { serve } from '@hono/node-server';
import { RPCHandler } from '@orpc/server/fetch';
import { implement, onError } from '@orpc/server';
import { Hono } from 'hono';
import { Effect, ManagedRuntime } from 'effect';
import { contract } from '@foody/contracts';
import { AppLive } from './dependencies/runtime-deps.js';
import { CatalogService } from './services/catalog/service.js';
import { PlanService } from './services/plan/service.js';
import { RecipeService } from './services/recipe/service.js';
import { ShoppingListService } from './services/shoppingList/service.js';

export type Context = { householdId: string };
export type ContextResolver = (request: Request) => Promise<Context | null>;
const os = implement<typeof contract, Context>(contract);
const runtime = ManagedRuntime.make(AppLive);
const run = <A>(program: Effect.Effect<A, unknown, any>) => runtime.runPromise(program);
const service = (tag: any, call: (value: any) => Effect.Effect<any, unknown>) =>
  Effect.flatMap(tag, call);

const router = os.router({
  recipes: {
    list: os.recipes.list.handler(({ context }) =>
      run(service(RecipeService, (s) => s.list(context.householdId)))
    ),
    get: os.recipes.get.handler(({ input, context }) =>
      run(service(RecipeService, (s) => s.get(context.householdId, input.id)))
    ),
    create: os.recipes.create.handler(({ input, context }) =>
      run(service(RecipeService, (s) => s.create(context.householdId, input)))
    ),
    update: os.recipes.update.handler(({ input, context }) =>
      run(service(RecipeService, (s) => s.update(context.householdId, input.id, input)))
    ),
    delete: os.recipes.delete.handler(({ input, context }) =>
      run(service(RecipeService, (s) => s.delete(context.householdId, input.id)))
    ),
    scan: os.recipes.scan.handler(async () => ({}))
  },
  plan: {
    list: os.plan.list.handler(({ context }) =>
      run(service(PlanService, (s) => s.list(context.householdId)))
    ),
    toggle: os.plan.toggle.handler(({ input, context }) =>
      run(service(PlanService, (s) => s.toggle(context.householdId, input.recipeId)))
    ),
    setPortions: os.plan.setPortions.handler(({ input, context }) =>
      run(
        service(PlanService, (s) => s.portions(context.householdId, input.recipeId, input.portions))
      )
    )
  },
  shoppingList: {
    get: os.shoppingList.get.handler(({ context }) =>
      run(service(ShoppingListService, (s) => s.get(context.householdId)))
    )
  },
  catalog: {
    list: os.catalog.list.handler(({ context }) =>
      run(service(CatalogService, (s) => s.list(context.householdId)))
    ),
    confirm: os.catalog.confirm.handler(({ input, context }) =>
      run(service(CatalogService, (s) => s.confirm(context.householdId, input.id, input)))
    ),
    merge: os.catalog.merge.handler(({ input, context }) =>
      run(
        service(CatalogService, (s) => s.merge(context.householdId, input.sourceId, input.targetId))
      )
    )
  },
  admin: {
    overview: os.admin.overview.handler(({ context }) =>
      run(service(CatalogService, (s) => s.overview(context.householdId)))
    ),
    backfill: os.admin.backfill.handler(({ context }) =>
      run(service(CatalogService, (s) => s.backfill(context.householdId)))
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
