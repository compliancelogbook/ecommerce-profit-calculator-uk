"use client";

// Small shared input primitives, styled to match the existing dark/Vercel-style
// visual language exactly (see the classes previously inlined throughout
// Calculator.tsx). Kept here purely to avoid re-typing the same markup in
// every platform panel — no new visual treatment is introduced.

export function FieldLabel({ children }: { children: React.ReactNode }) {
  return <label className="text-sm font-medium text-[#888]">{children}</label>;
}

export function MoneyField({
  label,
  value,
  onChange,
  prefix = '£',
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  prefix?: string;
}) {
  return (
    <div className="space-y-2">
      <FieldLabel>{label}</FieldLabel>
      <div className="relative flex items-center">
        <span className="absolute left-3 text-[#888] font-medium">{prefix}</span>
        <input
          type="number"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full bg-[#0a0a0a] border border-[#333] rounded-md py-2.5 pl-8 pr-4 text-[#eaeaea] text-sm focus:outline-none focus:border-[#888] focus:ring-1 focus:ring-[#888] transition-all"
        />
      </div>
    </div>
  );
}

export function NumberField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="space-y-2">
      <FieldLabel>{label}</FieldLabel>
      <input
        type="number"
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-[#0a0a0a] border border-[#333] rounded-md py-2.5 px-3 text-[#eaeaea] text-sm focus:outline-none focus:border-[#888] focus:ring-1 focus:ring-[#888] transition-all"
      />
    </div>
  );
}

export function SelectField<T extends string>({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string }[];
}) {
  return (
    <div className="space-y-2">
      <FieldLabel>{label}</FieldLabel>
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value as T)}
          className="w-full bg-[#0a0a0a] border border-[#333] text-[#eaeaea] text-sm rounded-md py-2.5 px-3 appearance-none focus:outline-none focus:border-[#888] focus:ring-1 focus:ring-[#888] transition-all cursor-pointer"
        >
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[#888]">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="6 9 12 15 18 9"></polyline>
          </svg>
        </div>
      </div>
    </div>
  );
}

export function SegmentedToggle<T extends string>({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string }[];
}) {
  return (
    <div className="space-y-2">
      <FieldLabel>{label}</FieldLabel>
      <div className={`grid gap-2`} style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}>
        {options.map((o) => (
          <button
            key={o.value}
            type="button"
            onClick={() => onChange(o.value)}
            className={`py-2 text-sm font-medium rounded-md border transition-all ${
              value === o.value
                ? 'bg-[#fff] text-black border-[#fff]'
                : 'bg-[#0a0a0a] text-[#888] border-[#333] hover:border-[#666] hover:text-[#eaeaea]'
            }`}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export function CheckboxField({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex items-center space-x-3 cursor-pointer group">
      <div className="relative flex items-center justify-center">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="peer appearance-none w-4 h-4 rounded-sm border border-[#333] bg-[#0a0a0a] checked:bg-white checked:border-white transition-all focus:outline-none focus:ring-2 focus:ring-white/20"
        />
        <svg className="absolute w-3 h-3 text-black opacity-0 peer-checked:opacity-100 pointer-events-none" viewBox="0 0 14 10" fill="none">
          <path d="M1 5L4.5 8.5L13 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      <div>
        <div className="text-sm font-medium text-[#eaeaea] group-hover:text-white transition-colors">{label}</div>
        {description && <div className="text-xs text-[#888]">{description}</div>}
      </div>
    </label>
  );
}
