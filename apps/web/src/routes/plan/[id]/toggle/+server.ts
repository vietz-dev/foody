import { json } from '@sveltejs/kit';
import { togglePlanItem } from '$lib/server/weekly-plan';
import { requireUser } from '$lib/server/require-user';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ params, locals }) => {
	const user = requireUser(locals);
	const selected = await togglePlanItem(user.householdId, params.id);
	return json({ selected });
};
