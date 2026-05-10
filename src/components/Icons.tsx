type P = { size?: number; className?: string };

const S = ({ size = 20, className, children }: P & { children: React.ReactNode }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.9"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    {children}
  </svg>
);

export const IconPlus = (p: P) => <S {...p}><path d="M12 5v14M5 12h14" /></S>;
export const IconClose = (p: P) => <S {...p}><path d="M18 6 6 18M6 6l12 12" /></S>;
export const IconChat = (p: P) => <S {...p}><path d="M21 12a8 8 0 1 1-3-6.2L21 4l-.6 3.3A8 8 0 0 1 21 12Z"/></S>;
export const IconGear = (p: P) => <S {...p}><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-1.8-.3 1.6 1.6 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.6 1.6 0 0 0-1-1.5 1.6 1.6 0 0 0-1.8.3l-.1.1A2 2 0 1 1 4.4 17l.1-.1a1.6 1.6 0 0 0 .3-1.8 1.6 1.6 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.6 1.6 0 0 0 1.5-1 1.6 1.6 0 0 0-.3-1.8l-.1-.1A2 2 0 1 1 7 4.4l.1.1a1.6 1.6 0 0 0 1.8.3H9a1.6 1.6 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.6 1.6 0 0 0 1 1.5 1.6 1.6 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0-.3 1.8V9a1.6 1.6 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.6 1.6 0 0 0-1.5 1z"/></S>;
export const IconSend = (p: P) => <S {...p}><path d="M22 2 11 13"/><path d="M22 2 15 22l-4-9-9-4 20-7Z"/></S>;
export const IconBell = (p: P) => <S {...p}><path d="M6 8a6 6 0 1 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10 21a2 2 0 0 0 4 0"/></S>;
export const IconSparkle = (p: P) => <S {...p}><path d="M12 3 13.6 9.4 20 11l-6.4 1.6L12 19l-1.6-6.4L4 11l6.4-1.6L12 3Z"/></S>;
export const IconLock = (p: P) => <S {...p}><rect x="4" y="10" width="16" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></S>;
export const IconPalette = (p: P) => <S {...p}><path d="M12 2a10 10 0 1 0 0 20c1 0 2-1 2-2v-2c0-1 1-2 2-2h3c1 0 2-1 2-2a10 10 0 0 0-9-12Z"/><circle cx="8.5" cy="7.5" r=".8" fill="currentColor"/><circle cx="6.5" cy="12.5" r=".8" fill="currentColor"/><circle cx="13.5" cy="6.5" r=".8" fill="currentColor"/><circle cx="17.5" cy="10.5" r=".8" fill="currentColor"/></S>;
export const IconLogout = (p: P) => <S {...p}><path d="M10 17l-5-5 5-5"/><path d="M5 12h13"/><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/></S>;
export const IconUser = (p: P) => <S {...p}><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-6 8-6s8 2 8 6"/></S>;
export const IconShield = (p: P) => <S {...p}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></S>;
export const IconFlag = (p: P) => <S {...p}><path d="M4 22V4"/><path d="M4 4h14l-3 5 3 5H4"/></S>;
export const IconGroups = (p: P) => <S {...p}><circle cx="9" cy="8" r="4"/><path d="M17 11a3 3 0 1 0 0-6"/><path d="M1 21c0-4 4-6 8-6s8 2 8 6"/><path d="M23 21c0-3-2-5-5-5"/></S>;
export const IconSearch = (p: P) => <S {...p}><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></S>;
