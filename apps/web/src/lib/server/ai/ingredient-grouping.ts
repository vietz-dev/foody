/**
 * AI-gestützte Zusammenführungs-Vorschläge für den Zutaten-Katalog: für jeden
 * offenen (pending) Zutatennamen wird geprüft, ob er eine offensichtliche
 * Variante/Synonym/Schreibweise eines anderen Katalog-Eintrags ist. Die
 * Kandidatenliste kann sowohl bestätigte als auch andere offene Zutaten
 * enthalten — so bekommt auch ein frischer Backfill (bei dem noch nichts
 * bestätigt ist) Gruppierungsvorschläge zwischen den offenen Einträgen.
 */

import { createAnthropic } from '@ai-sdk/anthropic';
import { generateObject } from 'ai';
import { z } from 'zod';
import { env } from '$env/dynamic/private';

const anthropic = createAnthropic({
	apiKey: env.ANTHROPIC_API_KEY ?? '',
	// Override ANTHROPIC_BASE_URL env var set by Claude Code (local proxy at 127.0.0.1:8787)
	baseURL: 'https://api.anthropic.com'
});

const SuggestionSchema = z.object({
	suggestions: z.array(
		z.object({
			pendingName: z
				.string()
				.describe('Der offene Zutatenname aus der Eingabeliste (exakt übernommen)'),
			matchedConfirmedName: z
				.string()
				.nullable()
				.describe(
					'Der exakt passende Name aus der Kandidatenliste, falls der offene Name eine ' +
						'offensichtliche Variante/Synonym/andere Schreibweise davon ist — sonst null'
				)
		})
	)
});

/**
 * Für jeden `pendingNames`-Eintrag wird der beste passende Name aus
 * `candidateNames` vorgeschlagen (oder `null`, wenn keiner passt). Kandidaten
 * können bestätigte UND andere offene Zutaten sein; ein Name wird nie sich
 * selbst zugeordnet. Nur Namen, die tatsächlich in `candidateNames` enthalten
 * sind, werden vorgeschlagen.
 *
 * Defensiv: leere `candidateNames` → alle `null` ohne AI-Aufruf; ein
 * fehlschlagender AI-Aufruf wird abgefangen (und geloggt) und degradiert zu
 * "keine Vorschläge" statt die Seite crashen zu lassen.
 */
export async function suggestMergeTargets(
	pendingNames: string[],
	candidateNames: string[]
): Promise<Map<string, string | null>> {
	const result = new Map<string, string | null>();
	for (const name of pendingNames) {
		result.set(name, null);
	}

	if (pendingNames.length === 0 || candidateNames.length === 0) {
		return result;
	}

	try {
		const { object } = await generateObject({
			model: anthropic('claude-sonnet-4-6'),
			schema: SuggestionSchema,
			messages: [
				{
					role: 'user',
					content: `Du hilfst dabei, einen Zutaten-Katalog zu pflegen. Hier ist eine Liste "offener" (noch nicht bestätigter) Zutatennamen und eine Liste möglicher Ziel-Zutaten (bestätigte oder andere offene Einträge), in die zusammengeführt werden könnte.

Prüfe für jeden offenen Namen, ob er eine offensichtliche Variante, ein Synonym oder eine andere Schreibweise EINES der Kandidaten ist (z.B. "Zwiebel"/"Zwiebeln", "Tomate"/"Tomaten", "Paprikaschote"/"Paprika"). Schlage NUR einen Kandidaten vor, wenn du dir wirklich sicher bist, dass es sich um dieselbe reale Zutat handelt. Wenn kein Kandidat eindeutig passt, gib null zurück. Ordne einen Namen niemals sich selbst zu.

Der vorgeschlagene "matchedConfirmedName" MUSS exakt (Zeichen für Zeichen) einem der Namen aus der Kandidatenliste entsprechen.

Offene Zutatennamen:
${pendingNames.map((n) => `- ${n}`).join('\n')}

Mögliche Ziel-Zutaten:
${candidateNames.map((n) => `- ${n}`).join('\n')}

Antworte mit genau einem Eintrag pro offenem Zutatennamen.`
				}
			]
		});

		const candidateSet = new Set(candidateNames);
		for (const suggestion of object.suggestions) {
			if (!result.has(suggestion.pendingName)) continue;
			const matched = suggestion.matchedConfirmedName;
			// Never suggest a name as a match for itself.
			if (matched && matched !== suggestion.pendingName && candidateSet.has(matched)) {
				result.set(suggestion.pendingName, matched);
			}
		}
	} catch (err) {
		// AI call failed — degrade gracefully to "no suggestions", but log so a
		// misconfiguration (e.g. bad API key/model) is visible instead of silent.
		console.error('[ingredient-grouping] suggestMergeTargets failed:', err);
	}

	return result;
}
