import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { api, openChatSocket } from "../lib/api";
import { useApp } from "../lib/store";
import { Avatar } from "../components/Avatar";
import { IconSend } from "../components/Icons";
import type { Chat, Message } from "../types";

function fmtTime(ts: number): string {
  return new Date(ts * 1000).toLocaleTimeString("ru", { hour: "2-digit", minute: "2-digit" });
}
function sameDay(a: number, b: number): boolean {
  return new Date(a * 1000).toDateString() === new Date(b * 1000).toDateString();
}
function fmtDay(ts: number): string {
  const d = new Date(ts * 1000);
  const today = new Date();
  const yesterday = new Date(today.getTime() - 86400000);
  if (d.toDateString() === today.toDateString()) return "Сегодня";
  if (d.toDateString() === yesterday.toDateString()) return "Вчера";
  return d.toLocaleDateString("ru", { day: "numeric", month: "long" });
}

export function Conversation() {
  const { user, activeChatId } = useApp();
  const [chat, setChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!activeChatId) { setChat(null); setMessages([]); return; }
    let cancelled = false;
    (async () => {
      try {
        const cs = await api.listChats();
        if (cancelled) return;
        setChat(cs.find((c) => c.id === activeChatId) ?? null);
        const ms = await api.listMessages(activeChatId);
        if (!cancelled) setMessages(ms);
      } catch {}
    })();
    const close = openChatSocket(activeChatId, (m) => {
      setMessages((prev) => (prev.some((x) => x.id === m.id) ? prev : [...prev, m]));
    });
    return () => { cancelled = true; close(); };
  }, [activeChatId]);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [messages]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    if (!activeChatId || !text.trim()) return;
    try {
      await api.sendMessage(activeChatId, text.trim());
      setText("");
    } catch {}
  }

  if (!activeChatId || !chat) {
    return (
      <div className="pane lg conv conv--empty">
        <div className="conv__placeholder">
          <div className="conv__placeholder-glow" aria-hidden />
          <div className="h1">Выберите чат</div>
          <div className="muted" style={{ fontSize: 14, marginTop: 10 }}>
            Найдите собеседника по юзернейму в списке чатов слева
          </div>
        </div>
      </div>
    );
  }

  const title = chat.is_dm && chat.peer ? chat.peer.nickname : chat.title;
  const subtitle = chat.is_dm && chat.peer?.username ? `@${chat.peer.username}` : "";
  const avatarSrc = chat.is_dm && chat.peer ? chat.peer.avatar_url ?? undefined : undefined;
  const avatarSeed = chat.is_dm && chat.peer ? chat.peer.id : chat.id;

  return (
    <div className="pane lg conv">
      <div className="conv__head">
        <Avatar seed={avatarSeed} name={title} src={avatarSrc} size={44} />
        <div>
          <div className="conv__head-title">{title}</div>
          {subtitle && <div className="conv__head-sub">{subtitle}</div>}
        </div>
      </div>

      <div className="thread scroll" ref={scrollRef}>
        <AnimatePresence initial={false}>
          {messages.map((m, idx) => {
            const mine = m.author_id === user?.id;
            const prev = messages[idx - 1];
            const showDay = !prev || !sameDay(prev.created_at, m.created_at);
            return (
              <div key={m.id}>
                {showDay && <div className="thread__day">{fmtDay(m.created_at)}</div>}
                <motion.div
                  className={`bubble ${mine ? "bubble--mine" : ""}`}
                  initial={{ opacity: 0, y: 8, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ type: "spring", stiffness: 320, damping: 26 }}
                >
                  {!mine && <div className="bubble__author">{m.author_nickname}</div>}
                  <div style={{ whiteSpace: "pre-wrap" }}>{m.text}</div>
                  <div className="bubble__meta">{fmtTime(m.created_at)}</div>
                </motion.div>
              </div>
            );
          })}
        </AnimatePresence>
        {messages.length === 0 && (
          <div className="center muted" style={{ flex: 1, fontSize: 13 }}>
            Нет сообщений — напишите первое
          </div>
        )}
      </div>

      <form className="composer" onSubmit={send}>
        <input
          className="composer__field"
          placeholder="Напишите сообщение…"
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <motion.button
          type="submit"
          className="btn btn--primary btn--icon"
          whileTap={{ scale: 0.92 }}
          disabled={!text.trim()}
          aria-label="Отправить"
        >
          <IconSend size={18} />
        </motion.button>
      </form>
    </div>
  );
}
