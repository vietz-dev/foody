import { fail } from '@sveltejs/kit';
import {
	confirmIngredient,
	listConfirmedIngredients,
	listPendingIngredients,
	mergeIngredient,
	setStaple
} from '$lib/server/catalog/catalog';
import { suggestMergeTargets } from '$lib/server/ai/ingredient-grouping';
import { requireUser } from '$lib/server/require-user';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const user = requireUser(locals);

	const [pending, confirmed] = await Promise.all([
		listPendingIngredients(user.householdId),
		listConfirmedIngredients(user.householdId)
	]);

	const suggestionMap = await suggestMergeTargets(
		pending.map((p) => p.name),
		confirmed.map((c) => c.name)
	);

	const confirmedByName = new Map(confirmed.map((c) => [c.name, c]));
	const suggestions = Object.fromEntries(
		pending.map((p) => {
			const matchedName = suggestionMap.get(p.name) ?? null;
			const target = matchedName ? (confirmedByName.get(matchedName) ?? null) : null;
			return [p.id, target ? { id: target.id, name: target.name } : null];
		})
	);

	return { pending, confirmed, suggestions, user };
};

export const actions: Actions = {
	confirm: async ({ request, locals }) => {
		const user = requireUser(locals);
		const formData = await request.formData();
		const id = formData.get('id') as string | null;
		const name = (formData.get('name') as string | null) ?? undefined;
		const isStaple = formData.get('isStaple') === 'on';

		if (!id) return fail(400, { error: 'Fehlende ID' });

		try {
			await confirmIngredient(user.householdId, id, { name, isStaple });
		} catch {
			return fail(400, { error: 'Zutat konnte nicht bestätigt werden' });
		}

		return { success: true };
	},

	merge: async ({ request, locals }) => {
		const user = requireUser(locals);
		const formData = await request.formData();
		const sourceId = formData.get('sourceId') as string | null;
		const targetId = formData.get('targetId') as string | null;

		if (!sourceId || !targetId) return fail(400, { error: 'Fehlende ID' });

		try {
			await mergeIngredient(user.householdId, sourceId, targetId);
		} catch {
			return fail(400, { error: 'Zutaten konnten nicht zusammengeführt werden' });
		}

		return { success: true };
	},

	setStaple: async ({ request, locals }) => {
		const user = requireUser(locals);
		const formData = await request.formData();
		const id = formData.get('id') as string | null;
		const isStaple = formData.get('isStaple') === 'on';

		if (!id) return fail(400, { error: 'Fehlende ID' });

		try {
			await setStaple(user.householdId, id, isStaple);
		} catch {
			return fail(400, { error: 'Vorrat-Status konnte nicht gesetzt werden' });
		}

		return { success: true };
	}
};
