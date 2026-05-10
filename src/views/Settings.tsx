import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { api, getServerUrl, setServerUrl } from "../lib/api";
import { useApp, type Theme } from "../lib/store";
import { Avatar } from "../components/Avatar";
import { IconBell, IconLock, IconLogout, IconPalette, IconServer, IconShield, IconSparkle } from "../components/Icons";

function Toggle({ checked, onToggle }: { checked: boolean; onToggle: () => void }) {
  return (
    <button className="toggle" role="switch" aria-checked={checked} onClick={onToggle}>
      <span className="toggle__thumb" />
    </button>
  );
}

type UsernameState = "idle" | "busy" | "ok" | "taken" | "invalid";

function UsernameField() {
  const { user, setUser } = useApp();
  const [value, setValue] = useState(user?.username ?? "");
  const [state, setState] = useState<UsernameState>("idle");
  const [msg, setMsg] = useState<string>("");

  useEffect(() => {
    setValue(user?.username ?? "");
  }, [user?.username]);

  function validate(v: string): string | null {
    if (v.length < 3 || v.length > 32) return "длина 3..32 символа";
    if (!/^[a-zA-Z0-9_]+$/.test(v)) return "только латиница, цифры и _";
    return null;
  }

  async function save() {
    const v = value.trim().replace(/^@/, "");
    const problem = validate(v);
    if (problem) { setState("invalid"); setMsg(problem); return; }
    setState("busy"); setMsg("");
    try {
      const u = await api.setUsername(v);
      setUser(u);
      setState("ok");
      setMsg("сохранено");
    } catch (e: any) {
      const m = (e?.message ?? "").toLowerCase();
      if (m.includes("taken") || m.includes("conflict")) {
        setState("taken"); setMsg("уже занят");
      } else {
        setState("invalid"); setMsg(e?.message ?? "ошибка");
      }
    }
  }

  const pillClass = state === "ok" ? "username-state--ok"
                  : state === "busy" ? "username-state--busy"
                  : (state === "taken" || state === "invalid") ? "username-state--taken"
                  : "";

  return (
    <>
      <div className="row" style={{ gap: 10 }}>
        <span className="subtle" style={{ fontSize: 14, padding: "0 4px 0 8px" }}>@</span>
        <input
          className="input"
          value={value}
          onChange={(e) => { setValue(e.target.value.replace(/\s+/g, "")); setState("idle"); setMsg(""); }}
          placeholder="username"
          spellCheck={false}
          style={{ paddingLeft: 6 }}
        />
        <button className="btn btn--primary" onClick={save} disabled={state === "busy"}>
          {state === "busy" ? "…" : "Сохранить"}
        </button>
      </div>
      {state !== "idle" && (
        <div className={`username-state ${pillClass}`} style={{ marginTop: 8 }}>
          {state === "ok" && "✓"}{state === "taken" && "✗"}{state === "invalid" && "✗"}{state === "busy" && "…"} {msg}
        </div>
      )}
      <div className="subtle" style={{ fontSize: 12, marginTop: 10, lineHeight: 1.45 }}>
        Юзернейм — уникальное имя для поиска. По нему вас смогут найти и написать.
        Разрешены латинские буквы, цифры и <code>_</code>.
      </div>
    </>
  );
}

export function Settings() {
  const s = useApp();
  const themes: { value: Theme; label: string }[] = [
    { value: "dark", label: "Тёмная" },
    { value: "light", label: "Светлая" },
    { value: "system", label: "Системная" },
  ];

  const [server, setServer] = useState(getServerUrl());
  const [ping, setPing] = useState<"idle" | "ok" | "fail" | "busy">("idle");
  const [pingMsg, setPingMsg] = useState("");

  useEffect(() => { setServer(getServerUrl()); }, []);

  async function testConnection() {
    setPing("busy"); setPingMsg("");
    try {
      setServerUrl(server);
      const r = await api.ping();
      setPing("ok");
      setPingMsg(`${r.service} v${r.version}`);
    } catch (e: any) {
      setPing("fail");
      setPingMsg(e?.message ?? "недоступен");
    }
  }

  async function openSupport() {
    try {
      const hasTauri = typeof window !== "undefined" && !!(window as any).__TAURI_INTERNALS__;
      if (hasTauri) {
        const { invoke } = await import("@tauri-apps/api/core");
        await invoke("open_support");
      } else {
        alert("Запустите отдельное приложение OffMessenger Support");
      }
    } catch (e: any) {
      alert(e?.message ?? "Не удалось открыть Support");
    }
  }

  return (
    <div className="pane lg settings">
      <div className="settings__scroll">
        <div className="pane__head" style={{ padding: 0 }}>
          <div className="pane__title pane__title--brand">Настройки</div>
        </div>

        {s.user && (
          <div className="lg--strong card" style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <Avatar seed={s.user.id} name={s.user.nickname} size={64} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="h2">{s.user.nickname}</div>
              <div className="muted" style={{ fontSize: 13, marginTop: 2 }}>
                {s.user.username ? `@${s.user.username}` : s.user.email}
              </div>
            </div>
            <span className={`role-badge role-${s.user.role}`}>{s.user.role}</span>
          </div>
        )}

        {/* Username */}
        <div className="lg--strong card">
          <div className="row" style={{ marginBottom: 10 }}>
            <IconSparkle size={18} className="muted" />
            <h3 className="card__title" style={{ margin: 0 }}>Юзернейм</h3>
          </div>
          <UsernameField />
        </div>

        {/* Server */}
        <div className="lg--strong card">
          <div className="row" style={{ marginBottom: 10 }}>
            <IconServer size={18} className="muted" />
            <h3 className="card__title" style={{ margin: 0 }}>Сервер</h3>
          </div>
          <div className="subtle" style={{ fontSize: 12, marginBottom: 12 }}>
            Локально: <code>http://127.0.0.1:5005</code>. На проде: <code>https://api.ваш-домен</code>.
          </div>
          <div className="row" style={{ gap: 8 }}>
            <input className="input" value={server} onChange={(e) => setServer(e.target.value)} placeholder="http://127.0.0.1:5005" spellCheck={false} />
            <button className="btn btn--primary" onClick={testConnection} disabled={ping === "busy"}>
              {ping === "busy" ? "…" : "Проверить"}
            </button>
          </div>
          {ping === "ok" && <div style={{ color: "var(--success)", marginTop: 10, fontSize: 13 }}>✓ {pingMsg}</div>}
          {ping === "fail" && <div className="hint-error" style={{ marginTop: 10 }}>✗ {pingMsg}</div>}
        </div>

        {/* Theme */}
        <div className="lg--strong card">
          <div className="row" style={{ marginBottom: 10 }}>
            <IconPalette size={18} className="muted" />
            <h3 className="card__title" style={{ margin: 0 }}>Тема</h3>
          </div>
          <div className="segmented">
            {themes.map((t) => (
              <button
                key={t.value}
                className={`segmented__item ${s.theme === t.value ? "segmented__item--active" : ""}`}
                onClick={() => s.setTheme(t.value)}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Notifications */}
        <div className="lg--strong card">
          <div className="row" style={{ marginBottom: 10 }}>
            <IconBell size={18} className="muted" />
            <h3 className="card__title" style={{ margin: 0 }}>Уведомления</h3>
          </div>
          <div className="row-between">
            <div>
              <div style={{ fontWeight: 500 }}>Показывать уведомления</div>
              <div className="subtle" style={{ fontSize: 12, marginTop: 2 }}>Новые сообщения и упоминания</div>
            </div>
            <Toggle checked={s.notifications} onToggle={() => s.toggle("notifications")} />
          </div>
          <div className="row-between">
            <div style={{ fontWeight: 500 }}>Звуки уведомлений</div>
            <Toggle checked={s.sounds} onToggle={() => s.toggle("sounds")} />
          </div>
        </div>

        {/* Privacy */}
        <div className="lg--strong card">
          <div className="row" style={{ marginBottom: 10 }}>
            <IconLock size={18} className="muted" />
            <h3 className="card__title" style={{ margin: 0 }}>Конфиденциальность</h3>
          </div>
          <div className="row-between">
            <div>
              <div style={{ fontWeight: 500 }}>Отчёты о прочтении</div>
              <div className="subtle" style={{ fontSize: 12, marginTop: 2 }}>Собеседник видит, что вы прочли</div>
            </div>
            <Toggle checked={s.readReceipts} onToggle={() => s.toggle("readReceipts")} />
          </div>
          <div className="row-between">
            <div style={{ fontWeight: 500 }}>Время последнего визита</div>
            <Toggle checked={s.lastSeen} onToggle={() => s.toggle("lastSeen")} />
          </div>
        </div>

        {/* Chats */}
        <div className="lg--strong card">
          <h3 className="card__title">Чаты</h3>
          <div className="row-between">
            <div>
              <div style={{ fontWeight: 500 }}>Компактный режим</div>
              <div className="subtle" style={{ fontSize: 12, marginTop: 2 }}>Меньше отступов, больше сообщений на экране</div>
            </div>
            <Toggle checked={s.compactChats} onToggle={() => s.toggle("compactChats")} />
          </div>
        </div>

        {/* Support launcher */}
        <div className="lg--strong card">
          <div className="row" style={{ marginBottom: 10 }}>
            <IconShield size={18} className="muted" />
            <h3 className="card__title" style={{ margin: 0 }}>Поддержка</h3>
          </div>
          <div className="row-between">
            <div>
              <div style={{ fontWeight: 500 }}>Консоль модератора</div>
              <div className="subtle" style={{ fontSize: 12, marginTop: 2 }}>Откроется отдельное приложение OffMessenger Support</div>
            </div>
            <button className="btn" onClick={openSupport}>Открыть</button>
          </div>
        </div>
      </div>

      <div className="settings__footer">
        <motion.button className="btn btn--danger settings__logout" whileTap={{ scale: 0.99 }} onClick={s.logout}>
          <IconLogout size={16} /> Выйти из аккаунта
        </motion.button>
      </div>
    </div>
  );
}
