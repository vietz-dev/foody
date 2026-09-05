import type { SVGProps } from 'react';

type IconProps = SVGProps<SVGSVGElement> & { size?: number };

function Svg({ size = 20, children, ...props }: IconProps) {
	return (
		<svg
			width={size}
			height={size}
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth={2}
			strokeLinecap="round"
			strokeLinejoin="round"
			aria-hidden="true"
			{...props}
		>
			{children}
		</svg>
	);
}

export const CalendarIcon = (p: IconProps) => (
	<Svg {...p}>
		<rect x="3" y="4" width="18" height="18" rx="3" />
		<path d="M16 2v4M8 2v4M3 10h18" />
	</Svg>
);
export const BookIcon = (p: IconProps) => (
	<Svg {...p}>
		<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
		<path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
	</Svg>
);
export const CartIcon = (p: IconProps) => (
	<Svg {...p}>
		<circle cx="9" cy="21" r="1" />
		<circle cx="20" cy="21" r="1" />
		<path d="M1 1h4l2.7 13.4a2 2 0 0 0 2 1.6h9.7a2 2 0 0 0 2-1.6L23 6H6" />
	</Svg>
);
export const PlusIcon = (p: IconProps) => (
	<Svg {...p}>
		<path d="M12 5v14M5 12h14" />
	</Svg>
);
export const MinusIcon = (p: IconProps) => (
	<Svg {...p}>
		<path d="M5 12h14" />
	</Svg>
);
export const CheckIcon = (p: IconProps) => (
	<Svg {...p}>
		<path d="M20 6 9 17l-5-5" />
	</Svg>
);
export const SearchIcon = (p: IconProps) => (
	<Svg {...p}>
		<circle cx="11" cy="11" r="8" />
		<path d="m21 21-4.3-4.3" />
	</Svg>
);
export const ArrowLeftIcon = (p: IconProps) => (
	<Svg {...p}>
		<path d="M19 12H5M12 19l-7-7 7-7" />
	</Svg>
);
export const ClockIcon = (p: IconProps) => (
	<Svg {...p}>
		<circle cx="12" cy="12" r="10" />
		<path d="M12 6v6l4 2" />
	</Svg>
);
export const UsersIcon = (p: IconProps) => (
	<Svg {...p}>
		<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
		<circle cx="9" cy="7" r="4" />
		<path d="M23 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8" />
	</Svg>
);
export const SettingsIcon = (p: IconProps) => (
	<Svg {...p}>
		<circle cx="12" cy="12" r="3" />
		<path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" />
	</Svg>
);
