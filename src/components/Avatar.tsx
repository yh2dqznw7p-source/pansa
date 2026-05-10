// Monochrome avatar — first letter, same grey gradient for everyone.
// Supports an optional image URL (uploaded avatar) which overrides the initials.

export function avatarInitials(name: string): string {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((p) => p[0]?.toUpperCase() ?? "").join("") || name[0].toUpperCase();
}

export function Avatar({
  seed,
  name,
  size = 44,
  className,
  src,
}: {
  seed?: string;
  name: string;
  size?: number;
  className?: string;
  src?: string | null;
}) {
  const common: React.CSSProperties = {
    width: size,
    height: size,
    borderRadius: "50%",
    flexShrink: 0,
    boxShadow: "0 0 0 1px var(--glass-border-strong)",
    overflow: "hidden",
  };

  if (src) {
    return (
      <div className={className} style={common}>
        <img
          src={src}
          alt={name}
          draggable={false}
          style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
        />
      </div>
    );
  }

  return (
    <div
      className={className}
      style={{
        ...common,
        background: "linear-gradient(135deg, #2a2a2a, #0a0a0a)",
        display: "grid",
        placeItems: "center",
        color: "#ffffff",
        fontWeight: 700,
        fontSize: Math.max(11, size * 0.38),
        letterSpacing: "0.02em",
      }}
      aria-label={name}
      data-seed={seed}
    >
      {avatarInitials(name)}
    </div>
  );
}
