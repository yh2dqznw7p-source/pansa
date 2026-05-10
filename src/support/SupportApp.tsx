import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { Ambient } from "../components/Ambient";
import { Avatar } from "../components/Avatar";
import { IconFlag, IconGroups, IconSearch, IconServer, IconShield } from "../components/Icons";
import { LiquidGlassFilter } from "../components/LiquidGlassFilter";
import { api, getServerUrl, setServerUrl } from "../lib/api";
import type { Complaint, Role, User } from "../types";

const ROLES: Role[] = ["user", "helper", "supporter", "creator", "admin", "owner", "title"];
const ROLE_LABELS: Record<Role, string> = {
  user: "User", helper: "Helper", supporter: "Supporter", creator: "Creator",
  admin: "Admin", owner: "Owner", title: "Title",
};

function StatusBadge({ status }: { status: Complaint["status"] }) {
  const map: Record<string, { label: string; color: string }> = {
    open: { label: "Открыта", color: "var(--warning)" },
    inprogress: { label: "В работе", color: "var(--accent-2)" },
    resolved: { label: "Решена", color: "var(--success)" },
    rejected: { label: "Отклонена", color: "var(--fg-subtle)" },
  };
  const v = map[status] ?? { label: status, color: "var(--fg-subtle)" };
  return (
    <span className="chip" style={{ color: v.color, borderColor: `color-mix(in srgb, ${v.color} 45%, transparent)` }}>
      ● {v.label}
    </span>
  );
}

export default function SupportApp() {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [query, setQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [server, setServer] = useState(getServerUrl());
  const [authError, setAuthError] = useState(false);

  async function refresh() {
    try {
      const [cs, us] = await Promise.all([api.listComplaints(), api.listUsers()]);
      setComplaints(cs.slice().reverse());
      setUsers(us);
      setAuthError(false);
      if (selectedUser) {
        const fresh = us.find((u) => u.id === selectedUser.id);
        if (fresh) setSelectedUser(fresh);
      }
    } catch (e: any) {
      if (typeof e?.message === "string" && e.message.toLowerCase().includes("token")) {
        setAuthError(true);
      }
    }
  }

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", "dark");
    refresh();
    const t = setInterval(refresh, 4000);
    return () => clearInterval(t);
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return users;
    return users.filter(
      (u) =>
        u.email.toLowerCase().includes(q) ||
        u.nickname.toLowerCase().includes(q) ||
        u.id.toLowerCase().includes(q),
    );
  }, [users, query]);

  async function resolve(id: string) {
    setBusy(id);
    try { await api.resolveComplaint(id); await refresh(); } finally { setBusy(null); }
  }

  async function assign(role: Role) {
    if (!selectedUser) return;
    setBusy(selectedUser.id);
    try {
      const u = await api.assignRole(selectedUser.id, role);
      setSelectedUser(u);
      await refresh();
    } catch (e: any) {
      alert(e?.message ?? "Не удалось изменить роль");
    } finally {
      setBusy(null);
    }
  }

  function saveServer() {
    setServerUrl(server);
    refresh();
  }

  return (
    <>
      <Ambient />
      <LiquidGlassFilter />

      <div className="support-shell drag">
        <div className="support-head lg">
          <div className="row" style={{ gap: 10 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 12,
              background: "linear-gradient(135deg, var(--accent), var(--accent-warm))",
              display: "grid", placeItems: "center", color: "white"
            }}>
              <IconShield size={18} />
            </div>
            <div>
              <div className="h3">OffMessenger · Support</div>
              <div className="subtle" style={{ fontSize: 11 }}>модерация · роли · жалобы</div>
            </div>
          </div>

          <div className="row no-drag" style={{ marginLeft: "auto", gap: 8 }}>
            <IconServer size={14} className="muted" />
            <input
              className="input"
              style={{ width: 260 }}
              value={server}
              onChange={(e) => setServer(e.target.value)}
              placeholder="http://127.0.0.1:5005"
            />
            <button className="btn" onClick={saveServer}>Сохранить</button>
          </div>
        </div>

        {authError && (
          <div className="lg card" style={{ padding: 16 }}>
            <div className="hint-error">Нет токена. Войдите в основном клиенте OffMessenger под учёткой staff/admin, затем снова откройте Support.</div>
          </div>
        )}

        <div className="support-grid">
          {/* Complaints */}
          <motion.section className="panel lg" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
            <div className="panel__head">
              <div className="row">
                <IconFlag />
                <div className="h3">Жалобы</div>
                <span className="chip">{complaints.length}</span>
              </div>
              <button className="btn" onClick={refresh}>Обновить</button>
            </div>
            <div className="panel__scroll scroll">
              <AnimatePresence initial={false}>
                {complaints.map((c) => (
                  <motion.div
                    key={c.id}
                    className="list-item"
                    layout
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ type: "spring", stiffness: 300, damping: 24 }}
                  >
                    <div className="row" style={{ justifyContent: "space-between" }}>
                      <div style={{ minWidth: 0 }}>
                        <div className="h3" style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {c.target}
                        </div>
                        <div className="subtle" style={{ fontSize: 11, marginTop: 3 }}>
                          от {c.from_nickname} · {new Date(c.created_at * 1000).toLocaleString("ru")}
                        </div>
                      </div>
                      <StatusBadge status={c.status} />
                    </div>
                    <div style={{ marginTop: 10, fontSize: 13, lineHeight: 1.45 }}>{c.reason}</div>
                    {c.status === "open" && (
                      <div className="row" style={{ marginTop: 12, justifyContent: "flex-end" }}>
                        <button className="btn btn--primary" onClick={() => resolve(c.id)} disabled={busy === c.id}>
                          {busy === c.id ? "…" : "Закрыть"}
                        </button>
                      </div>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>
              {complaints.length === 0 && (
                <div className="center muted" style={{ padding: 40 }}>Жалоб пока нет</div>
              )}
            </div>
          </motion.section>

          {/* Users & roles */}
          <motion.section className="panel lg" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.05 }}>
            <div className="panel__head">
              <div className="row">
                <IconGroups />
                <div className="h3">Пользователи</div>
                <span className="chip">{users.length}</span>
              </div>
              <div className="row" style={{ gap: 6 }}>
                <IconSearch size={14} className="muted" />
                <input
                  className="input"
                  style={{ width: 220 }}
                  placeholder="email, ник, id"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </div>
            </div>

            <div style={{
              display: "grid",
              gridTemplateColumns: "1fr 1.05fr",
              gap: 10,
              minHeight: 0, flex: 1,
            }}>
              <div className="panel__scroll scroll">
                {filtered.map((u) => (
                  <motion.button
                    key={u.id}
                    className="list-item"
                    onClick={() => setSelectedUser(u)}
                    whileHover={{ x: 1 }}
                    style={{
                      cursor: "pointer",
                      textAlign: "left",
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      borderColor: selectedUser?.id === u.id ? "color-mix(in srgb, var(--accent) 60%, transparent)" : "var(--glass-border)",
                      background: selectedUser?.id === u.id ? "var(--glass-fill-strong)" : undefined,
                    }}
                  >
                    <Avatar seed={u.id} name={u.nickname} size={40} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="h3" style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{u.nickname}</div>
                      <div className="subtle" style={{ fontSize: 11, marginTop: 3, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {u.email}
                      </div>
                    </div>
                    <span className={`role-badge role-${u.role}`}>{ROLE_LABELS[u.role]}</span>
                  </motion.button>
                ))}
                {filtered.length === 0 && (
                  <div className="center muted" style={{ padding: 40 }}>
                    {users.length === 0 ? "Нет данных" : "Ничего не найдено"}
                  </div>
                )}
              </div>

              <div className="panel__scroll scroll">
                {selectedUser ? (
                  <motion.div
                    key={selectedUser.id}
                    className="list-item"
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="row">
                      <Avatar seed={selectedUser.id} name={selectedUser.nickname} size={48} />
                      <div>
                        <div className="h2">{selectedUser.nickname}</div>
                        <div className="subtle" style={{ fontSize: 12 }}>
                          {selectedUser.email} · {selectedUser.balance} ₽
                        </div>
                      </div>
                    </div>

                    <div className="field__label" style={{ marginTop: 16, marginBottom: 6 }}>Текущая роль</div>
                    <span className={`role-badge role-${selectedUser.role}`}>{ROLE_LABELS[selectedUser.role]}</span>

                    <div className="field__label" style={{ marginTop: 18, marginBottom: 8 }}>Выдать роль</div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                      {ROLES.map((r) => (
                        <motion.button
                          key={r}
                          className={`btn ${selectedUser.role === r ? "btn--primary" : ""}`}
                          onClick={() => assign(r)}
                          disabled={busy === selectedUser.id || selectedUser.role === r}
                          whileTap={{ scale: 0.97 }}
                        >
                          {ROLE_LABELS[r]}
                        </motion.button>
                      ))}
                    </div>
                  </motion.div>
                ) : (
                  <div className="center muted" style={{ padding: 40 }}>Выберите пользователя слева</div>
                )}
              </div>
            </div>
          </motion.section>
        </div>
      </div>
    </>
  );
}
