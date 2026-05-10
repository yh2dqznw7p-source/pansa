// Deterministic colourful avatar — hashes the seed (nickname / id)
// to pick a gradient from a palette. No images needed.

const PALETTE: [string, string][] = [
  ["#ff7bb0", "#b88cff"],
  ["#7c5cff", "#4a7dff"],
  ["#4de3a4", "#22d3ee"],
  ["#ffbe4d", "#ff5d7d"],
  ["#ff5d9d", "#a855ff"],
  ["#22d3ee", "#6ea8ff"],
  ["#b44dff", "#6ea8ff"],
  ["#ffc85a", "#ff7bb0"],
];

function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

export function avatarInitials(name: string): string {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((p) => p[0]?.toUpperCase() ?? "").join("") || name[0].toUpperCase();
}

export function avatarGradient(seed: string): string {
  const [a, b] = PALETTE[hash(seed || "-") % PALETTE.length];
  return `linear-gradient(135deg, ${a}, ${b})`;
}

export function Avatar({
  seed,
  name,
  size = 44,
  className,
}: {
  seed: string;
  name: string;
  size?: number;
  className?: string;
}) {
  return (
    <div
      className={className}
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: avatarGradient(seed),
        display: "grid",
        placeItems: "center",
        color: "white",
        fontWeight: 700,
        fontSize: Math.max(11, size * 0.38),
        boxShadow: "0 0 0 1px var(--glass-border-strong)",
        letterSpacing: "0.02em",
        flexShrink: 0,
      }}
    >
      {avatarInitials(name)}
    </div>
  );
}
