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
		</AppShell>
	);
}
