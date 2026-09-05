import { headers } from 'next/headers';
import { createORPCClient } from '@orpc/client';
import { RPCLink } from '@orpc/client/fetch';
import type { ContractRouterClient } from '@orpc/contract';
import type { Contract } from '@foody/contracts';

// Server-only oRPC client. Forwards the browser's session cookie so the API
// can resolve the household with its own Better Auth instance.
const link = new RPCLink({
	url: `${process.env.API_URL ?? 'http://localhost:3001'}/rpc`,
	headers: async () => ({ cookie: (await headers()).get('cookie') ?? '' })
});

export const api: ContractRouterClient<Contract> = createORPCClient(link);
