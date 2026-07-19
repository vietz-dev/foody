import { getShoppingList } from '$lib/server/shopping-list/get-shopping-list';
import { requireUser } from '$lib/server/require-user';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const user = requireUser(locals);
	const list = await getShoppingList(user.householdId);
	return { list, user };
};
