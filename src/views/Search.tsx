import { motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { api } from "../lib/api";
import { useApp } from "../lib/store";
import { Avatar } from "../components/Avatar";
import { IconSearch } from "../components/Icons";
import type { User } from "../types";

export function Search() {
  const { user, setRoute, setActiveChat } = useApp();
  const [q, setQ] = useState("");
  const [results, setResults] = useState<User[]>([]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // debounce input
  useEffect(() => {
    const qt = q.trim();
    if (!qt) { setResults([]); setErr(null); return; }
    setBusy(true);
    const t = setTimeout(async () => {
      try {
        const us = await api.searchUsers(qt);
        setResults(us);
        setErr(null);
      } catch (e: any) {
        setErr(e?.message ?? "Ошибка поиска");
        setResults([]);
      } finally {
        setBusy(false);
      }
    }, 200);
    return () => clearTimeout(t);
  }, [q]);

  const mine = user?.id;
  const list = useMemo(() => results.filter((u) => u.id !== mine), [results, mine]);

  async function openDm(u: User) {
    if (!u.username) return;
    try {
      const chat = await api.openDm(u.username);
      setActiveChat(chat.id);
      setRoute("chats");
    } catch (e: any) {
      alert(e?.message ?? "Не удалось открыть чат");
    }
  }

  return (
    <div className="pane lg">
      <div className="pane__head">
        <div className="pane__title pane__title--brand">Поиск</div>
      </div>

      <div className="search">
        <IconSearch size={16} className="search__icon" />
        <input
          className="input"
          placeholder="Введите юзернейм или имя"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          autoFocus
        />
      </div>

      <div className="search-hits scroll">
        {busy && list.length === 0 && (
          <div className="center muted" style={{ padding: 40, fontSize: 13 }}>
            Ищу…
          </div>
        )}
        {err && <div className="hint-error" style={{ padding: "0 12px" }}>{err}</div>}

        {!busy && q.trim() && list.length === 0 && !err && (
          <div className="center muted" style={{ padding: 40, fontSize: 13 }}>
            Никого не нашлось по «{q.trim()}»
          </div>
        )}

        {!q.trim() && (
          <div className="center muted" style={{ padding: 40, fontSize: 13, textAlign: "center" }}>
            <div>Поиск по юзернейму или нику</div>
            <div className="subtle" style={{ marginTop: 6, fontSize: 12 }}>
              Попросите собеседника установить юзернейм в Настройках
            </div>
          </div>
        )}

        {list.map((u) => (
          <motion.button
            key={u.id}
            className="search-hit"
            onClick={() => openDm(u)}
            disabled={!u.username}
            whileTap={{ scale: 0.99 }}
            title={u.username ? "Открыть чат" : "У пользователя нет юзернейма"}
          >
            <Avatar seed={u.id} name={u.nickname} size={44} />
            <div className="search-hit__body">
              <div className="search-hit__name">{u.nickname}</div>
              <div className="search-hit__handle">
                {u.username ? `@${u.username}` : "— без юзернейма —"}
              </div>
            </div>
            <span className={`role-badge role-${u.role}`}>{u.role}</span>
          </motion.button>
        ))}
      </div>
    </div>
  );
}
