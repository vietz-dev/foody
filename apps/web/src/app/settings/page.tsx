import { AppShell, PageHeader } from '../../components/app-shell';
import { api } from '@/lib/server/api';
import { requireUser } from '@/lib/server/session';
import { PicnicConnect } from './picnic-connect';

export default async function SettingsPage() {
	const user = await requireUser();
	const picnic = await api.picnic.status({});

	return (
		<AppShell
			action={<span className="text-sm font-semibold text-[var(--muted)]">{user.name}</span>}
		>
			<PageHeader eyebrow="Nur für dich" title="Einstellungen" />
			<PicnicConnect initial={picnic} />
			<section className="mt-8 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-[var(--line)]">
				<h2 className="text-lg font-bold">Für euren Haushalt</h2>
				<p className="mt-1 text-sm text-[var(--muted)]">
					Namen vereinheitlichen und doppelte Zutaten zusammenführen.
				</p>
				<Link
					href="/settings/catalog"
					className="mt-3 inline-block text-sm font-bold text-[var(--green)]"
				>
					Zutatenkatalog bearbeiten →
				</Link>
			</section>
		</AppShell>
	);
}
import Link from 'next/link';
