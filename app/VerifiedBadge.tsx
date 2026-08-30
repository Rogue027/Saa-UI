import { BadgeCheck } from 'lucide-react';

export function VerifiedBadge({ label, detail }: { label: string; detail: string }) {
  const badgeColour = 'var(--verify-500)';

  return (
    <div
      className="v-badge"
      aria-label={`${label}. ${detail}`}
      style={{ color: badgeColour, borderColor: 'currentColor' }}
    >
      <BadgeCheck aria-hidden="true" size={19} strokeWidth={1.9} />
      <span>
        <strong>{label}</strong>
        <small>{detail}</small>
      </span>
    </div>
  );
}
