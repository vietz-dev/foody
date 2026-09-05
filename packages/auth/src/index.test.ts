import { Effect } from 'effect';
import { describe, expect, it } from 'vitest';
import { makeAuthService, type AuthInstance } from './index.js';

const fake = (user: Record<string, unknown> | null) =>
  ({
    api: { getSession: async () => (user ? { user } : null) }
  }) as unknown as AuthInstance<'teamId'>;
const resolve = (user: Record<string, unknown> | null) =>
  Effect.runPromise(makeAuthService(fake(user), 'teamId').resolveContext(new Headers()));

describe('resolveContext', () => {
  it('maps the configured context field', async () => {
    expect(await resolve({ teamId: 't1' })).toEqual({ teamId: 't1' });
  });
  it('returns null without session or context', async () => {
    expect(await resolve(null)).toBeNull();
    expect(await resolve({ orgId: 'o1' })).toBeNull();
  });
});
