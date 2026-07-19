import { fail, redirect } from '@sveltejs/kit';
import { createRecipe } from '$lib/server/recipes';
import { requireUser } from '$lib/server/require-user';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = ({ locals }) => {
	const user = requireUser(locals);
	return { user };
};

export const actions: Actions = {
	default: async ({ request, locals }) => {
		const user = requireUser(locals);
		const formData = await request.formData();

		const name = (formData.get('name') as string | null) ?? '';
		const servings = Math.max(1, parseInt((formData.get('servings') as string) ?? '1', 10));
		const bookTitle = (formData.get('bookTitle') as string | null) || undefined;
		const bookPageRaw = formData.get('bookPage') as string | null;
		const bookPage = bookPageRaw ? parseInt(bookPageRaw, 10) : undefined;
		const prepTimeRaw = formData.get('prepTimeMinutes') as string | null;
		const prepTimeMinutes = prepTimeRaw ? parseInt(prepTimeRaw, 10) : undefined;
		const notes = (formData.get('notes') as string | null) || undefined;

		const ingredients: Array<{ quantity: number; unit: string; name: string }> = [];
		let i = 0;
		while (formData.has(`ingredients[${i}][name]`)) {
			const qty = parseFloat((formData.get(`ingredients[${i}][quantity]`) as string) || '0');
			const unit = (formData.get(`ingredients[${i}][unit]`) as string) ?? '';
			const ingName = (formData.get(`ingredients[${i}][name]`) as string) ?? '';
			if (ingName.trim()) ingredients.push({ quantity: isNaN(qty) ? 0 : qty, unit, name: ingName });
			i++;
		}

		const steps: Array<{ description: string }> = [];
		let j = 0;
		while (formData.has(`steps[${j}][description]`)) {
			const desc = (formData.get(`steps[${j}][description]`) as string) ?? '';
			if (desc.trim()) steps.push({ description: desc });
			j++;
		}

		if (!name.trim()) {
			return fail(400, { error: 'Name ist erforderlich' });
		}

		const recipe = await createRecipe({
			householdId: user.householdId,
			name,
			bookTitle,
			bookPage,
			servings,
			prepTimeMinutes,
			notes,
			ingredients,
			steps
		});

		redirect(303, `/recipes/${recipe.id}`);
	}
};
