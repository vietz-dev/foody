import Link from 'next/link';
import { Button } from '@chakra-ui/react';
import { AppShell, PageHeader } from '../../../components/app-shell';
import { ArrowLeftIcon } from '../../../components/icons';
import { api } from '@/lib/server/api';
import { requireUser } from '@/lib/server/session';
import { CatalogEditor } from './catalog-editor';

export default async function CatalogPage() {
	await requireUser();
	const catalog = await api.catalog.list({});

	return (
		<AppShell
			action={
				<Button asChild size="sm" rounded="full" variant="ghost" fontWeight="bold">
					<Link href="/settings">
						<ArrowLeftIcon size={16} /> Einstellungen
					</Link>
				</Button>
			}
		>
			<PageHeader
				eyebrow="Für euren Haushalt"
				title="Zutatenkatalog"
				subtitle="Prüft neue Zutaten, gebt ihnen klare Namen und führt doppelte Einträge zusammen."
			/>
			<CatalogEditor pending={catalog.pending} confirmed={catalog.confirmed} />
		</AppShell>
	);
}
