import Link from 'next/link';
import { Button } from '@chakra-ui/react';
import { ArrowLeftIcon } from '../../components/icons';

export function BackToRecipesLink() {
	return (
		<Button asChild size="sm" rounded="full" variant="ghost" fontWeight="bold">
			<Link href="/recipes">
				<ArrowLeftIcon size={16} /> Rezepte
			</Link>
		</Button>
	);
}
