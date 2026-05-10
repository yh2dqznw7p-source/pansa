import type { AuthResult, Chat, Complaint, Message, Role, User } from "../types";

// ------------------------------------------------------------------
// Server endpoint — fixed default. No port/URL UI in the app.
// Override via VITE_OFFMESSENGER_SERVER env for dev, or the
// OFFMESSENGER_SERVER key in localStorage (set by internal code, not UI).
// ------------------------------------------------------------------

const DEFAULT_SERVER = (import.meta as any).env?.VITE_OFFMESSENGER_SERVER
  || "http://127.0.0.1:5005";

const LS_TOKEN = "offmessenger:token";

export function getServerUrl(): string {
  try {
    const v = localStorage.getItem("OFFMESSENGER_SERVER");
    if (v && v.trim()) return v.trim().replace(/\/$/, "");
  } catch {}
  return DEFAULT_SERVER.replace(/\/$/, "");
}

export function getToken(): string | null {
  try { return localStorage.getItem(LS_TOKEN); } catch { return null; }
}

function setToken(t: string | null) {
  try {
    if (t) localStorage.setItem(LS_TOKEN, t);
    else localStorage.removeItem(LS_TOKEN);
  } catch {}
}

class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

async function request<T>(
  method: string,
  path: string,
  body?: unknown,
  auth: boolean = true,
): Promise<T> {
  const url = `${getServerUrl()}${path}`;
  const headers: Record<string, string> = { "content-type": "application/json" };
  if (auth) {
    const token = getToken();
    if (token) headers.authorization = `Bearer ${token}`;
  }
  const res = await fetch(url, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await res.text();
  const data = text ? tryJson(text) : null;
  if (!res.ok) {
    const msg = (data && typeof data === "object" && (data as any).error) || `HTTP ${res.status}`;
    throw new ApiError(res.status, String(msg));
  }
  return data as T;
}

function tryJson(s: string): unknown {
  try { return JSON.parse(s); } catch { return null; }
}

export function openChatSocket(chatId: string, onMessage: (m: Message) => void): () => void {
  const base = getServerUrl().replace(/^http/, "ws");
  const token = getToken() ?? "";
  const ws = new WebSocket(`${base}/api/chats/${encodeURIComponent(chatId)}/ws?token=${encodeURIComponent(token)}`);
  ws.onmessage = (ev) => {
    try {
      const m = JSON.parse(ev.data) as Message;
      onMessage(m);
    } catch { /* ignore malformed frames */ }
  };
  ws.onerror = () => { /* swallow — UI relies on polling as fallback */ };
  return () => { try { ws.close(); } catch {} };
}

interface ServerAuthResponse { token: string; user: User; }

async function callAuth(path: string, body: unknown): Promise<AuthResult> {
  try {
    const r = await request<ServerAuthResponse>("POST", path, body, false);
    setToken(r.token);
    return { ok: true, message: null, user: r.user };
  } catch (e) {
    setToken(null);
    const msg = e instanceof ApiError ? e.message : String(e);
    return { ok: false, message: msg, user: null };
  }
}

export const api = {
  ping: () => request<{ ok: boolean; service: string; version: string }>("GET", "/health", undefined, false),

  requestCode: async (email: string) => {
    const r = await request<{ ok: boolean; dev_code?: string }>(
      "POST", "/api/auth/send-code", { email }, false,
    );
    return r.dev_code ?? "";
  },
  register: (email: string, nickname: string, password: string, password2: string, code: string) =>
    callAuth("/api/auth/register", { email, nickname, password, password2, code }),
  login: (email: string, password: string) =>
    callAuth("/api/auth/login", { email, password }),
  logout: async () => { setToken(null); return true; },
  currentUser: async (): Promise<User | null> => {
    if (!getToken()) return null;
    try { return await request<User>("GET", "/api/me"); }
    catch (e) {
      if (e instanceof ApiError && e.status === 401) setToken(null);
      return null;
    }
  },

  topUp: (amount: number) => request<User>("POST", "/api/me/top-up", { amount }),

  setUsername: (username: string) => request<User>("POST", "/api/me/username", { username }),
  setNickname: (nickname: string) => request<User>("POST", "/api/me/nickname", { nickname }),
  setDescription: (description: string) => request<User>("POST", "/api/me/description", { description }),
  setAvatar: (avatar_url: string) => request<User>("POST", "/api/me/avatar", { avatar_url }),

  searchUsers: (q: string) => request<User[]>("GET", `/api/users/search?q=${encodeURIComponent(q)}`),
  openDm: (username: string) => request<Chat>("POST", "/api/dm/open", { username }),

  listChats: () => request<Chat[]>("GET", "/api/chats"),
  createChat: (title: string) => request<Chat>("POST", "/api/chats", { title }),
  listMessages: (chatId: string) =>
    request<Message[]>("GET", `/api/chats/${encodeURIComponent(chatId)}/messages`),
  sendMessage: (chatId: string, text: string) =>
    request<Message>("POST", `/api/chats/${encodeURIComponent(chatId)}/messages`, { chat_id: chatId, text }),

  listComplaints: () => request<Complaint[]>("GET", "/api/complaints"),
  submitComplaint: (target: string, reason: string) =>
    request<Complaint>("POST", "/api/complaints", { target, reason }),
  resolveComplaint: (id: string) =>
    request<{ ok: boolean }>("POST", `/api/complaints/${encodeURIComponent(id)}/resolve`)
      .then((r) => r.ok),

  listUsers: () => request<User[]>("GET", "/api/users"),
  assignRole: (userId: string, role: Role) =>
    request<User>("POST", "/api/roles/assign", { user_id: userId, role }),
};

export { ApiError };
