/**
 * Server-side operations for the household-wide ingredient catalog review
 * flow (`/katalog`): listing pending/confirmed entries and mutating them
 * (confirm, set Vorrat flag, merge duplicates).
 */

import { prisma } from '$lib/server/prisma';
import { normalizeIngredientName } from './match-ingredient';

export interface CatalogListEntry {
	id: string;
	name: string;
	isStaple: boolean;
	aliases: string[];
}

/** Pending catalog entries for a household, ordered by name. */
export async function listPendingIngredients(householdId: string): Promise<CatalogListEntry[]> {
	return prisma.ingredient.findMany({
		where: { householdId, status: 'pending' },
		orderBy: { name: 'asc' },
		select: { id: true, name: true, isStaple: true, aliases: true }
	});
}

/** Confirmed catalog entries for a household — merge targets, ordered by name. */
export async function listConfirmedIngredients(householdId: string): Promise<CatalogListEntry[]> {
	return prisma.ingredient.findMany({
		where: { householdId, status: 'confirmed' },
		orderBy: { name: 'asc' },
		select: { id: true, name: true, isStaple: true, aliases: true }
	});
}

/** Number of pending entries awaiting review — used for the hint banner. */
export async function countPendingIngredients(householdId: string): Promise<number> {
	return prisma.ingredient.count({ where: { householdId, status: 'pending' } });
}

/**
 * Confirm a pending ingredient, optionally renaming it and/or setting the
 * Vorrat (staple) flag. Scoped by householdId — throws if the row doesn't
 * belong to the household.
 */
export async function confirmIngredient(
	householdId: string,
	id: string,
	options?: { name?: string; isStaple?: boolean }
): Promise<void> {
	const existing = await prisma.ingredient.findUnique({ where: { id } });
	if (!existing || existing.householdId !== householdId) {
		throw new Error('Zutat nicht gefunden');
	}

	const name = options?.name?.trim();

	await prisma.ingredient.update({
		where: { id },
		data: {
			status: 'confirmed',
			...(name ? { name } : {}),
			...(options?.isStaple !== undefined ? { isStaple: options.isStaple } : {})
		}
	});
}

/**
 * Merge a source ingredient into a target ingredient: repoints all
 * RecipeIngredient rows from source to target, folds the source's canonical
 * name + aliases into the target's aliases (deduped, case/whitespace
 * insensitive), and deletes the source row. The target ends up `confirmed`.
 *
 * Both rows must belong to the given household.
 */
export async function mergeIngredient(
	householdId: string,
	sourceId: string,
	targetId: string
): Promise<void> {
	if (sourceId === targetId) {
		throw new Error('Quelle und Ziel dürfen nicht identisch sein');
	}

	await prisma.$transaction(async (tx) => {
		const [source, target] = await Promise.all([
			tx.ingredient.findUnique({ where: { id: sourceId } }),
			tx.ingredient.findUnique({ where: { id: targetId } })
		]);

		if (!source || source.householdId !== householdId) {
			throw new Error('Quell-Zutat nicht gefunden');
		}
		if (!target || target.householdId !== householdId) {
			throw new Error('Ziel-Zutat nicht gefunden');
		}

		await tx.recipeIngredient.updateMany({
			where: { ingredientId: sourceId },
			data: { ingredientId: targetId }
		});

		const mergedAliasCandidates = [source.name, ...source.aliases];
		const existingNormalized = new Set([
			normalizeIngredientName(target.name),
			...target.aliases.map(normalizeIngredientName)
		]);
		const newAliases = [...target.aliases];
		for (const candidate of mergedAliasCandidates) {
			const normalized = normalizeIngredientName(candidate);
			if (normalized === '' || existingNormalized.has(normalized)) continue;
			existingNormalized.add(normalized);
			newAliases.push(candidate.trim());
		}

		await tx.ingredient.update({
			where: { id: targetId },
			data: { status: 'confirmed', aliases: newAliases }
		});

		await tx.ingredient.delete({ where: { id: sourceId } });
	});
}
