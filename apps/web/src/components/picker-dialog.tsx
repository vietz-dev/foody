'use client';
import type { ReactNode } from 'react';
import { Button, Dialog, Portal } from '@chakra-ui/react';

export function PickerDialog({
	title,
	onClose,
	children,
	footerAction
}: {
	title: string;
	onClose: () => void;
	children: ReactNode;
	footerAction?: ReactNode;
}) {
	return (
		<Dialog.Root
			open
			onOpenChange={(event) => !event.open && onClose()}
			size="lg"
			scrollBehavior="inside"
		>
			<Portal>
				<Dialog.Backdrop />
				<Dialog.Positioner>
					<Dialog.Content rounded="2xl">
						<Dialog.Header>
							<Dialog.Title>{title}</Dialog.Title>
						</Dialog.Header>
						<Dialog.Body>{children}</Dialog.Body>
						<Dialog.Footer>
							{footerAction}
							<Button type="button" variant="outline" rounded="full" onClick={onClose}>
								Schließen
							</Button>
						</Dialog.Footer>
					</Dialog.Content>
				</Dialog.Positioner>
			</Portal>
		</Dialog.Root>
	);
}
