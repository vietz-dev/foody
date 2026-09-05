'use server';
import { revalidatePath } from 'next/cache';
import { api } from '@/lib/server/api';
import { requireUser } from '@/lib/server/session';

const revalidate = () => ['/', '/plan', '/plan/einkaufsliste'].forEach((p) => revalidatePath(p));

export async function togglePlan(recipeId: string) {
	await requireUser();
	const result = await api.plan.toggle({ recipeId });
	revalidate();
	return result.selected;
}

export async function setPortions(recipeId: string, portions: number) {
	await requireUser();
	const result = await api.plan.setPortions({ recipeId, portions });
	revalidate();
	return result.portions;
}
