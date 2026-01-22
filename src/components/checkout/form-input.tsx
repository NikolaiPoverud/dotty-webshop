'use client';

const INPUT_CLASS = 'w-full px-4 py-4 sm:py-3 bg-muted border-2 border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary text-base transition-colors';

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
      <label className="block text-sm font-bold uppercase tracking-wide mb-2 text-muted-foreground">
        {label}{required && <span className="text-primary"> *</span>}
      </label>
      <input
        type={type}
        name={name}
        required={required}
        value={value}
        onChange={onChange}
        className={INPUT_CLASS}
        autoComplete={type === 'email' ? 'email' : type === 'tel' ? 'tel' : undefined}
      />
    </div>
  );
}

export { INPUT_CLASS };
