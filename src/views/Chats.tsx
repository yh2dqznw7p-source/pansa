import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { api } from "../lib/api";
import { useApp } from "../lib/store";
import { IconSend } from "../components/Icons";
import type { Chat, Message } from "../types";

export function Chats() {
  const { user } = useApp();
  const [chats, setChats] = useState<Chat[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => { api.listChats().then((cs) => { setChats(cs); if (cs.length && !activeId) setActiveId(cs[0].id); }); }, []);
  useEffect(() => { if (!activeId) return; api.listMessages(activeId).then(setMessages); }, [activeId]);
  useEffect(() => { scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" }); }, [messages]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    if (!activeId || !text.trim()) return;
    const m = await api.sendMessage(activeId, text.trim());
    setMessages((ms) => [...ms, m]);
    setText("");
  }

  async function newChat() {
    const title = prompt("Название чата");
    if (!title) return;
    const c = await api.createChat(title);
    setChats((cs) => [...cs, c]);
    setActiveId(c.id);
  }

  return (
    <motion.div className="chat-layout" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
      <div className="chat-list">
        <div style={{ padding: 16, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h3 className="h3">Чаты</h3>
          <button className="lg-button" onClick={newChat}>+ Новый</button>
        </div>
        {chats.map((c) => (
          <motion.div key={c.id} className={`chat-item ${activeId === c.id ? "chat-item--active" : ""}`} onClick={() => setActiveId(c.id)} whileHover={{ x: 2 }}>
            <div className="chat-item__title">{c.title}</div>
            <div className="chat-item__meta">{new Date(c.last_message_at * 1000).toLocaleString("ru")}</div>
          </motion.div>
        ))}
      </div>
      <div className="chat-main">
        <div className="messages scroll" ref={scrollRef}>
          <AnimatePresence initial={false}>
            {messages.map((m) => {
              const mine = m.author_id === user?.id;
              return (
                <motion.div key={m.id} className={`message ${mine ? "message--mine" : ""}`} initial={{ opacity: 0, y: 8, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ type: "spring", stiffness: 300, damping: 24 }}>
                  {!mine && <div className="message__meta">{m.author_nickname}</div>}
                  <div>{m.text}</div>
                </motion.div>
              );
            })}
          </AnimatePresence>
          {messages.length === 0 && <div className="center muted" style={{ height: "100%" }}>Нет сообщений — напишите первое</div>}
        </div>
        <form className="composer" onSubmit={send}>
          <input className="lg-input" placeholder="Сообщение…" value={text} onChange={(e) => setText(e.target.value)} />
          <motion.button type="submit" className="lg-button lg-button--primary" whileTap={{ scale: 0.95 }} disabled={!text.trim() || !activeId}><IconSend size={16} /></motion.button>
        </form>
      </div>
    </motion.div>
  );
}
