/**
 * buildShoppingList — pure aggregation + scaling for the weekly shopping list.
 *
 * NO DB, NO AI, NO Prisma imports. The caller passes in plain snapshots of the
 * selected recipes (with per-portion ingredient quantities) and the catalog.
 * This is the main testable seam of the shopping-list epic (FOODY-8 / T7).
 *
 * Domain fact: ingredient quantities are stored **per 1 portion**. A weekly-plan
 * selection carries a `portions` count per recipe. The shopping quantity for an
 * ingredient is therefore `quantity_per_portion * portions`, aggregated per
 * canonical ingredient across all selected recipes.
 */

// ---------------------------------------------------------------------------
// Input types (plain — intentionally decoupled from Prisma)
// ---------------------------------------------------------------------------

export interface PlanRecipeInput {
	recipeId: string;
	recipeName: string;
	/** Chosen portions for this recipe in the weekly plan (>= 1). */
	portions: number;
	ingredients: RecipeIngredientInput[];
}

export interface RecipeIngredientInput {
	/** Raw recipe-ingredient name (used as fallback label when unmapped). */
	name: string;
	/** Quantity per 1 portion. May be null (e.g. "Salz nach Geschmack"). */
	quantity: number | null;
	/** Unit, e.g. "g", "kg", "ml", "l", "Stück", "EL", "" or null. */
	unit: string | null;
	/** Canonical catalog id, or null if unmapped. */
	ingredientId: string | null;
}

export interface CatalogIngredientInput {
	id: string;
	/** Canonical display name. */
	name: string;
	/** true => the ingredient belongs in the "Vorrat" section. */
	isStaple: boolean;
}

// ---------------------------------------------------------------------------
// Output types
// ---------------------------------------------------------------------------

/** One summand of an aggregated line item, per unit-family. */
export interface ShoppingQuantity {
	amount: number;
	unit: string;
}

export interface ShoppingLineItem {
	ingredientId: string | null;
	/** Canonical name (or raw name for unmapped ingredients). */
	name: string;
	/** Aggregated quantities; multiple entries when unit families are incompatible. */
	quantities: ShoppingQuantity[];
	/** Number of distinct selected recipes contributing to this line item. */
	recipeCount: number;
	/**
	 * true when at least one contributing recipe-ingredient had a null quantity
	 * (e.g. "Salz nach Geschmack"). The line item still appears and still counts
	 * toward recipeCount, but that contribution adds no numeric amount. The UI
	 * can render this as "nach Bedarf" next to any concrete quantities.
	 */
	unquantified: boolean;
}

export interface ShoppingList {
	/** Mapped, non-staple ingredients. */
	einkaufen: ShoppingLineItem[];
	/** Mapped ingredients flagged isStaple === true. */
	vorrat: ShoppingLineItem[];
	/** Unmapped ingredients (ingredientId === null). */
	nichtZugeordnet: ShoppingLineItem[];
}

// ---------------------------------------------------------------------------
// Normalization (kept local & consistent with catalog/match-ingredient.ts —
// NOT imported, to avoid a hard dependency between seams).
// ---------------------------------------------------------------------------

/**
 * Normalize a raw ingredient name for use as an aggregation key:
 * lowercase, trim, collapse internal whitespace. Umlauts are preserved.
 */
function normalizeName(raw: string): string {
	return raw.trim().toLowerCase().replace(/\s+/g, ' ');
}

// ---------------------------------------------------------------------------
// Unit families
// ---------------------------------------------------------------------------

type UnitFamily = 'mass' | 'volume';

/**
 * Map a raw unit string to a known family + conversion factor to the family's
 * base unit (grams for mass, millilitres for volume). Returns null for unknown
 * units, which are then bucketed by their exact (case-insensitive) unit string.
 */
function classifyUnit(rawUnit: string): { family: UnitFamily; toBase: number } | null {
	const u = rawUnit.trim().toLowerCase();
	switch (u) {
		case 'g':
			return { family: 'mass', toBase: 1 };
		case 'kg':
			return { family: 'mass', toBase: 1000 };
		case 'ml':
			return { family: 'volume', toBase: 1 };
		case 'l':
			return { family: 'volume', toBase: 1000 };
		default:
			return null;
	}
}

/** Round to 3 decimals to tame floating-point noise (e.g. 0.1 + 0.2). */
function round3(n: number): number {
	return Math.round(n * 1000) / 1000;
}

/**
 * Render an accumulated base-unit amount for a known family back into a display
 * quantity. Rule (deterministic): keep the base unit (g / ml) while below 1000,
 * promote to the large unit (kg / l) once the total reaches 1000 base units.
 */
function renderFamilyQuantity(family: UnitFamily, baseAmount: number): ShoppingQuantity {
	const largeUnit = family === 'mass' ? 'kg' : 'l';
	const smallUnit = family === 'mass' ? 'g' : 'ml';
	if (baseAmount >= 1000) {
		return { amount: round3(baseAmount / 1000), unit: largeUnit };
	}
	return { amount: round3(baseAmount), unit: smallUnit };
}

// ---------------------------------------------------------------------------
// Aggregation
// ---------------------------------------------------------------------------

interface Accumulator {
	ingredientId: string | null;
	name: string;
	isStaple: boolean;
	recipeIds: Set<string>;
	unquantified: boolean;
	/** Base-unit totals for known families. */
	familyBase: Map<UnitFamily, number>;
	/** Unknown-unit totals, keyed by lowercased unit; keeps first-seen display. */
	otherUnits: Map<string, { amount: number; display: string }>;
}

export function buildShoppingList(
	recipes: PlanRecipeInput[],
	catalog: CatalogIngredientInput[]
): ShoppingList {
	const catalogById = new Map<string, CatalogIngredientInput>();
	for (const entry of catalog) {
		catalogById.set(entry.id, entry);
	}

	const accumulators = new Map<string, Accumulator>();

	for (const recipe of recipes) {
		const portions = recipe.portions;
		for (const ing of recipe.ingredients) {
			// Aggregation key: mapped by ingredientId, unmapped by normalized name.
			const key =
				ing.ingredientId !== null
					? `id:${ing.ingredientId}`
					: `raw:${normalizeName(ing.name)}`;

			let acc = accumulators.get(key);
			if (!acc) {
				const catalogEntry =
					ing.ingredientId !== null ? catalogById.get(ing.ingredientId) : undefined;
				acc = {
					ingredientId: ing.ingredientId,
					// Canonical name when mapped & found; otherwise the (trimmed) raw name.
					name: catalogEntry ? catalogEntry.name : ing.name.trim(),
					// Missing-from-catalog mapped ids default to non-staple (defensive).
					isStaple: catalogEntry ? catalogEntry.isStaple : false,
					recipeIds: new Set<string>(),
					unquantified: false,
					familyBase: new Map<UnitFamily, number>(),
					otherUnits: new Map<string, { amount: number; display: string }>()
				};
				accumulators.set(key, acc);
			}

			// Every contribution (even null quantity) counts toward recipeCount.
			acc.recipeIds.add(recipe.recipeId);

			if (ing.quantity === null) {
				acc.unquantified = true;
				continue;
			}

			const scaled = ing.quantity * portions;
			const rawUnit = ing.unit ?? '';
			const classified = classifyUnit(rawUnit);

			if (classified) {
				const prev = acc.familyBase.get(classified.family) ?? 0;
				acc.familyBase.set(classified.family, prev + scaled * classified.toBase);
			} else {
				const unitKey = rawUnit.trim().toLowerCase();
				const existing = acc.otherUnits.get(unitKey);
				if (existing) {
					existing.amount += scaled;
				} else {
					// Preserve first-seen display unit (original casing, trimmed).
					acc.otherUnits.set(unitKey, { amount: scaled, display: rawUnit.trim() });
				}
			}
		}
	}

	// Build line items.
	const einkaufen: ShoppingLineItem[] = [];
	const vorrat: ShoppingLineItem[] = [];
	const nichtZugeordnet: ShoppingLineItem[] = [];

	for (const acc of accumulators.values()) {
		const quantities: ShoppingQuantity[] = [];

		// Known families in a deterministic order: mass, then volume.
		for (const family of ['mass', 'volume'] as UnitFamily[]) {
			const base = acc.familyBase.get(family);
			if (base !== undefined) {
				quantities.push(renderFamilyQuantity(family, base));
			}
		}

		// Unknown units, sorted by their (lowercased) unit key for stability.
		const otherKeys = [...acc.otherUnits.keys()].sort((a, b) => a.localeCompare(b));
		for (const unitKey of otherKeys) {
			const entry = acc.otherUnits.get(unitKey)!;
			quantities.push({ amount: round3(entry.amount), unit: entry.display });
		}

		const item: ShoppingLineItem = {
			ingredientId: acc.ingredientId,
			name: acc.name,
			quantities,
			recipeCount: acc.recipeIds.size,
			unquantified: acc.unquantified
		};

		if (acc.ingredientId === null) {
			nichtZugeordnet.push(item);
		} else if (acc.isStaple) {
			vorrat.push(item);
		} else {
			einkaufen.push(item);
		}
	}

	// Deterministic ordering: by display name (case-insensitive), id as tiebreak.
	const byName = (a: ShoppingLineItem, b: ShoppingLineItem): number => {
		const cmp = a.name.toLowerCase().localeCompare(b.name.toLowerCase());
		if (cmp !== 0) return cmp;
		return (a.ingredientId ?? '').localeCompare(b.ingredientId ?? '');
	};
	einkaufen.sort(byName);
	vorrat.sort(byName);
	nichtZugeordnet.sort(byName);

	return { einkaufen, vorrat, nichtZugeordnet };
}
