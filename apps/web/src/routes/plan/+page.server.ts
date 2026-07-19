import { listRecipesWithPlanStatus } from '$lib/server/weekly-plan';
import { requireUser } from '$lib/server/require-user';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const user = requireUser(locals);
	const recipes = await listRecipesWithPlanStatus(user.householdId);
	return { recipes, user };
};
