import type { AuthResult, Chat, Complaint, Message, Role, User } from "../types";

// Detect Tauri runtime: when we're not inside Tauri (e.g. plain `vite` dev in a browser),
// we fall back to direct HTTP calls to the local server at 127.0.0.1:5005.
// This lets the UI be developed even without the Tauri shell running.
const hasTauri = typeof window !== "undefined" && !!(window as any).__TAURI_INTERNALS__;

async function invoke<T>(cmd: string, args?: Record<string, unknown>): Promise<T> {
  if (hasTauri) {
    const { invoke } = await import("@tauri-apps/api/core");
    return invoke<T>(cmd, args);
  }
  // --- Browser fallback (dev-only stub) ---------------------------------
  return browserFallback<T>(cmd, args);
}

// In-browser fallback state, so the UI is usable in plain `vite dev`.
const mem = {
  users: new Map<string, User>(),
  usersByEmail: new Map<string, string>(),
  currentUserId: null as string | null,
  codes: [] as { email: string; code: string; consumed: boolean }[],
  chats: new Map<string, Chat>(),
  messages: [] as Message[],
  complaints: [] as Complaint[],
};

// seed some demo chats
(() => {
  if (mem.chats.size === 0) {
    ["Общий чат", "Поддержка", "Новости"].forEach((title) => {
      const id = crypto.randomUUID();
      mem.chats.set(id, {
        id,
        title,
        members: [],
        last_message_at: Math.floor(Date.now() / 1000),
      });
    });
  }
})();

function nowSec() {
  return Math.floor(Date.now() / 1000);
}

async function browserFallback<T>(cmd: string, args?: any): Promise<T> {
  switch (cmd) {
    case "register_user": {
      const { email, nickname, password, password2 } = args;
      if (password !== password2) return { ok: false, message: "Пароли не совпадают", user: null } as T;
      if (password.length < 6) return { ok: false, message: "Пароль слишком короткий", user: null } as T;
      if (mem.usersByEmail.has(email)) return { ok: false, message: "Email уже используется", user: null } as T;
      const user: User = {
        id: crypto.randomUUID(),
        email,
        nickname,
        balance: 0,
        role: "user",
        created_at: nowSec(),
      };
      mem.users.set(user.id, user);
      mem.usersByEmail.set(email, user.id);
      mem.currentUserId = user.id;
      return { ok: true, message: null, user } as T;
    }
    case "login_user": {
      const { email } = args;
      const id = mem.usersByEmail.get(email);
      if (!id) return { ok: false, message: "Пользователь не найден", user: null } as T;
      const user = mem.users.get(id)!;
      mem.currentUserId = user.id;
      return { ok: true, message: null, user } as T;
    }
    case "logout_user":
      mem.currentUserId = null;
      return true as T;
    case "current_user":
      return (mem.currentUserId ? mem.users.get(mem.currentUserId) ?? null : null) as T;
    case "top_up": {
      const { amount } = args;
      if (amount < 50) throw "Минимальная сумма пополнения — 50 рублей";
      if (!mem.currentUserId) throw "Не авторизован";
      const u = mem.users.get(mem.currentUserId)!;
      u.balance += amount;
      return u as T;
    }
    case "request_verification_code": {
      const { email } = args;
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      mem.codes.push({ email, code, consumed: false });
      console.log(`[browser-fallback] code for ${email} = ${code}`);
      return code as T;
    }
    case "verify_code": {
      const { email, code } = args;
      for (let i = mem.codes.length - 1; i >= 0; i--) {
        const c = mem.codes[i];
        if (!c.consumed && c.email === email && c.code === code) {
          c.consumed = true;
          return true as T;
        }
      }
      return false as T;
    }
    case "list_chats":
      return Array.from(mem.chats.values()) as T;
    case "list_messages": {
      const { chatId } = args;
      return mem.messages.filter((m) => m.chat_id === chatId) as T;
    }
    case "send_message": {
      const { chatId, text } = args;
      if (!mem.currentUserId) throw "Не авторизован";
      const u = mem.users.get(mem.currentUserId)!;
      const msg: Message = {
        id: crypto.randomUUID(),
        chat_id: chatId,
        author_id: u.id,
        author_nickname: u.nickname,
        text,
        created_at: nowSec(),
      };
      mem.messages.push(msg);
      const c = mem.chats.get(chatId);
      if (c) c.last_message_at = msg.created_at;
      return msg as T;
    }
    case "create_chat": {
      const { title } = args;
      const chat: Chat = {
        id: crypto.randomUUID(),
        title,
        members: mem.currentUserId ? [mem.currentUserId] : [],
        last_message_at: nowSec(),
      };
      mem.chats.set(chat.id, chat);
      return chat as T;
    }
    case "list_complaints":
      return mem.complaints as T;
    case "submit_complaint": {
      const { target, reason } = args;
      if (!mem.currentUserId) throw "Не авторизован";
      const u = mem.users.get(mem.currentUserId)!;
      const c: Complaint = {
        id: crypto.randomUUID(),
        from_user_id: u.id,
        from_nickname: u.nickname,
        target,
        reason,
        status: "open",
        created_at: nowSec(),
      };
      mem.complaints.push(c);
      return c as T;
    }
    case "resolve_complaint": {
      const { id } = args;
      const c = mem.complaints.find((c) => c.id === id);
      if (c) {
        c.status = "resolved";
        return true as T;
      }
      return false as T;
    }
    case "list_users":
      return Array.from(mem.users.values()) as T;
    case "assign_role": {
      const { userId, role } = args;
      const u = mem.users.get(userId);
      if (!u) throw "Пользователь не найден";
      u.role = role;
      return u as T;
    }
    case "open_support_window":
      window.open("/support.html", "_blank");
      return undefined as T;
    default:
      throw new Error(`Unknown command ${cmd}`);
  }
}

// ---------- Typed API ----------
export const api = {
  register: (email: string, nickname: string, password: string, password2: string) =>
    invoke<AuthResult>("register_user", { email, nickname, password, password2 }),
  login: (email: string, password: string) =>
    invoke<AuthResult>("login_user", { email, password }),
  logout: () => invoke<boolean>("logout_user"),
  currentUser: () => invoke<User | null>("current_user"),
  topUp: (amount: number) => invoke<User>("top_up", { amount }),
  requestCode: (email: string) => invoke<string>("request_verification_code", { email }),
  verifyCode: (email: string, code: string) =>
    invoke<boolean>("verify_code", { email, code }),
  listChats: () => invoke<Chat[]>("list_chats"),
  listMessages: (chatId: string) => invoke<Message[]>("list_messages", { chatId }),
  sendMessage: (chatId: string, text: string) =>
    invoke<Message>("send_message", { chatId, text }),
  createChat: (title: string) => invoke<Chat>("create_chat", { title }),
  listComplaints: () => invoke<Complaint[]>("list_complaints"),
  submitComplaint: (target: string, reason: string) =>
    invoke<Complaint>("submit_complaint", { target, reason }),
  resolveComplaint: (id: string) => invoke<boolean>("resolve_complaint", { id }),
  listUsers: () => invoke<User[]>("list_users"),
  assignRole: (userId: string, role: Role) =>
    invoke<User>("assign_role", { userId, role }),
  openSupport: () => invoke<void>("open_support_window"),
};
