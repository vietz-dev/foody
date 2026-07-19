/**
 * AI-gestützte Zusammenführungs-Vorschläge für den Zutaten-Katalog: für jeden
 * offenen (pending) Zutatennamen wird geprüft, ob er eine offensichtliche
 * Variante/Synonym/Schreibweise eines bereits bestätigten Katalog-Eintrags ist.
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
			pendingName: z.string().describe('Der offene Zutatenname aus der Eingabeliste (exakt übernommen)'),
			matchedConfirmedName: z
				.string()
				.nullable()
				.describe(
					'Der exakt passende Name aus der Liste bestätigter Zutaten, falls der offene Name eine ' +
						'offensichtliche Variante/Synonym/andere Schreibweise davon ist — sonst null'
				)
		})
	)
});

/**
 * Für jeden `pendingNames`-Eintrag wird der beste passende Namen aus
 * `confirmedNames` vorgeschlagen (oder `null`, wenn keiner passt). Nur Namen,
 * die tatsächlich in `confirmedNames` enthalten sind, werden vorgeschlagen.
 *
 * Defensiv: leere `confirmedNames` → alle `null` ohne AI-Aufruf; ein
 * fehlschlagender AI-Aufruf wird abgefangen und degradiert zu "keine
 * Vorschläge" statt die Seite crashen zu lassen.
 */
export async function suggestMergeTargets(
	pendingNames: string[],
	confirmedNames: string[]
): Promise<Map<string, string | null>> {
	const result = new Map<string, string | null>();
	for (const name of pendingNames) {
		result.set(name, null);
	}

	if (pendingNames.length === 0 || confirmedNames.length === 0) {
		return result;
	}

	try {
		const { object } = await generateObject({
			model: anthropic('claude-sonnet-4-6'),
			schema: SuggestionSchema,
			messages: [
				{
					role: 'user',
					content: `Du hilfst dabei, einen Zutaten-Katalog zu pflegen. Hier ist eine Liste "offener" (noch nicht bestätigter) Zutatennamen und eine Liste bereits bestätigter, kanonischer Zutatennamen.

Prüfe für jeden offenen Namen, ob er eine offensichtliche Variante, ein Synonym oder eine andere Schreibweise EINES der bestätigten Namen ist (z.B. "Zwiebel"/"Zwiebeln", "Tomate"/"Tomaten", "Paprikaschote"/"Paprika"). Schlage NUR einen bestätigten Namen vor, wenn du dir wirklich sicher bist, dass es sich um dieselbe reale Zutat handelt. Wenn kein bestätigter Name eindeutig passt, gib null zurück.

Der vorgeschlagene "matchedConfirmedName" MUSS exakt (Zeichen für Zeichen) einem der Namen aus der Liste bestätigter Zutaten entsprechen.

Offene Zutatennamen:
${pendingNames.map((n) => `- ${n}`).join('\n')}

Bestätigte Zutatennamen:
${confirmedNames.map((n) => `- ${n}`).join('\n')}

Antworte mit genau einem Eintrag pro offenem Zutatennamen.`
				}
			]
		});

		const confirmedSet = new Set(confirmedNames);
		for (const suggestion of object.suggestions) {
			if (!result.has(suggestion.pendingName)) continue;
			const matched = suggestion.matchedConfirmedName;
			if (matched && confirmedSet.has(matched)) {
				result.set(suggestion.pendingName, matched);
			}
		}
	} catch {
		// AI call failed — degrade gracefully to "no suggestions".
	}

	return result;
}
