import { fail } from '@sveltejs/kit';
import {
	confirmIngredient,
	listConfirmedIngredients,
	listPendingIngredients,
	mergeIngredient
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

	// Candidates for a merge suggestion are the confirmed entries AND the other
	// pending entries — so a fresh backfill (nothing confirmed yet) still gets
	// grouping proposals between the pending duplicates. Resolve a suggested
	// name back to an ingredient, preferring a confirmed target on name clashes.
	const candidateNames = [...confirmed.map((c) => c.name), ...pending.map((p) => p.name)];
	const confirmedIds = new Set(confirmed.map((c) => c.id));
	const targetByName = new Map<string, { id: string; name: string }>();
	for (const entry of [...pending, ...confirmed]) {
		targetByName.set(entry.name, { id: entry.id, name: entry.name }); // confirmed overwrites pending
	}

	const suggestionMap = await suggestMergeTargets(
		pending.map((p) => p.name),
		candidateNames
	);

	const suggestions = Object.fromEntries(
		pending.map((p) => {
			const matchedName = suggestionMap.get(p.name) ?? null;
			const target = matchedName ? (targetByName.get(matchedName) ?? null) : null;
			if (!target || target.id === p.id) return [p.id, null];
			// For pending→pending pairs, keep only one canonical direction (merge
			// the alphabetically-later name into the earlier one) so the AI can't
			// surface a mutual A→B / B→A suggestion on both rows. A confirmed
			// target is always a valid direction.
			if (!confirmedIds.has(target.id) && p.name.localeCompare(target.name) <= 0) {
				return [p.id, null];
			}
			return [p.id, target];
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
	}
};
