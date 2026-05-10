import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { Avatar } from "../components/Avatar";
import { IconFlag, IconGroups, IconShield } from "../components/Icons";
import { api } from "../lib/api";
import type { Complaint, Role, User } from "../types";

const ROLES: Role[] = ["user", "helper", "supporter", "creator", "admin", "owner", "title"];
const ROLE_LABELS: Record<Role, string> = {
  user: "User", helper: "Helper", supporter: "Supporter", creator: "Creator",
  admin: "Admin", owner: "Owner", title: "Title",
};

function StatusBadge({ status }: { status: Complaint["status"] }) {
  const map: Record<string, string> = {
    open: "Открыта",
    inprogress: "В работе",
    resolved: "Решена",
    rejected: "Отклонена",
  };
  return <span className="chip">{map[status] ?? status}</span>;
}

export default function SupportApp() {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [query, setQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);

  async function refresh() {
    try {
      const [cs, us] = await Promise.all([api.listComplaints(), api.listUsers()]);
      setComplaints(cs.slice().reverse());
      setUsers(us);
      setAuthError(null);
      if (selectedUser) {
        const fresh = us.find((u) => u.id === selectedUser.id);
        if (fresh) setSelectedUser(fresh);
      }
    } catch (e: any) {
      const m = String(e?.message ?? "");
      if (m.includes("missing token") || m.includes("invalid token")) {
        setAuthError("Нет токена. Войдите в основном OffMessenger под учёткой staff/admin, затем перезапустите Support.");
      } else if (m.toLowerCase().includes("staff only")) {
        setAuthError("У этой учётки нет прав staff. Попросите owner/admin выдать роль.");
      } else {
        setAuthError(m || "Не удалось загрузить данные с сервера.");
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
        (u.username ?? "").toLowerCase().includes(q) ||
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

  return (
    <>
      <div className="lg-ambient" aria-hidden>
        <div className="lg-ambient__grid" />
        <div className="lg-ambient__noise" />
      </div>

      <div className="support-shell drag">
        <div className="support-head lg">
          <div className="row" style={{ gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 12,
              background: "radial-gradient(65% 65% at 30% 30%, #f5f5f5 0%, #9a9a9a 55%, #1a1a1a 100%)",
              display: "grid", placeItems: "center" }}>
              <IconShield size={18} />
            </div>
            <div>
              <div className="h3">OffMessenger · Support</div>
              <div className="subtle" style={{ fontSize: 11 }}>модерация · роли · жалобы</div>
            </div>
          </div>
          <div style={{ marginLeft: "auto" }}>
            <button className="btn no-drag" onClick={refresh}>Обновить</button>
          </div>
        </div>

        {authError && (
          <div className="lg card no-drag" style={{ padding: 16 }}>
            <div className="hint-error">{authError}</div>
          </div>
        )}

        <div className="support-grid">
          <motion.section className="panel lg" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
            <div className="panel__head">
              <div className="row"><IconFlag /><div className="h3">Жалобы</div><span className="chip">{complaints.length}</span></div>
            </div>
            <div className="panel__scroll scroll">
              <AnimatePresence initial={false}>
                {complaints.map((c) => (
                  <motion.div key={c.id} className="list-item" layout
                    initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
                  >
                    <div className="row" style={{ justifyContent: "space-between" }}>
                      <div style={{ minWidth: 0 }}>
                        <div className="h3">{c.target}</div>
                        <div className="subtle" style={{ fontSize: 11, marginTop: 3 }}>
                          от {c.from_nickname} · {new Date(c.created_at * 1000).toLocaleString("ru")}
                        </div>
                      </div>
                      <StatusBadge status={c.status} />
                    </div>
                    <div style={{ marginTop: 10, fontSize: 13 }}>{c.reason}</div>
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
              {complaints.length === 0 && !authError && (
                <div className="center muted" style={{ padding: 40 }}>Жалоб пока нет</div>
              )}
            </div>
          </motion.section>

          <motion.section className="panel lg" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
            <div className="panel__head">
              <div className="row"><IconGroups /><div className="h3">Пользователи</div><span className="chip">{users.length}</span></div>
              <input
                className="input no-drag"
                style={{ width: 240 }}
                placeholder="Поиск: юзернейм, ник, email"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1.05fr", gap: 10, minHeight: 0, flex: 1 }}>
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
                      borderColor: selectedUser?.id === u.id ? "var(--glass-border-strong)" : "var(--glass-border)",
                      background: selectedUser?.id === u.id ? "var(--glass-fill-strong)" : undefined,
                    }}
                  >
                    <Avatar seed={u.id} name={u.nickname} src={u.avatar_url || undefined} size={40} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="h3" style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {u.nickname}
                      </div>
                      <div className="subtle" style={{ fontSize: 11, marginTop: 3 }}>
                        {u.username ? `@${u.username}` : u.email}
                      </div>
                    </div>
                    <span className="role-badge">{ROLE_LABELS[u.role]}</span>
                  </motion.button>
                ))}
                {filtered.length === 0 && !authError && (
                  <div className="center muted" style={{ padding: 40 }}>
                    {users.length === 0 ? "Пока нет зарегистрированных пользователей" : "Ничего не найдено"}
                  </div>
                )}
              </div>

              <div className="panel__scroll scroll">
                {selectedUser ? (
                  <motion.div key={selectedUser.id} className="list-item"
                    initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                  >
                    <div className="row">
                      <Avatar seed={selectedUser.id} name={selectedUser.nickname} src={selectedUser.avatar_url || undefined} size={48} />
                      <div>
                        <div className="h2">{selectedUser.nickname}</div>
                        <div className="subtle" style={{ fontSize: 12 }}>
                          {selectedUser.username ? `@${selectedUser.username}` : selectedUser.email}
                          {" · "}{selectedUser.balance} ₽
                        </div>
                      </div>
                    </div>

                    {selectedUser.description && (
                      <div className="muted" style={{ marginTop: 12, fontSize: 13 }}>
                        {selectedUser.description}
                      </div>
                    )}

                    <div className="field__label" style={{ marginTop: 16, marginBottom: 6 }}>Текущая роль</div>
                    <span className="role-badge">{ROLE_LABELS[selectedUser.role]}</span>

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
