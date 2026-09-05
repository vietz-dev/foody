import { describe, expect, it } from 'vitest';
import { createApp } from './index.js';

const rpc = (app: ReturnType<typeof createApp>, path: string) =>
  app.request(`/rpc/${path}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ json: {} })
  });

describe('createApp', () => {
  it('rejects RPC calls without a resolved household', async () => {
    const res = await rpc(
      createApp(async () => null),
      'recipes/list'
    );
    expect(res.status).toBe(401);
  });

  it.skipIf(!process.env.DATABASE_URL)('lists recipes for the resolved household', async () => {
    const app = createApp(async () => ({ householdId: 'does-not-exist' }));
    const res = await rpc(app, 'recipes/list');
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ json: [] });
  });
});
