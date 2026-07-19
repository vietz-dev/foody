import { backfillHousehold, listDefaultServingRecipes } from '$lib/server/catalog/backfill';
import { countPendingIngredients } from '$lib/server/catalog/catalog';
import { requireUser } from '$lib/server/require-user';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const user = requireUser(locals);

	const [defaultServingRecipes, pendingCount] = await Promise.all([
		listDefaultServingRecipes(user.householdId),
		countPendingIngredients(user.householdId)
	]);

	return { defaultServingRecipes, pendingCount, user };
};

export const actions: Actions = {
	backfill: async ({ locals }) => {
		const user = requireUser(locals);
		const result = await backfillHousehold(user.householdId);
		return { success: true, ...result };
	}
};
