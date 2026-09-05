import Link from 'next/link';
import { Badge, Button } from '@chakra-ui/react';
import { AppShell, PageHeader } from '../../../components/app-shell';
import { ArrowLeftIcon } from '../../../components/icons';
import { api } from '@/lib/server/api';
import { requireUser } from '@/lib/server/session';
import { ShoppingGroup } from './shopping-group';

export default async function ShoppingListPage() {
	await requireUser();
	const [list, picnic] = await Promise.all([api.shoppingList.get({}), api.picnic.status({})]);
	const isEmpty = !list.einkaufen.length && !list.vorrat.length && !list.nichtZugeordnet.length;

	return (
		<AppShell
			action={
				<Button asChild size="sm" rounded="full" variant="ghost" fontWeight="bold">
					<Link href="/plan">
						<ArrowLeftIcon size={16} /> Wochenplan
					</Link>
				</Button>
			}
		>
			<PageHeader
				eyebrow="Aus eurem Wochenplan"
				title="Einkaufsliste"
				aside={
					<Badge colorPalette="brand" variant="subtle" rounded="full" px="3" py="1" fontSize="sm">
						{list.einkaufen.length} Zutaten
					</Badge>
				}
			/>

			{isEmpty ? (
				<p className="rounded-2xl border border-dashed border-[var(--line)] p-6 text-center text-sm text-[var(--muted)]">
					Keine Rezepte für diese Woche ausgewählt.{' '}
					<Link href="/plan" className="font-bold text-[var(--green)]">
						Zum Wochenplan
					</Link>
				</p>
			) : (
				<>
					<ShoppingGroup
						title="Einkaufen"
						items={list.einkaufen}
						picnic={{ connected: picnic.status === 'connected' }}
					/>
					<ShoppingGroup title="Vorrat prüfen" items={list.vorrat} muted showRecipeCount />
					<ShoppingGroup title="Nicht zugeordnet" items={list.nichtZugeordnet} muted />
				</>
			)}
		</AppShell>
	);
}
