import { create } from "zustand";
import type { User } from "../types";
import { api } from "./api";

export type Theme = "light" | "dark" | "system";
export type Route = "login" | "register" | "home" | "chats" | "settings";

interface AppState {
  user: User | null;
  route: Route;
  theme: Theme;
  topUpOpen: boolean;

  // Settings toggles persisted in localStorage
  notifications: boolean;
  sounds: boolean;
  readReceipts: boolean;
  lastSeen: boolean;
  compactChats: boolean;

  setUser: (u: User | null) => void;
  setRoute: (r: Route) => void;
  setTheme: (t: Theme) => void;
  openTopUp: () => void;
  closeTopUp: () => void;
  toggle: (key: keyof Pick<AppState, "notifications" | "sounds" | "readReceipts" | "lastSeen" | "compactChats">) => void;
  refreshUser: () => Promise<void>;
  logout: () => Promise<void>;
}

const LS_KEY = "offmessenger:settings";

function loadSettings() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as Partial<AppState>;
  } catch {
    return {};
  }
}

function saveSettings(s: Partial<AppState>) {
  try {
    localStorage.setItem(
      LS_KEY,
      JSON.stringify({
        theme: s.theme,
        notifications: s.notifications,
        sounds: s.sounds,
        readReceipts: s.readReceipts,
        lastSeen: s.lastSeen,
        compactChats: s.compactChats,
      })
    );
  } catch {
    /* ignore */
  }
}

const initial = loadSettings();

export const useApp = create<AppState>((set, get) => ({
  user: null,
  route: "login",
  theme: (initial.theme as Theme) ?? "system",
  topUpOpen: false,

  notifications: initial.notifications ?? true,
  sounds: initial.sounds ?? true,
  readReceipts: initial.readReceipts ?? true,
  lastSeen: initial.lastSeen ?? true,
  compactChats: initial.compactChats ?? false,

  setUser: (u) => set({ user: u, route: u ? "home" : "login" }),
  setRoute: (r) => set({ route: r }),
  setTheme: (t) => {
    document.documentElement.setAttribute("data-theme", t);
    set({ theme: t });
    saveSettings({ ...get(), theme: t });
  },
  openTopUp: () => set({ topUpOpen: true }),
  closeTopUp: () => set({ topUpOpen: false }),
  toggle: (key) =>
    set((s) => {
      const next = { ...s, [key]: !s[key] };
      saveSettings(next);
      return { [key]: next[key] } as any;
    }),
  refreshUser: async () => {
    const u = await api.currentUser();
    set({ user: u, route: u ? get().route === "login" || get().route === "register" ? "home" : get().route : "login" });
  },
  logout: async () => {
    await api.logout();
    set({ user: null, route: "login" });
  },
}));

// Apply theme on boot
if (typeof document !== "undefined") {
  document.documentElement.setAttribute("data-theme", useApp.getState().theme);
}
