import { error, redirect } from '@sveltejs/kit';
import { deleteRecipe, getRecipeWithDetails, updateRecipe } from '$lib/server/recipes';
import { requireUser } from '$lib/server/require-user';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, locals }) => {
	const user = requireUser(locals);
	const recipe = await getRecipeWithDetails(params.id);
	if (!recipe || recipe.householdId !== user.householdId) {
		error(404, 'Nicht gefunden');
	}
	return { recipe, user };
};

export const actions: Actions = {
	update: async ({ request, params, locals }) => {
		const user = requireUser(locals);
		const existing = await getRecipeWithDetails(params.id);
		if (!existing || existing.householdId !== user.householdId) {
			error(404, 'Nicht gefunden');
		}

		const formData = await request.formData();
		const name = formData.get('name') as string;
		const servings = parseInt(formData.get('servings') as string, 10) || 1;
		const prepTimeMinutes = parseInt(formData.get('prepTimeMinutes') as string, 10) || undefined;
		const bookTitle = (formData.get('bookTitle') as string)?.trim() || undefined;
		const bookPage = parseInt(formData.get('bookPage') as string, 10) || undefined;
		const notes = (formData.get('notes') as string)?.trim() || undefined;

		const ingredients: Array<{ quantity: number; unit: string; name: string }> = [];
		let i = 0;
		while (formData.has(`ingredients[${i}][name]`)) {
			const ingName = (formData.get(`ingredients[${i}][name]`) as string).trim();
			const qty = parseFloat(formData.get(`ingredients[${i}][quantity]`) as string) || 0;
			const unit = (formData.get(`ingredients[${i}][unit]`) as string).trim();
			if (ingName) ingredients.push({ quantity: qty, unit, name: ingName });
			i++;
		}

		const steps: Array<{ description: string }> = [];
		let j = 0;
		while (formData.has(`steps[${j}][description]`)) {
			const desc = (formData.get(`steps[${j}][description]`) as string).trim();
			if (desc) steps.push({ description: desc });
			j++;
		}

		await updateRecipe(params.id, {
			name,
			servings,
			prepTimeMinutes,
			bookTitle,
			bookPage,
			notes,
			ingredients,
			steps
		});

		redirect(303, `/recipes/${params.id}`);
	},

	delete: async ({ params, locals }) => {
		const user = requireUser(locals);
		const existing = await getRecipeWithDetails(params.id);
		if (!existing || existing.householdId !== user.householdId) {
			error(404, 'Nicht gefunden');
		}

		await deleteRecipe(params.id);

		redirect(303, '/recipes');
	}
};
