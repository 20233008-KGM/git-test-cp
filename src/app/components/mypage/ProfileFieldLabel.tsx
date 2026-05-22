import React from "react";

export default function ProfileFieldLabel({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
        <span className="m3-label-large text-[var(--cc-on-surface-variant)]">{label}</span>
        {hint ? (
          <span className="text-[11px] font-medium text-[var(--cc-text-muted)]">{hint}</span>
        ) : null}
      </div>
      {children}
    </div>
  );
}
