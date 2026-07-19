import { json } from '@sveltejs/kit';
import { setPortions } from '$lib/server/weekly-plan';
import { requireUser } from '$lib/server/require-user';
import type { RequestHandler } from './$types';

export const PATCH: RequestHandler = async ({ params, locals, request }) => {
	const user = requireUser(locals);
	const { portions } = (await request.json()) as { portions: number };
	await setPortions(user.householdId, params.id, portions);
	return json({ portions });
};
