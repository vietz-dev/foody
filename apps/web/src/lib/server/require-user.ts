import { error, redirect } from '@sveltejs/kit';

export function requireUser(locals: App.Locals) {
	const user = locals.user;
	if (!user) {
		throw redirect(303, '/login');
	}
	if (!user.householdId) {
		throw error(500, 'Nutzer hat keinen Haushalt');
	}
	return { ...user, householdId: user.householdId };
}
