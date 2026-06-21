"use client";

interface Option<T extends string> {
  value: T;
  label: string;
}

interface Props<T extends string> {
  options: Option<T>[];
  value: T;
  onChange: (value: T) => void;
  ariaLabel: string;
}

export function Segmented<T extends string>({ options, value, onChange, ariaLabel }: Props<T>) {
  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      style={{
        display: "inline-flex",
        gap: 2,
        padding: 3,
        background: "var(--surface-sunken)",
        border: "1px solid var(--border)",
        borderRadius: "var(--r-full)",
      }}
    >
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(option.value)}
            style={{
              padding: "6px 14px",
              borderRadius: "var(--r-full)",
              border: "none",
              cursor: "pointer",
              font: "600 13px var(--font-ui)",
              background: active ? "var(--surface)" : "transparent",
              color: active ? "var(--text-primary)" : "var(--text-tertiary)",
              boxShadow: active ? "var(--e-1)" : "none",
              transition: "background var(--motion-fast) var(--ease)",
            }}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
