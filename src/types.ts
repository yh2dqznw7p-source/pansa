export type Role =
  | "user"
  | "helper"
  | "supporter"
  | "creator"
  | "admin"
  | "owner"
  | "title";

export interface User {
  id: string;
  email: string;
  username?: string | null;
  nickname: string;
  balance: number;
  role: Role;
  created_at: number;
}

export interface AuthResult {
  ok: boolean;
  message: string | null;
  user: User | null;
}

export interface Chat {
  id: string;
  title: string;
  owner_id: string;
  is_dm: boolean;
  created_at: number;
  last_message_at: number;
  peer?: User | null;
  last_message?: string | null;
}

export interface Message {
  id: string;
  chat_id: string;
  author_id: string;
  author_nickname: string;
  text: string;
  created_at: number;
}

export interface Complaint {
  id: string;
  from_user_id: string;
  from_nickname: string;
  target: string;
  reason: string;
  status: string;
  created_at: number;
}
