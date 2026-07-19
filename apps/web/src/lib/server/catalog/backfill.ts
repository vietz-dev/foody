/**
 * Backfill für Altdaten (`/admin`): verknüpft `RecipeIngredient`-Zeilen, die
 * noch kein `ingredientId` haben (vor Einführung des Katalogs angelegt), mit
 * dem haushaltsweiten Zutaten-Katalog. Nutzt exakt denselben Resolver wie der
 * Schreibpfad ({@link resolveIngredientIds}), damit unbekannte Namen genau
 * einen `pending`-Katalogeintrag erzeugen (dedupliziert, wiederverwendet).
 *
 * Idempotent: bereits verknüpfte Zeilen werden nicht erneut angefasst, und
 * ein wiederholter Lauf erzeugt weder neue Duplikate im Katalog noch mappt
 * er Zeilen doppelt.
 */

import { prisma } from '$lib/server/prisma';
import { resolveIngredientIds } from './map-on-write';
import { countPendingIngredients } from './catalog';

/**
 * Findet alle unverknüpften `RecipeIngredient`-Zeilen des Haushalts, löst
 * ihre Namen über den Katalog auf (erstellt bei Bedarf neue `pending`-
 * Einträge) und schreibt die aufgelöste `ingredientId` zurück.
 *
 * Rückgabe: Anzahl neu verknüpfter Zeilen und Anzahl aktuell auf Review
 * wartender (`pending`) Katalogeinträge.
 */
export async function backfillHousehold(
	householdId: string
): Promise<{ linkedCount: number; pendingCount: number }> {
	const unmapped = await prisma.recipeIngredient.findMany({
		where: { ingredientId: null, recipe: { householdId } },
		select: { id: true, name: true }
	});

	if (unmapped.length === 0) {
		const pendingCount = await countPendingIngredients(householdId);
		return { linkedCount: 0, pendingCount };
	}

	const resolved = await resolveIngredientIds(
		householdId,
		unmapped.map((row) => row.name)
	);

	// Group row ids by resolved ingredientId so we can update with one
	// `updateMany` per distinct ingredient instead of one query per row.
	const rowIdsByIngredientId = new Map<string, string[]>();
	for (const row of unmapped) {
		const ingredientId = resolved.get(row.name);
		if (!ingredientId) continue; // name normalized to empty — nothing to link
		const rowIds = rowIdsByIngredientId.get(ingredientId);
		if (rowIds) {
			rowIds.push(row.id);
		} else {
			rowIdsByIngredientId.set(ingredientId, [row.id]);
		}
	}

	let linkedCount = 0;
	await prisma.$transaction(
		[...rowIdsByIngredientId.entries()].map(([ingredientId, rowIds]) => {
			linkedCount += rowIds.length;
			return prisma.recipeIngredient.updateMany({
				where: { id: { in: rowIds } },
				data: { ingredientId }
			});
		})
	);

	const pendingCount = await countPendingIngredients(householdId);
	return { linkedCount, pendingCount };
}

export interface DefaultServingRecipe {
	id: string;
	name: string;
	declaredServings: number | null;
}

/**
 * Rezepte, deren `declaredServings` noch den Backfill-Default trägt
 * (`null` oder `2`) — zur Sichtkontrolle, ob die ursprüngliche Portionszahl
 * nachgetragen werden sollte.
 */
export async function listDefaultServingRecipes(
	householdId: string
): Promise<DefaultServingRecipe[]> {
	return prisma.recipe.findMany({
		where: { householdId, OR: [{ declaredServings: null }, { declaredServings: 2 }] },
		orderBy: { name: 'asc' },
		select: { id: true, name: true, declaredServings: true }
	});
}
