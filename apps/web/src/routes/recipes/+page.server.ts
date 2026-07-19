import { listRecipes } from '$lib/server/recipes';
import { countPendingIngredients } from '$lib/server/catalog/catalog';
import { requireUser } from '$lib/server/require-user';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const user = requireUser(locals);
	const [recipes, pendingIngredientCount] = await Promise.all([
		listRecipes(user.householdId),
		countPendingIngredients(user.householdId)
	]);
	return { recipes, pendingIngredientCount, user };
};
