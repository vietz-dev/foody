import { listRecipes } from '$lib/server/recipes';
import { requireUser } from '$lib/server/require-user';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const user = requireUser(locals);
	const recipes = await listRecipes(user.householdId);
	return { recipes, user };
};
