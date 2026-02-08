'use client';

const INPUT_CLASS =
  'w-full px-4 py-4 sm:py-3 bg-muted border-2 border-border focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary text-base transition-colors';

export interface FormInputProps {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  className?: string;
  inputMode?: React.HTMLAttributes<HTMLInputElement>['inputMode'];
  pattern?: string;
}

const AUTOCOMPLETE_MAP: Record<string, string> = {
  email: 'email',
  tel: 'tel',
  name: 'name',
  address: 'street-address',
  city: 'address-level2',
  postalCode: 'postal-code',
  country: 'country-name',
};

export function FormInput({
  label,
  name,
  type = 'text',
  required = false,
  value,
  onChange,
  className,
  inputMode,
  pattern,
}: FormInputProps): React.ReactElement {
  const autoComplete = AUTOCOMPLETE_MAP[type] ?? AUTOCOMPLETE_MAP[name];
  const inputId = `field-${name}`;

  return (
    <div className={className}>
      <label htmlFor={inputId} className="block text-sm font-bold uppercase tracking-wide mb-2 text-muted-foreground">
        {label}
        {required && <span className="text-primary"> *</span>}
      </label>
      <input
        id={inputId}
        type={type}
        name={name}
        required={required}
        value={value}
        onChange={onChange}
        className={INPUT_CLASS}
        autoComplete={autoComplete}
        inputMode={inputMode}
        pattern={pattern}
      />
    </div>
  );
}

export { INPUT_CLASS };
