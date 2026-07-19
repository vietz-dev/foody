import { error } from '@sveltejs/kit';
import { getRecipeWithDetails } from '$lib/server/recipes';
import { requireUser } from '$lib/server/require-user';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, locals }) => {
	const user = requireUser(locals);
	const recipe = await getRecipeWithDetails(params.id);
	if (!recipe || recipe.householdId !== user.householdId) {
		error(404, 'Nicht gefunden');
	}
	return { recipe, user };
};
