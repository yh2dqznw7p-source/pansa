// Tiny inline icon set — no external font/icon packages needed.
type P = { size?: number; className?: string };
const S = ({ size = 18, className, children }: P & { children: React.ReactNode }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    {children}
  </svg>
);

export const IconPlus = (p: P) => (
  <S {...p}>
    <path d="M12 5v14M5 12h14" />
  </S>
);
export const IconHome = (p: P) => (
  <S {...p}>
    <path d="M3 12 12 4l9 8" />
    <path d="M5 10v10h14V10" />
  </S>
);
export const IconChat = (p: P) => (
  <S {...p}>
    <path d="M21 15a4 4 0 0 1-4 4H8l-5 3V6a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z" />
  </S>
);
export const IconGear = (p: P) => (
  <S {...p}>
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-1.8-.3 1.6 1.6 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.6 1.6 0 0 0-1-1.5 1.6 1.6 0 0 0-1.8.3l-.1.1A2 2 0 1 1 4.4 17l.1-.1a1.6 1.6 0 0 0 .3-1.8 1.6 1.6 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.6 1.6 0 0 0 1.5-1 1.6 1.6 0 0 0-.3-1.8l-.1-.1A2 2 0 1 1 7 4.4l.1.1a1.6 1.6 0 0 0 1.8.3H9a1.6 1.6 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.6 1.6 0 0 0 1 1.5 1.6 1.6 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0-.3 1.8V9a1.6 1.6 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.6 1.6 0 0 0-1.5 1z" />
  </S>
);
export const IconSend = (p: P) => (
  <S {...p}>
    <path d="M22 2 11 13" />
    <path d="M22 2l-7 20-4-9-9-4z" />
  </S>
);
export const IconClose = (p: P) => (
  <S {...p}>
    <path d="M18 6 6 18M6 6l12 12" />
  </S>
);
export const IconShield = (p: P) => (
  <S {...p}>
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </S>
);
export const IconBell = (p: P) => (
  <S {...p}>
    <path d="M6 8a6 6 0 1 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
    <path d="M10 21a2 2 0 0 0 4 0" />
  </S>
);
export const IconPalette = (p: P) => (
  <S {...p}>
    <circle cx="13.5" cy="6.5" r=".5" fill="currentColor" />
    <circle cx="17.5" cy="10.5" r=".5" fill="currentColor" />
    <circle cx="8.5" cy="7.5" r=".5" fill="currentColor" />
    <circle cx="6.5" cy="12.5" r=".5" fill="currentColor" />
    <path d="M12 2a10 10 0 1 0 0 20c1 0 2-1 2-2v-2c0-1 1-2 2-2h3c1 0 2-1 2-2a10 10 0 0 0-9-12z" />
  </S>
);
export const IconUsers = (p: P) => (
  <S {...p}>
    <circle cx="9" cy="8" r="4" />
    <path d="M17 11a3 3 0 1 0 0-6" />
    <path d="M1 21c0-4 4-6 8-6s8 2 8 6" />
    <path d="M23 21c0-3-2-5-5-5" />
  </S>
);
export const IconFlag = (p: P) => (
  <S {...p}>
    <path d="M4 22V4" />
    <path d="M4 4h14l-3 5 3 5H4" />
  </S>
);
export const IconGoogle = (p: P) => (
  <svg width={p.size ?? 18} height={p.size ?? 18} viewBox="0 0 24 24">
    <path fill="#EA4335" d="M12 10.2v3.8h5.3c-.2 1.3-1.7 3.9-5.3 3.9A6 6 0 1 1 12 6c1.7 0 2.9.7 3.6 1.4l2.4-2.3A9.6 9.6 0 1 0 21.6 12c0-.6-.1-1.2-.2-1.8H12z"/>
  </svg>
);
export const IconVK = (p: P) => (
  <svg width={p.size ?? 18} height={p.size ?? 18} viewBox="0 0 24 24">
    <path fill="#0077FF" d="M12.9 17.1c-5.5 0-8.6-3.8-8.8-10H7c.1 4.5 2.1 6.5 3.7 6.9V7.1h2.9v4.4c1.6-.2 3.3-2.1 3.9-4.4h2.9c-.4 2.8-2.2 4.7-3.5 5.5 1.3.6 3.4 2.3 4.2 5.5h-3.2c-.6-2-2.1-3.5-4.3-3.7v3.7h-.7z"/>
  </svg>
);
export const IconApple = (p: P) => (
  <svg width={p.size ?? 18} height={p.size ?? 18} viewBox="0 0 24 24">
    <path fill="currentColor" d="M16.5 12.6c0-2.9 2.4-4.3 2.5-4.4-1.3-2-3.5-2.2-4.3-2.3-1.8-.2-3.5 1.1-4.4 1.1-.9 0-2.3-1.1-3.8-1-2 0-3.8 1.1-4.8 2.9-2 3.5-.5 8.8 1.5 11.7.9 1.4 2.1 3 3.6 2.9 1.5-.1 2-.9 3.8-.9 1.8 0 2.2.9 3.8.9 1.6 0 2.5-1.4 3.5-2.8 1.1-1.6 1.5-3.2 1.5-3.3-.1 0-2.9-1.1-2.9-4.4zm-3-8.1c.8-1 1.3-2.3 1.2-3.7-1.1 0-2.5.8-3.3 1.7-.7.9-1.4 2.2-1.2 3.5 1.3.1 2.5-.6 3.3-1.5z"/>
  </svg>
);
