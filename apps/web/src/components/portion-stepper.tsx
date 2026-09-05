'use client';
import { IconButton } from '@chakra-ui/react';
import { MinusIcon, PlusIcon } from './icons';

export function PortionStepper({
	value,
	onChange,
	min = 1
}: {
	value: number;
	onChange: (value: number) => void;
	min?: number;
}) {
	return (
		<div className="flex items-center gap-1 rounded-full bg-[#f1f2ee] p-0.5">
			<IconButton
				aria-label="Weniger Portionen"
				size="sm"
				rounded="full"
				variant="ghost"
				disabled={value <= min}
				onClick={() => onChange(value - 1)}
			>
				<MinusIcon size={16} />
			</IconButton>
			<span className="w-6 text-center text-base font-bold tabular-nums">{value}</span>
			<IconButton
				aria-label="Mehr Portionen"
				size="sm"
				rounded="full"
				variant="ghost"
				onClick={() => onChange(value + 1)}
			>
				<PlusIcon size={16} />
			</IconButton>
		</div>
	);
}
