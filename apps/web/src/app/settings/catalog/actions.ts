'use server';
import { revalidatePath } from 'next/cache';
import { api } from '@/lib/server/api';
import { suggestCatalogGroups } from '@/lib/server/catalog-suggestions';
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

export async function previewCatalogSuggestions(query: string) {
	await requireUser();
	const catalog = await api.catalog.list({});
	const search = query.trim().toLocaleLowerCase('de');
	const entries = [...catalog.pending, ...catalog.confirmed].filter((entry) =>
		[entry.name, ...entry.aliases].some((name) => name.toLocaleLowerCase('de').includes(search))
	);
	return suggestCatalogGroups(entries);
}

export async function resolveCatalogSuggestion(
	targetId: string,
	sourceIds: string[],
	name: string,
	acceptPicnicConflict: boolean
) {
	await requireUser();
	await api.catalog.resolveGroup({ targetId, sourceIds, name: name.trim(), acceptPicnicConflict });
	refreshCatalog();
}

export async function detachCatalogExpression(expressionId: string) {
	await requireUser();
	await api.catalog.detachExpression({ expressionId });
	refreshCatalog();
}
