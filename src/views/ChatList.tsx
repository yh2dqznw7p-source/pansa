import { motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { api } from "../lib/api";
import { useApp } from "../lib/store";
import { Avatar } from "../components/Avatar";
import { IconPlus, IconSearch } from "../components/Icons";
import type { Chat } from "../types";

function timeShort(ts: number): string {
  const d = new Date(ts * 1000);
  const now = new Date();
  const sameDay = d.toDateString() === now.toDateString();
  return sameDay
    ? d.toLocaleTimeString("ru", { hour: "2-digit", minute: "2-digit" })
    : d.toLocaleDateString("ru", { day: "2-digit", month: "2-digit" });
}

export function ChatList() {
  const { activeChatId, setActiveChat } = useApp();
  const [chats, setChats] = useState<Chat[]>([]);
  const [query, setQuery] = useState("");

  async function load() {
    try {
      const cs = await api.listChats();
      setChats(cs);
      if (!activeChatId && cs.length) setActiveChat(cs[0].id);
    } catch {}
  }

  useEffect(() => {
    load();
    const t = setInterval(load, 8000);
    return () => clearInterval(t);
  }, []);

  async function create() {
    const title = prompt("Название нового чата");
    if (!title?.trim()) return;
    try {
      const c = await api.createChat(title.trim());
      setChats((cs) => [c, ...cs]);
      setActiveChat(c.id);
    } catch {}
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return chats;
    return chats.filter((c) => c.title.toLowerCase().includes(q));
  }, [chats, query]);

  return (
    <div className="pane lg">
      <div className="pane__head">
        <div className="pane__title pane__title--brand">Чаты</div>
        <div style={{ marginLeft: "auto" }}>
          <button className="btn btn--icon btn--primary" onClick={create} aria-label="Новый чат">
            <IconPlus size={18} />
          </button>
        </div>
      </div>

      <div className="search">
        <IconSearch size={16} className="search__icon" />
        <input
          className="input"
          placeholder="Найти чат"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      <div className="chat-list scroll">
        {filtered.map((c, i) => (
          <motion.div
            key={c.id}
            className={`chat-row ${activeChatId === c.id ? "chat-row--active" : ""}`}
            onClick={() => setActiveChat(c.id)}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: Math.min(i * 0.02, 0.2), duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            whileHover={{ x: 2 }}
          >
            <Avatar seed={c.id} name={c.title} size={44} />
            <div className="chat-row__body">
              <div className="chat-row__top">
                <div className="chat-row__title">{c.title}</div>
                <div className="chat-row__time">{timeShort(c.last_message_at)}</div>
              </div>
              <div className="chat-row__preview">
                {c.last_message ?? "Нет сообщений"}
              </div>
            </div>
          </motion.div>
        ))}
        {filtered.length === 0 && (
          <div className="center muted" style={{ padding: 40, fontSize: 13 }}>
            {query ? "Ничего не найдено" : "Список пуст — создайте первый чат"}
          </div>
        )}
      </div>
    </div>
  );
}
