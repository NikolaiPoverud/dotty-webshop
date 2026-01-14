'use client';

const INPUT_CLASS = 'w-full px-4 py-3 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary';

export interface FormInputProps {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  className?: string;
}

export function FormInput({ label, name, type = 'text', required = false, value, onChange, className }: FormInputProps): React.ReactElement {
  return (
    <div className={className}>
      <label className="block text-sm font-medium mb-1">
        {label}{required && ' *'}
      </label>
      <input
        type={type}
        name={name}
        required={required}
        value={value}
        onChange={onChange}
        className={INPUT_CLASS}
      />
    </div>
  );
}

export { INPUT_CLASS };
