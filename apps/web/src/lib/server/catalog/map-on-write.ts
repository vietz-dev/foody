/**
 * Katalog-Mapping beim Schreiben: verknüpft jede Rezept-Zutat mit einem
 * kanonischen, haushaltsweiten `Ingredient`-Katalogeintrag.
 *
 * Bekannte Namen (per Name/Alias-Match, case/whitespace-insensitiv über
 * {@link normalizeIngredientName}) werden auf den existierenden Katalogeintrag
 * gemappt. Unbekannte Namen erzeugen genau einen neuen `pending`-Katalogeintrag,
 * der danach (auch innerhalb desselben Aufrufs) wiederverwendet wird.
 */

import { prisma } from '$lib/server/prisma';
import { matchIngredient, normalizeIngredientName, type CatalogEntry } from './match-ingredient';

/**
 * Resolve catalog ingredient ids for a list of raw ingredient names.
 *
 * Returns a map from the ORIGINAL (raw, un-normalized) name to the resolved
 * catalog `ingredientId`. Names that normalize to an empty string are skipped
 * (no entry in the returned map). Names that normalize equal share a single id
 * and never create duplicate pending rows — neither across calls (existing
 * catalog match) nor within a single call (in-memory catalog is updated as
 * pending entries are created).
 */
export async function resolveIngredientIds(
	householdId: string,
	names: string[]
): Promise<Map<string, string>> {
	const result = new Map<string, string>();

	const catalog: CatalogEntry[] = await prisma.ingredient.findMany({
		where: { householdId }
	});

	// Dedup by normalized name so we only match/create once per distinct name.
	const byNormalized = new Map<string, string[]>(); // normalized -> original names
	for (const raw of names) {
		const normalized = normalizeIngredientName(raw);
		if (normalized === '') continue;
		const originals = byNormalized.get(normalized);
		if (originals) {
			originals.push(raw);
		} else {
			byNormalized.set(normalized, [raw]);
		}
	}

	for (const originals of byNormalized.values()) {
		const firstOriginal = originals[0];
		const match = matchIngredient(firstOriginal, catalog);

		let ingredientId: string;
		if (match.matched) {
			ingredientId = match.ingredientId;
		} else {
			const created = await prisma.ingredient.create({
				data: {
					householdId,
					name: firstOriginal.trim(),
					status: 'pending',
					isStaple: false,
					aliases: []
				}
			});
			ingredientId = created.id;
			// Make the new entry visible to subsequent names in this same call.
			catalog.push({
				id: created.id,
				name: created.name,
				aliases: created.aliases,
				status: created.status
			});
		}

		for (const original of originals) {
			result.set(original, ingredientId);
		}
	}

	return result;
}
