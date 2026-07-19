/**
 * Pure ingredient-name normalization and catalog matching.
 *
 * No DB access, no AI calls, no Prisma imports — this module is a seam that
 * other tickets (extraction pipeline, shopping-list generation, ...) can call
 * synchronously with an in-memory catalog snapshot.
 */

/**
 * Normalize a raw ingredient name for comparison:
 * - lowercase (case-fold)
 * - trim leading/trailing whitespace
 * - collapse internal whitespace runs to a single space
 *
 * German umlauts (ä, ö, ü, ß) and all other characters are preserved as-is —
 * we only case-fold and fix whitespace, we do NOT strip or transliterate
 * diacritics. This keeps e.g. "Öl" and "Ol" distinct.
 */
export function normalizeIngredientName(raw: string): string {
	return raw.trim().toLowerCase().replace(/\s+/g, ' ');
}

/** Plain (non-Prisma) shape of a catalog entry, as read from the DB by the caller. */
export interface CatalogEntry {
	id: string;
	name: string; // canonical name
	aliases: string[];
	status: 'pending' | 'confirmed';
}

export type MatchResult =
	| { matched: true; ingredientId: string; via: 'name' | 'alias' }
	| { matched: false };

/**
 * Match a raw ingredient name against a catalog.
 *
 * Matching is case/whitespace-insensitive (via {@link normalizeIngredientName});
 * umlauts and other diacritics remain distinctive.
 *
 * Tie-break rule: canonical `name` matches are preferred over `alias` matches.
 * Concretely, we scan the catalog twice — first pass checks only `name` across
 * all entries, second pass checks `aliases`. This means if entry A matches only
 * via alias and entry B (anywhere in the list, even later) matches via name,
 * B wins. Within a single pass, the first matching entry (catalog order) wins.
 */
export function matchIngredient(rawName: string, catalog: CatalogEntry[]): MatchResult {
	const normalized = normalizeIngredientName(rawName);

	for (const entry of catalog) {
		if (normalizeIngredientName(entry.name) === normalized) {
			return { matched: true, ingredientId: entry.id, via: 'name' };
		}
	}

	for (const entry of catalog) {
		if (entry.aliases.some((alias) => normalizeIngredientName(alias) === normalized)) {
			return { matched: true, ingredientId: entry.id, via: 'alias' };
		}
	}

	return { matched: false };
}
