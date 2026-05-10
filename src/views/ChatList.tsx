import { motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { api } from "../lib/api";
import { useApp } from "../lib/store";
import { Avatar } from "../components/Avatar";
import type { Chat, User } from "../types";

function timeShort(ts: number): string {
  const d = new Date(ts * 1000);
  const now = new Date();
  const sameDay = d.toDateString() === now.toDateString();
  return sameDay
    ? d.toLocaleTimeString("ru", { hour: "2-digit", minute: "2-digit" })
    : d.toLocaleDateString("ru", { day: "2-digit", month: "2-digit" });
}

function chatDisplayName(c: Chat): string {
  if (c.is_dm && c.peer) return c.peer.nickname;
  return c.title || "Без названия";
}

export function ChatList() {
  const { activeChatId, setActiveChat } = useApp();
  const [chats, setChats] = useState<Chat[]>([]);
  const [query, setQuery] = useState("");
  const [hits, setHits] = useState<User[]>([]);
  const [searching, setSearching] = useState(false);

  async function load() {
    try {
      const cs = await api.listChats();
      setChats(cs);
    } catch {}
  }

  useEffect(() => {
    load();
    const t = setInterval(load, 4000);
    return () => clearInterval(t);
  }, []);

  // Debounced server-side search by username/nickname.
  useEffect(() => {
    const q = query.trim();
    if (!q) { setHits([]); return; }
    setSearching(true);
    const t = setTimeout(async () => {
      try {
        const us = await api.searchUsers(q);
        setHits(us);
      } catch { setHits([]); }
      finally { setSearching(false); }
    }, 180);
    return () => clearTimeout(t);
  }, [query]);

  const filteredChats = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return chats;
    return chats.filter((c) => {
      const name = chatDisplayName(c).toLowerCase();
      const handle = c.peer?.username?.toLowerCase() ?? "";
      return name.includes(q) || handle.includes(q);
    });
  }, [chats, query]);

  async function openDmFromHit(u: User) {
    if (!u.username) return;
    try {
      const chat = await api.openDm(u.username);
      setActiveChat(chat.id);
      setQuery("");
    } catch {}
  }

  const showingResults = query.trim().length > 0;

  return (
    <div className="pane lg">
      <div className="pane__head">
        <div className="pane__title">Чаты</div>
      </div>

      <div className="search">
        <input
          className="input"
          placeholder="Поиск или юзернейм"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      <div className="chat-list scroll">
        {filteredChats.map((c, i) => (
          <motion.div
            key={c.id}
            className={`chat-row ${activeChatId === c.id ? "chat-row--active" : ""}`}
            onClick={() => { setActiveChat(c.id); setQuery(""); }}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: Math.min(i * 0.02, 0.2), duration: 0.22 }}
            whileHover={{ x: 2 }}
          >
            <Avatar
              seed={c.is_dm && c.peer ? c.peer.id : c.id}
              name={chatDisplayName(c)}
              src={c.is_dm && c.peer ? c.peer.avatar_url ?? undefined : undefined}
              size={44}
            />
            <div className="chat-row__body">
              <div className="chat-row__top">
                <div className="chat-row__title">{chatDisplayName(c)}</div>
                <div className="chat-row__time">{timeShort(c.last_message_at)}</div>
              </div>
              <div className="chat-row__preview">
                {c.peer?.username ? `@${c.peer.username}` : (c.last_message ?? "Откройте, чтобы написать")}
              </div>
            </div>
          </motion.div>
        ))}

        {showingResults && (
          <>
            <div className="chat-list__divider">Пользователи</div>
            {hits.filter((u) => !filteredChats.some((c) => c.peer?.id === u.id)).map((u) => (
              <motion.div
                key={`u-${u.id}`}
                className="chat-row"
                onClick={() => openDmFromHit(u)}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                whileHover={{ x: 2 }}
              >
                <Avatar seed={u.id} name={u.nickname} src={u.avatar_url || undefined} size={44} />
                <div className="chat-row__body">
                  <div className="chat-row__top">
                    <div className="chat-row__title">{u.nickname}</div>
                  </div>
                  <div className="chat-row__preview">
                    {u.username ? `@${u.username}` : "без юзернейма"}
                  </div>
                </div>
              </motion.div>
            ))}
            {!searching && hits.length === 0 && filteredChats.length === 0 && (
              <div className="chat-list__empty">Ничего не найдено по «{query.trim()}»</div>
            )}
          </>
        )}

        {!showingResults && filteredChats.length === 0 && (
          <div className="chat-list__empty">
            Введите юзернейм, чтобы начать чат
          </div>
        )}
      </div>
    </div>
  );
}
