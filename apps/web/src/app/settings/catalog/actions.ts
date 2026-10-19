'use server';
import { revalidatePath } from 'next/cache';
import { api } from '@/lib/server/api';
import { requireUser } from '@/lib/server/session';

const refreshCatalog = () => {
	for (const path of ['/', '/settings/catalog', '/plan/einkaufsliste']) revalidatePath(path);
};

export async function saveCatalogEntry(id: string, name: string, isStaple: boolean) {
	await requireUser();
	const trimmed = name.trim();
	if (!trimmed) throw new Error('Bitte einen Namen eingeben.');
	await api.catalog.confirm({ id, name: trimmed, isStaple });
	refreshCatalog();
}

export async function mergeCatalogEntry(sourceId: string, targetId: string) {
	await requireUser();
	if (!targetId || sourceId === targetId) throw new Error('Bitte eine andere Zielzutat wählen.');
	await api.catalog.merge({ sourceId, targetId });
	refreshCatalog();
}

export async function importRecipeIngredients() {
	await requireUser();
	const result = await api.admin.backfill({});
	refreshCatalog();
	return result;
}
