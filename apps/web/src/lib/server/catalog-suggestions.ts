import { createAnthropic } from '@ai-sdk/anthropic';
import { generateText, Output } from 'ai';
import type { CatalogEntry } from '@foody/contracts';
import { z } from 'zod';

const proposalSchema = z.object({
	groups: z.array(
		z.object({
			ids: z.array(z.string()).min(1),
			name: z.string().min(1),
			reason: z.string()
		})
	)
});

export type CatalogSuggestion = {
	ids: string[];
	name: string;
	reason: string;
};

export type CatalogSuggestionResult = {
	groups: CatalogSuggestion[];
	source: 'ai' | 'rules';
	reason?: 'too_many' | 'missing_key' | 'provider_error';
};

const usageSuffix = /\s*\(([^)]*)\)\s*$/;
const usageWords = /\b(?:restlich|optional|zusätzlich|zum|zur|für|als|topping|garnieren)\b/i;

export function suggestObviousGroups(entries: CatalogEntry[]): CatalogSuggestion[] {
	const groups = new Map<string, { name: string; ids: string[]; changed: boolean }>();
	for (const entry of entries) {
		const suffix = entry.name.match(usageSuffix);
		const name =
			suffix && usageWords.test(suffix[1]) && !/\boder\b/i.test(suffix[1])
				? entry.name.slice(0, suffix.index).trim()
				: entry.name.trim();
		const key = name.toLocaleLowerCase('de');
		if (!key) continue;
		const group = groups.get(key) ?? { name, ids: [], changed: false };
		group.ids.push(entry.id);
		group.changed ||= name !== entry.name;
		groups.set(key, group);
	}
	return [...groups.values()]
		.filter((group) => group.changed)
		.map((group) => ({
			ids: group.ids,
			name: group.name,
			reason: 'Gleiche Zutat mit einem Zusatz zur Verwendung.'
		}));
}

export function validateCatalogSuggestions(
	groups: z.infer<typeof proposalSchema>['groups'],
	entries: CatalogEntry[]
): CatalogSuggestion[] {
	const byId = new Map(entries.map((entry) => [entry.id, entry]));
	const used = new Set<string>();
	const usedNames = new Set<string>();
	const valid: CatalogSuggestion[] = [];
	for (const group of [...groups].sort((a, b) => b.ids.length - a.ids.length)) {
		const ids = [...new Set(group.ids)];
		const name = group.name.trim();
		const nameKey = name.toLocaleLowerCase('de');
		const picnicProductIds = new Set(
			ids.map((id) => byId.get(id)?.picnicProductId).filter((id) => id != null)
		);
		if (
			!name ||
			usedNames.has(nameKey) ||
			picnicProductIds.size > 1 ||
			ids.length !== group.ids.length ||
			ids.some((id) => !byId.has(id) || used.has(id)) ||
			ids.some((id) => /\boder\b/i.test(byId.get(id)?.name ?? '')) ||
			(ids.length === 1 && byId.get(ids[0])?.name === name)
		)
			continue;
		ids.forEach((id) => used.add(id));
		usedNames.add(nameKey);
		valid.push({ ids, name, reason: group.reason.trim() });
	}
	return valid;
}

export async function suggestCatalogGroups(
	entries: CatalogEntry[]
): Promise<CatalogSuggestionResult> {
	if (!entries.length) return { groups: [], source: 'ai' };
	const fallback = (reason: NonNullable<CatalogSuggestionResult['reason']>) => ({
		groups: suggestObviousGroups(entries),
		source: 'rules' as const,
		reason
	});
	if (entries.length > 150) return fallback('too_many');
	if (!process.env.ANTHROPIC_API_KEY) return fallback('missing_key');

	try {
		const anthropic = createAnthropic({
			apiKey: process.env.ANTHROPIC_API_KEY,
			baseURL: 'https://api.anthropic.com'
		});
		const { output } = await generateText({
			model: anthropic('claude-haiku-5-5'),
			output: Output.object({ schema: proposalSchema }),
			system: `Du bereinigst einen deutschen Zutatenkatalog für Rezepte und Einkaufslisten.
Schlage nur sinnvolle, sichere Normalisierungen und Gruppen aus den gegebenen IDs vor.
Klammerzusätze wie „zum Braten“, „restlich“ oder „zum Garnieren“ beschreiben oft nur die Verwendung; „Öl (zum Braten)“ kann deshalb zu „Öl“ gehören.
Unterscheide aber Sorten und Produkte: Olivenöl, Sesamöl und neutrales Öl, frische und getrocknete Kräuter, sowie unterschiedliche Fleischarten dürfen nicht blind zusammengeführt werden. Zusätze mit „oder“ nennen oft ein anderes Produkt und sind unsicher.
Wenn zwei Einträge unterschiedliche Picnic-Produkte haben, schlage keine Zusammenführung vor.
Wenn eine Zusammenführung mehrdeutig ist, lass sie weg. Gib nur Gruppen mit mindestens zwei passenden Einträgen oder eine einzelne Zutat mit einem verbesserten Namen zurück.
Gib jeden einheitlichen Namen nur einmal zurück. Falls mehrere passende Einträge denselben Namen erhalten sollen, fasse ihre IDs in einer Gruppe zusammen.
Erfinde keine IDs. Verwende kurze deutsche Gruppennamen und je Gruppe einen kurzen Grund. Alle Änderungen müssen vor dem Speichern durch einen Menschen bestätigt werden.`,
			prompt: JSON.stringify(
				entries.map(({ id, name, aliases, picnicProductName }) => ({
					id,
					name,
					aliases,
					picnicProductName
				}))
			)
		});
		return { groups: validateCatalogSuggestions(output.groups, entries), source: 'ai' };
	} catch {
		return fallback('provider_error');
	}
}
