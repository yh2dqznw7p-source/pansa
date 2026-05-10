import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { LiquidGlassFilter } from "./components/LiquidGlassFilter";
import { IconFlag, IconShield, IconUsers } from "./components/Icons";
import { api } from "./lib/api";
import { useApp } from "./lib/store";
import type { Complaint, Role, User } from "./types";

const ROLES: Role[] = ["user", "helper", "supporter", "creator", "admin", "owner", "title"];

const ROLE_LABELS: Record<Role, string> = {
  user: "User",
  helper: "Helper",
  supporter: "Supporter",
  creator: "Creator",
  admin: "Admin",
  owner: "Owner",
  title: "Title",
};

function StatusPill({ status }: { status: Complaint["status"] }) {
  const map: Record<Complaint["status"], { label: string; color: string }> = {
    open: { label: "Открыта", color: "var(--warning)" },
    inprogress: { label: "В работе", color: "var(--accent)" },
    resolved: { label: "Решена", color: "var(--success)" },
    rejected: { label: "Отклонена", color: "var(--fg-subtle)" },
  };
  const v = map[status];
  return (
    <span className="lg-chip" style={{ color: v.color, borderColor: `${v.color}55` }}>
      ● {v.label}
    </span>
  );
}

export default function SupportApp() {
  const { theme, setTheme } = useApp();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [query, setQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  async function refresh() {
    const [cs, us] = await Promise.all([api.listComplaints(), api.listUsers()]);
    setComplaints(cs.slice().reverse());
    setUsers(us);
    if (selectedUser) {
      const fresh = us.find((u) => u.id === selectedUser.id);
      if (fresh) setSelectedUser(fresh);
    }
  }

  useEffect(() => {
    refresh();
    const t = setInterval(refresh, 3500);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    // Theme is already applied by store on boot, but re-apply on this window.
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  const filteredUsers = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return users;
    return users.filter(
      (u) =>
        u.email.toLowerCase().includes(q) ||
        u.nickname.toLowerCase().includes(q) ||
        u.id.toLowerCase().includes(q)
    );
  }, [users, query]);

  async function resolve(id: string) {
    setBusy(id);
    try {
      await api.resolveComplaint(id);
      await refresh();
    } finally {
      setBusy(null);
    }
  }

  async function assign(role: Role) {
    if (!selectedUser) return;
    setBusy(selectedUser.id);
    try {
      const u = await api.assignRole(selectedUser.id, role);
      setSelectedUser(u);
      await refresh();
    } finally {
      setBusy(null);
    }
  }

  return (
    <>
      <div className="lg-ambient" />
      <LiquidGlassFilter />

      <div className="app-shell">
        <div className="topbar drag">
          <div className="topbar__left no-drag row">
            <span className="lg-chip">
              <IconShield size={14} /> Консоль поддержки
            </span>
            <span className="subtle" style={{ fontSize: 12 }}>
              127.0.0.1:5005
            </span>
          </div>
          <div className="topbar__right no-drag row">
            <div className="segmented">
              {(["light", "dark", "system"] as const).map((t) => (
                <button
                  key={t}
                  className={`segmented__item ${theme === t ? "segmented__item--active" : ""}`}
                  onClick={() => setTheme(t)}
                >
                  {t === "light" ? "Light" : t === "dark" ? "Dark" : "System"}
                </button>
              ))}
            </div>
            <span className="topbar__brand">OffMessenger · Support</span>
          </div>
        </div>

        <main className="main">
          <div className="support-grid">
            {/* Complaints */}
            <motion.section
              className="panel lg-surface lg-refract"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="panel__header">
                <div className="row">
                  <IconFlag />
                  <h3 className="h3">Жалобы</h3>
                  <span className="lg-chip">{complaints.length}</span>
                </div>
                <button className="lg-button" onClick={refresh}>
                  Обновить
                </button>
              </div>

              <div className="panel__scroll scroll">
                <AnimatePresence initial={false}>
                  {complaints.map((c) => (
                    <motion.div
                      key={c.id}
                      className="list-item"
                      layout
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ type: "spring", stiffness: 300, damping: 24 }}
                    >
                      <div className="row" style={{ justifyContent: "space-between" }}>
                        <div>
                          <div className="h3">{c.target}</div>
                          <div className="subtle" style={{ fontSize: 12 }}>
                            от {c.from_nickname} ·{" "}
                            {new Date(c.created_at * 1000).toLocaleString("ru")}
                          </div>
                        </div>
                        <StatusPill status={c.status} />
                      </div>
                      <div style={{ marginTop: 8 }}>{c.reason}</div>
                      {c.status === "open" && (
                        <div className="row" style={{ marginTop: 10, justifyContent: "flex-end" }}>
                          <button
                            className="lg-button lg-button--primary"
                            onClick={() => resolve(c.id)}
                            disabled={busy === c.id}
                          >
                            {busy === c.id ? "…" : "Закрыть"}
                          </button>
                        </div>
                      )}
                    </motion.div>
                  ))}
                </AnimatePresence>
                {complaints.length === 0 && (
                  <div className="center muted" style={{ height: 160 }}>
                    Жалоб пока нет
                  </div>
                )}
              </div>
            </motion.section>

            {/* Roles */}
            <motion.section
              className="panel lg-surface lg-refract"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.05 }}
            >
              <div className="panel__header">
                <div className="row">
                  <IconUsers />
                  <h3 className="h3">Пользователи и роли</h3>
                  <span className="lg-chip">{users.length}</span>
                </div>
                <input
                  className="lg-input"
                  style={{ width: 220 }}
                  placeholder="Поиск (email, ник, id)"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 12,
                  minHeight: 0,
                  flex: 1,
                }}
              >
                <div className="panel__scroll scroll" style={{ paddingRight: 4 }}>
                  <AnimatePresence initial={false}>
                    {filteredUsers.map((u) => (
                      <motion.button
                        key={u.id}
                        className="list-item"
                        layout
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setSelectedUser(u)}
                        style={{
                          cursor: "pointer",
                          textAlign: "left",
                          borderColor:
                            selectedUser?.id === u.id
                              ? "var(--accent)"
                              : "var(--stroke)",
                        }}
                      >
                        <div className="row" style={{ justifyContent: "space-between" }}>
                          <div>
                            <div className="h3">{u.nickname}</div>
                            <div className="subtle" style={{ fontSize: 12 }}>
                              {u.email}
                            </div>
                          </div>
                          <span className={`role-badge role-${u.role}`}>
                            {ROLE_LABELS[u.role]}
                          </span>
                        </div>
                      </motion.button>
                    ))}
                  </AnimatePresence>
                  {filteredUsers.length === 0 && (
                    <div className="center muted" style={{ height: 160 }}>
                      Нет пользователей
                    </div>
                  )}
                </div>

                <div className="panel__scroll scroll" style={{ paddingRight: 4 }}>
                  {selectedUser ? (
                    <motion.div
                      key={selectedUser.id}
                      className="list-item"
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <div className="h2">{selectedUser.nickname}</div>
                      <div className="subtle" style={{ fontSize: 12, marginBottom: 12 }}>
                        {selectedUser.email} · баланс {selectedUser.balance} ₽
                      </div>

                      <div className="label" style={{ marginBottom: 8 }}>
                        Текущая роль
                      </div>
                      <span className={`role-badge role-${selectedUser.role}`}>
                        {ROLE_LABELS[selectedUser.role]}
                      </span>

                      <div className="label" style={{ marginTop: 16, marginBottom: 8 }}>
                        Выдать роль
                      </div>
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "repeat(2, 1fr)",
                          gap: 8,
                        }}
                      >
                        {ROLES.map((r) => (
                          <motion.button
                            key={r}
                            className={`lg-button ${
                              selectedUser.role === r ? "lg-button--primary" : ""
                            }`}
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
                    <div className="center muted" style={{ height: "100%" }}>
                      Выберите пользователя слева
                    </div>
                  )}
                </div>
              </div>
            </motion.section>
          </div>
        </main>
      </div>
    </>
  );
}
