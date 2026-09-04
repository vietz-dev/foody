import { serve } from '@hono/node-server';
import { RPCHandler } from '@orpc/server/fetch';
import { implement, onError } from '@orpc/server';
import { Hono } from 'hono';
import { contract } from '@foody/contracts';

/**
 * API entry point. Business handlers are intentionally injected here, so the
 * web app only needs the contract and never imports database/AI code.
 * Replace the temporary not-implemented handlers as domain modules migrate.
 */
export type Context = { householdId: string };
export type ContextResolver = (request: Request) => Promise<Context | null>;
const os = implement<typeof contract, Context>(contract);
const router = os.router({
  recipes: {
    list: os.recipes.list.handler(async () => []),
    get: os.recipes.get.handler(async () => null),
    create: os.recipes.create.handler(async () => {
      throw new Error('Recipe service is not configured');
    }),
    update: os.recipes.update.handler(async () => ({ success: true })),
    delete: os.recipes.delete.handler(async () => ({ success: true })),
    scan: os.recipes.scan.handler(async () => ({}))
  },
  plan: {
    list: os.plan.list.handler(async () => []),
    toggle: os.plan.toggle.handler(async () => ({ selected: false })),
    setPortions: os.plan.setPortions.handler(async () => ({ portions: 1 }))
  },
  shoppingList: {
    get: os.shoppingList.get.handler(async () => ({
      einkaufen: [],
      vorrat: [],
      nichtZugeordnet: []
    }))
  },
  catalog: {
    list: os.catalog.list.handler(async () => ({ pending: [], confirmed: [], suggestions: {} })),
    confirm: os.catalog.confirm.handler(async () => ({ success: true })),
    merge: os.catalog.merge.handler(async () => ({ success: true }))
  },
  admin: {
    overview: os.admin.overview.handler(async () => ({
      defaultServingRecipes: [],
      pendingCount: 0
    })),
    backfill: os.admin.backfill.handler(async () => ({
      success: true,
      linkedCount: 0,
      pendingCount: 0
    }))
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
