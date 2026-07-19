import { error, json } from '@sveltejs/kit';
import { setPortions } from '$lib/server/weekly-plan';
import { requireUser } from '$lib/server/require-user';
import type { RequestHandler } from './$types';

export const PATCH: RequestHandler = async ({ params, locals, request }) => {
	const user = requireUser(locals);

	let body: unknown;
	try {
		body = await request.json();
	} catch {
		error(400, 'Ungültiger Request-Body');
	}

	const portions = (body as { portions?: unknown })?.portions;
	if (typeof portions !== 'number' || !Number.isFinite(portions)) {
		error(400, 'portions muss eine Zahl sein');
	}

	const saved = await setPortions(user.householdId, params.id, portions);
	return json({ portions: saved });
};
