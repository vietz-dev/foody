import { Field, Input } from '@chakra-ui/react';

export function CanonicalNameField({
	value,
	onChange,
	disabled,
	helperText,
	rounded
}: {
	value: string;
	onChange: (value: string) => void;
	disabled: boolean;
	helperText?: string;
	rounded?: 'xl';
}) {
	return (
		<Field.Root required invalid={!value.trim()}>
			<Field.Label>Einheitlicher Name</Field.Label>
			<Input
				value={value}
				onChange={(event) => onChange(event.target.value)}
				disabled={disabled}
				rounded={rounded}
			/>
			{helperText && <Field.HelperText>{helperText}</Field.HelperText>}
			<Field.ErrorText>Bitte einen Namen eingeben.</Field.ErrorText>
		</Field.Root>
	);
}
