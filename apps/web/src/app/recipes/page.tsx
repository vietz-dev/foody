import Link from 'next/link';
import { Button, IconButton } from '@chakra-ui/react';
import { AppShell, PageHeader } from '../../components/app-shell';
import { ClockIcon, PlusIcon, UsersIcon } from '../../components/icons';
import { api } from '@/lib/server/api';
import { requireUser } from '@/lib/server/session';

const tints = ['bg-[#f4d2b6]', 'bg-[#cfe2c3]', 'bg-[#ead6a7]'];

export default async function RecipesPage() {
	await requireUser();
	const recipes = await api.recipes.list({});

	return (
		<AppShell
			action={
				<Button
					asChild
					size="sm"
					rounded="full"
					colorPalette="brand"
					fontWeight="bold"
					display={{ base: 'none', md: 'inline-flex' }}
				>
					<Link href="/recipes/new">
						<PlusIcon size={16} /> Neues Rezept
					</Link>
				</Button>
			}
		>
			<PageHeader
				eyebrow="Eure Sammlung"
				title="Rezepte"
				subtitle={`${recipes.length} ${recipes.length === 1 ? 'Rezept' : 'Rezepte'} gespeichert`}
			/>

			{recipes.length === 0 ? (
				<div className="flex flex-col items-center gap-4 py-16 text-center">
					<p className="text-sm text-[var(--muted)]">Noch keine Rezepte vorhanden.</p>
					<Button asChild rounded="full" colorPalette="brand" fontWeight="bold">
						<Link href="/recipes/new">Erstes Rezept hinzufügen</Link>
					</Button>
				</div>
			) : (
				<div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
					{recipes.map((recipe, i) => (
						<Link
							key={recipe.id}
							href={`/recipes/${recipe.id}`}
							className="group overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-[var(--line)] transition active:scale-[.98] md:hover:-translate-y-0.5 md:hover:shadow-md"
						>
							<div
								className={`flex aspect-[4/3] items-center justify-center text-4xl ${tints[i % 3]}`}
							>
								🍽️
							</div>
							<div className="p-3">
								<h2 className="line-clamp-2 text-sm leading-snug font-bold group-hover:text-[var(--green)] sm:text-base">
									{recipe.name}
								</h2>
								<p className="mt-1.5 flex items-center gap-2.5 text-xs text-[var(--muted)]">
									{recipe.prepTimeMinutes && (
										<span className="inline-flex items-center gap-1">
											<ClockIcon size={12} />
											{recipe.prepTimeMinutes} Min
										</span>
									)}
									{recipe.declaredServings && (
										<span className="inline-flex items-center gap-1">
											<UsersIcon size={12} />
											{recipe.declaredServings}
										</span>
									)}
								</p>
							</div>
						</Link>
					))}
				</div>
			)}

			<IconButton
				asChild
				aria-label="Neues Rezept"
				colorPalette="brand"
				size="xl"
				rounded="full"
				shadow="lg"
				position="fixed"
				right="4"
				bottom="calc(5rem + env(safe-area-inset-bottom))"
				zIndex="30"
				display={{ base: 'inline-flex', md: 'none' }}
			>
				<Link href="/recipes/new">
					<PlusIcon size={26} />
				</Link>
			</IconButton>
		</AppShell>
	);
}
