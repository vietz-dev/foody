'use server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import type { RecipeInput } from '@foody/contracts';
import { api } from '@/lib/server/api';
import { requireUser } from '@/lib/server/session';

export async function createRecipe(input: RecipeInput) {
	await requireUser();
	const recipe = await api.recipes.create(input);
	revalidatePath('/recipes');
	revalidatePath('/plan');
	redirect(`/recipes/${recipe.id}`);
}
