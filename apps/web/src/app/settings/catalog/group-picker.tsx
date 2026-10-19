'use client';
import { useState } from 'react';
import { Field, Input, InputGroup } from '@chakra-ui/react';
import type { CatalogEntry } from '@foody/contracts';
import { SearchIcon } from '../../../components/icons';
import { PickerDialog } from '../../../components/picker-dialog';

const normalize = (value: string) =>
	value
		.toLocaleLowerCase('de')
		.replace(/ß/g, 'ss')
		.normalize('NFKD')
		.replace(/\p{Diacritic}/gu, '')
		.replace(/[^\p{L}\p{N}]+/gu, ' ')
		.trim();

function editDistance(left: string, right: string): number {
	let previous = Array.from({ length: right.length + 1 }, (_, index) => index);
	for (let row = 1; row <= left.length; row++) {
		const current = [row];
		for (let column = 1; column <= right.length; column++) {
			current[column] = Math.min(
				current[column - 1] + 1,
				previous[column] + 1,
				previous[column - 1] + Number(left[row - 1] !== right[column - 1])
			);
		}
		previous = current;
	}
	return previous[right.length];
}

function matchScore(query: string, value: string): number {
	if (!query) return 0;
	const text = normalize(value);
	if (text === query) return 0;
	if (text.startsWith(query)) return 1;
	if (text.includes(query)) return 2;
	const words = text.split(' ');
	let score = 3;
	for (const term of query.split(' ')) {
		const distance = Math.min(
			...words.map((word) => {
				if (word.startsWith(term)) return 0;
				if (word.includes(term)) return 1;
				return editDistance(term, word);
			})
		);
		if (distance > Math.max(1, Math.floor(term.length / 4))) return Infinity;
		score += distance;
	}
	return score;
}

export function GroupPicker({
	groups,
	selectedId,
	onSelect,
	onClose
}: {
	groups: CatalogEntry[];
	selectedId: string;
	onSelect: (id: string) => void;
	onClose: () => void;
}) {
	const [query, setQuery] = useState('');
	const search = normalize(query);
	const results = groups
		.map((group) => ({
			group,
			score: Math.min(
				...[group.name, ...group.aliases, ...group.expressions.map((member) => member.name)].map(
					(value) => matchScore(search, value)
				)
			)
		}))
		.filter(({ score }) => Number.isFinite(score))
		.sort(
			(left, right) =>
				left.score - right.score || left.group.name.localeCompare(right.group.name, 'de')
		);

	return (
		<PickerDialog title="Zutatengruppe auswählen" onClose={onClose}>
			<Field.Root>
				<Field.Label>Gruppen suchen</Field.Label>
				<InputGroup startElement={<SearchIcon size={18} />}>
					<Input
						autoFocus
						value={query}
						onChange={(event) => setQuery(event.target.value)}
						onKeyDown={(event) => {
							if (event.key === 'Enter' && results[0]) {
								event.preventDefault();
								onSelect(results[0].group.id);
							}
						}}
						placeholder="Name oder Ausdruck …"
					/>
				</InputGroup>
			</Field.Root>
			<p className="mt-2 text-xs text-[#59665d]">Nur bestätigte Gruppen werden angezeigt.</p>
			{results.length ? (
				<ul className="mt-3 max-h-[24rem] divide-y divide-[var(--line)] overflow-y-auto rounded-xl border border-[var(--line)]">
					{results.map(({ group }) => (
						<li key={group.id}>
							<button
								type="button"
								aria-current={selectedId === group.id ? 'true' : undefined}
								onClick={() => onSelect(group.id)}
								className={`flex w-full flex-col gap-0.5 px-3 py-3 text-left hover:bg-[#f3f8f3] focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[var(--green)] ${selectedId === group.id ? 'bg-[#e8f4eb]' : ''}`}
							>
								<span className="text-sm font-semibold">{group.name}</span>
								<span className="text-xs text-[#59665d]">
									{group.expressions.length}{' '}
									{group.expressions.length === 1 ? 'Ausdruck' : 'Ausdrücke'}
								</span>
							</button>
						</li>
					))}
				</ul>
			) : (
				<p role="status" className="mt-4 text-sm text-[#59665d]">
					Keine bestätigte Gruppe gefunden.
				</p>
			)}
		</PickerDialog>
	);
}
