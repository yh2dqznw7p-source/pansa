import { create } from "zustand";
import type { User } from "../types";
import { api } from "./api";

export type Theme = "light" | "dark" | "system";
export type Route = "login" | "register" | "chats" | "settings";

interface AppState {
  user: User | null;
  route: Route;
  theme: Theme;
  activeChatId: string | null;
  topUpOpen: boolean;

  // UI toggles
  particles: boolean;

  // Notifications
  notifications: boolean;
  sounds: boolean;

  // Privacy
  readReceipts: boolean;
  lastSeen: boolean;
  allowGroupInvites: boolean;
  allowChannelInvites: boolean;

  // Chat
  compactChats: boolean;

  setUser: (u: User | null) => void;
  setRoute: (r: Route) => void;
  setActiveChat: (id: string | null) => void;
  setTheme: (t: Theme) => void;
  openTopUp: () => void;
  closeTopUp: () => void;
  toggle: (key: keyof Pick<AppState,
    "particles" | "notifications" | "sounds" | "readReceipts" | "lastSeen" |
    "compactChats" | "allowGroupInvites" | "allowChannelInvites">) => void;
  refreshUser: () => Promise<void>;
  logout: () => Promise<void>;
}

const LS_KEY = "offmessenger:settings";

function loadSettings(): Partial<AppState> {
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
}

function saveSettings(s: Partial<AppState>) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify({
      theme: s.theme,
      particles: s.particles,
      notifications: s.notifications,
      sounds: s.sounds,
      readReceipts: s.readReceipts,
      lastSeen: s.lastSeen,
      allowGroupInvites: s.allowGroupInvites,
      allowChannelInvites: s.allowChannelInvites,
      compactChats: s.compactChats,
    }));
  } catch {}
}

const initial = loadSettings();

export const useApp = create<AppState>((set, get) => ({
  user: null,
  route: "login",
  theme: (initial.theme as Theme) ?? "dark",
  activeChatId: null,
  topUpOpen: false,

  particles: initial.particles ?? true,
  notifications: initial.notifications ?? true,
  sounds: initial.sounds ?? true,
  readReceipts: initial.readReceipts ?? true,
  lastSeen: initial.lastSeen ?? true,
  allowGroupInvites: initial.allowGroupInvites ?? true,
  allowChannelInvites: initial.allowChannelInvites ?? true,
  compactChats: initial.compactChats ?? false,

  setUser: (u) => set({ user: u, route: u ? "chats" : "login" }),
  setRoute: (r) => set({ route: r }),
  setActiveChat: (id) => set({ activeChatId: id }),
  setTheme: (t) => {
    document.documentElement.setAttribute("data-theme", t);
    set({ theme: t });
    saveSettings({ ...get(), theme: t });
  },
  openTopUp: () => set({ topUpOpen: true }),
  closeTopUp: () => set({ topUpOpen: false }),
  toggle: (key) => set((s) => {
    const next = { ...s, [key]: !s[key] };
    saveSettings(next);
    return { [key]: next[key] } as any;
  }),
  refreshUser: async () => {
    const u = await api.currentUser();
    const cur = get().route;
    set({
      user: u,
      route: u ? (cur === "login" || cur === "register" ? "chats" : cur) : "login",
    });
  },
  logout: async () => {
    await api.logout();
    set({ user: null, route: "login", activeChatId: null });
  },
}));

if (typeof document !== "undefined") {
  document.documentElement.setAttribute("data-theme", useApp.getState().theme);
}
