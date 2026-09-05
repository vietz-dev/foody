'use server';
import { revalidatePath } from 'next/cache';
import type { PicnicProductRef } from '@foody/contracts';
import { api } from '@/lib/server/api';
import { requireUser } from '@/lib/server/session';

export async function searchPicnic(query: string) {
	await requireUser();
	return api.picnic.search({ query });
}

export async function mapPicnicProduct(ingredientId: string, product: PicnicProductRef | null) {
	await requireUser();
	await api.picnic.mapIngredient({ ingredientId, product });
	revalidatePath('/plan/einkaufsliste');
}

export async function pushToPicnic(items: Array<{ productId: string; count: number }>) {
	await requireUser();
	return api.picnic.pushCart({ items });
}
