import Link from 'next/link';
import { Badge, Button } from '@chakra-ui/react';
import { AppShell, PageHeader } from '../../components/app-shell';
import { CartIcon } from '../../components/icons';
import { api } from '@/lib/server/api';
import { requireUser } from '@/lib/server/session';
import { PlanList } from './plan-list';

export default async function PlanPage() {
	await requireUser();
	const recipes = await api.plan.list({});
	const count = recipes.filter((r) => r.planned).length;

	return (
		<AppShell
			action={
				<Button
					asChild
					size="sm"
					rounded="full"
					variant="subtle"
					colorPalette="brand"
					fontWeight="bold"
				>
					<Link href="/plan/einkaufsliste">
						<CartIcon size={16} /> Einkaufsliste
					</Link>
				</Button>
			}
		>
			<PageHeader
				eyebrow="Gemeinsam kochen"
				title="Wochenplan"
				aside={
					<Badge colorPalette="brand" variant="subtle" rounded="full" px="3" py="1" fontSize="sm">
						{count} geplant
					</Badge>
				}
			/>
			<PlanList initial={recipes} />
		</AppShell>
	);
}
