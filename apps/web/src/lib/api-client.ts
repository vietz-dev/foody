import type { ContractRouterClient } from '@orpc/contract';
import { createORPCClient } from '@orpc/client';
import { RPCLink } from '@orpc/client/fetch';
import { contract } from '@foody/contracts';
const apiUrl = process.env.PUBLIC_API_URL ?? 'http://localhost:3000/rpc';

/** Typed web boundary. Pages and form actions should depend on this module,
 * never on Prisma or domain services. Cookies are forwarded for API auth. */
const link = new RPCLink({
	url: apiUrl,
	fetch: (request, init) => fetch(request, { ...init, credentials: 'include' })
});

export const api: ContractRouterClient<typeof contract> = createORPCClient(link);
