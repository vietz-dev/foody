import Link from 'next/link';
import { Badge, Button } from '@chakra-ui/react';
import { AppShell } from '../components/app-shell';
import { BookIcon, CalendarIcon, CartIcon, ClockIcon, UsersIcon } from '../components/icons';
import { api } from '@/lib/server/api';
import { requireUser } from '@/lib/server/session';

const tints = ['bg-[#f4d2b6]', 'bg-[#cfe2c3]', 'bg-[#ead6a7]'];

export default async function Home() {
	const user = await requireUser();
	const [plan, shopping] = await Promise.all([api.plan.list({}), api.shoppingList.get({})]);
	const meals = plan.filter((r) => r.planned);

	const shortcuts = [
		{
			href: '/plan',
			label: 'Wochenplan',
			hint: `${meals.length} Gerichte geplant`,
			icon: CalendarIcon
		},
		{ href: '/recipes', label: 'Rezepte', hint: `${plan.length} gespeichert`, icon: BookIcon },
		{
			href: '/plan/einkaufsliste',
			label: 'Einkauf',
			hint: `${shopping.einkaufen.length} Zutaten offen`,
			icon: CartIcon
		}
	];

	return (
		<AppShell
			action={<span className="text-sm font-semibold text-[var(--muted)]">{user.name}</span>}
		>
			<section className="pt-2">
				<p className="text-xs font-bold tracking-[.18em] text-[var(--green)] uppercase">
					Euer Essen. Eure Woche.
				</p>
				<h1 className="mt-2 text-4xl leading-[1.05] font-black tracking-[-.03em] sm:text-6xl">
					Weniger planen.
					<br />
					<span className="text-[var(--green)]">Mehr genießen.</span>
				</h1>
				<p className="mt-4 max-w-lg text-base leading-7 text-[var(--muted)]">
					Rezepte, Wochenplan und Einkaufsliste an einem Ort – für euch beide.
				</p>
				<div className="mt-6 grid gap-3 sm:flex">
					<Button asChild size="lg" rounded="full" colorPalette="brand" fontWeight="bold">
						<Link href="/plan">Zum Wochenplan</Link>
					</Button>
					<Button asChild size="lg" rounded="full" variant="outline" bg="white" fontWeight="bold">
						<Link href="/recipes">Rezepte entdecken</Link>
					</Button>
				</div>
			</section>

			<section className="mt-8 grid grid-cols-3 gap-2 sm:gap-3">
				{shortcuts.map((s) => {
					const Icon = s.icon;
					return (
						<Link
							key={s.href}
							href={s.href}
							className="flex flex-col gap-2 rounded-2xl border border-[var(--line)] bg-white p-3 transition active:scale-[.98] sm:p-4"
						>
							<span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#e8f4eb] text-[var(--green)]">
								<Icon size={18} />
							</span>
							<span className="text-sm leading-tight font-bold">{s.label}</span>
							<span className="text-[11px] leading-tight text-[var(--muted)]">{s.hint}</span>
						</Link>
					);
				})}
			</section>

			<section className="mt-8 rounded-3xl bg-white p-4 shadow-sm ring-1 ring-[var(--line)] sm:p-6">
				<div className="mb-4 flex items-center justify-between">
					<div>
						<p className="text-xs font-bold tracking-wider text-[var(--muted)] uppercase">
							Diese Woche
						</p>
						<h2 className="mt-0.5 text-xl font-black">Euer Plan</h2>
					</div>
					<Badge colorPalette="brand" variant="subtle" rounded="full" px="3" py="1">
						{meals.length} Gerichte
					</Badge>
				</div>
				{meals.length === 0 ? (
					<p className="py-4 text-center text-sm text-[var(--muted)]">Noch nichts geplant.</p>
				) : (
					<ul className="divide-y divide-[var(--line)]">
						{meals.map((meal, i) => (
							<li key={meal.id} className="flex items-center gap-3 py-3">
								<div
									className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-xl ${tints[i % 3]}`}
								>
									🍽️
								</div>
								<div className="min-w-0 flex-1">
									<Link
										href={`/recipes/${meal.id}`}
										className="line-clamp-2 leading-snug font-bold"
									>
										{meal.name}
									</Link>
									<p className="mt-0.5 flex items-center gap-3 text-xs text-[var(--muted)]">
										{meal.prepTimeMinutes && (
											<span className="inline-flex items-center gap-1">
												<ClockIcon size={12} />
												{meal.prepTimeMinutes} Min
											</span>
										)}
										<span className="inline-flex items-center gap-1">
											<UsersIcon size={12} />
											{meal.portions} Portionen
										</span>
									</p>
								</div>
							</li>
						))}
					</ul>
				)}
				<Button
					asChild
					mt="3"
					w="full"
					variant="ghost"
					colorPalette="brand"
					rounded="xl"
					fontWeight="bold"
				>
					<Link href="/plan">Plan bearbeiten</Link>
				</Button>
			</section>
		</AppShell>
	);
}
