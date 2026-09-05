'use client';
import { useEffect, useState } from 'react';
import { Button, Dialog, Input, InputGroup, Portal } from '@chakra-ui/react';
import type { PicnicProduct, PicnicProductRef } from '@foody/contracts';
import { SearchIcon } from '../../../components/icons';
import { searchPicnic } from './actions';

export const picnicImage = (imageId: string | null) =>
	imageId
		? `https://storefront-prod.de.picnicinternational.com/static/images/${imageId}/small.png`
		: null;

export const formatPrice = (cents: number) => `${(cents / 100).toFixed(2).replace('.', ',')} €`;

// Search dialog: pick which Picnic product an ingredient means for this household.
export function PicnicPicker({
	ingredientName,
	current,
	onPick,
	onClose
}: {
	ingredientName: string;
	current: PicnicProductRef | null;
	onPick: (product: PicnicProductRef | null) => void;
	onClose: () => void;
}) {
	const [query, setQuery] = useState(ingredientName);
	const [results, setResults] = useState<PicnicProduct[]>([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState('');

	const search = async (term: string) => {
		if (!term.trim()) return;
		setLoading(true);
		setError('');
		try {
			setResults(await searchPicnic(term.trim()));
		} catch (e) {
			setError(e instanceof Error ? e.message : 'Suche fehlgeschlagen');
		} finally {
			setLoading(false);
		}
	};
	useEffect(() => {
		search(ingredientName);
	}, [ingredientName]);

	return (
		<Dialog.Root open onOpenChange={(e) => !e.open && onClose()} size="lg" scrollBehavior="inside">
			<Portal>
				<Dialog.Backdrop />
				<Dialog.Positioner>
					<Dialog.Content rounded="2xl">
						<Dialog.Header>
							<Dialog.Title>Picnic-Produkt für „{ingredientName}“</Dialog.Title>
						</Dialog.Header>
						<Dialog.Body>
							<form
								onSubmit={(e) => {
									e.preventDefault();
									search(query);
								}}
							>
								<InputGroup startElement={<SearchIcon size={18} />}>
									<Input
										size="lg"
										rounded="xl"
										placeholder="Bei Picnic suchen …"
										value={query}
										onChange={(e) => setQuery(e.target.value)}
									/>
								</InputGroup>
							</form>
							{error && <p className="mt-3 text-sm font-semibold text-red-600">{error}</p>}
							{loading && <p className="mt-3 text-sm text-[var(--muted)]">Suche …</p>}
							<ul className="mt-3 divide-y divide-[var(--line)]">
								{results.map((product) => {
									const image = picnicImage(product.imageId);
									const active = current?.id === product.id;
									return (
										<li key={product.id}>
											<button
												type="button"
												onClick={() =>
													onPick({
														id: product.id,
														name: product.name,
														unitQuantity: product.unitQuantity
													})
												}
												className={`flex w-full items-center gap-3 py-2.5 text-left ${active ? 'text-[var(--green)]' : ''}`}
											>
												{image ? (
													<img
														src={image}
														alt=""
														className="h-12 w-12 shrink-0 rounded-lg object-contain"
													/>
												) : (
													<span className="h-12 w-12 shrink-0 rounded-lg bg-[#f1f2ee]" />
												)}
												<span className="min-w-0 flex-1">
													<span className="line-clamp-2 text-sm leading-snug font-bold">
														{product.name}
													</span>
													<span className="text-xs text-[var(--muted)]">
														{product.unitQuantity} · {formatPrice(product.price)}
													</span>
												</span>
											</button>
										</li>
									);
								})}
							</ul>
						</Dialog.Body>
						<Dialog.Footer>
							{current && (
								<Button variant="ghost" rounded="full" onClick={() => onPick(null)}>
									Zuordnung entfernen
								</Button>
							)}
							<Button variant="outline" rounded="full" onClick={onClose}>
								Schließen
							</Button>
						</Dialog.Footer>
					</Dialog.Content>
				</Dialog.Positioner>
			</Portal>
		</Dialog.Root>
	);
}
