import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { api } from "../lib/api";
import { useApp, type Theme } from "../lib/store";
import { Avatar } from "../components/Avatar";
import { IconBell, IconLock, IconLogout, IconPalette, IconSparkle, IconUser } from "../components/Icons";

function Toggle({ checked, onToggle }: { checked: boolean; onToggle: () => void }) {
  return (
    <button className="toggle" role="switch" aria-checked={checked} onClick={onToggle}>
      <span className="toggle__thumb" />
    </button>
  );
}

type SaveState = "idle" | "busy" | "ok" | "err";

function useSave() {
  const [state, setState] = useState<SaveState>("idle");
  const [msg, setMsg] = useState("");
  async function run<T>(fn: () => Promise<T>): Promise<T | null> {
    setState("busy"); setMsg("");
    try {
      const v = await fn();
      setState("ok"); setMsg("сохранено");
      setTimeout(() => setState("idle"), 1500);
      return v;
    } catch (e: any) {
      setState("err"); setMsg(e?.message ?? "ошибка");
      return null;
    }
  }
  return { state, msg, run };
}

function ProfileCard() {
  const { user, setUser } = useApp();
  const [nick, setNick] = useState(user?.nickname ?? "");
  const [uname, setUname] = useState(user?.username ?? "");
  const [desc, setDesc] = useState(user?.description ?? "");
  const nickSave = useSave();
  const unameSave = useSave();
  const descSave = useSave();
  const avSave = useSave();
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => { setNick(user?.nickname ?? ""); }, [user?.nickname]);
  useEffect(() => { setUname(user?.username ?? ""); }, [user?.username]);
  useEffect(() => { setDesc(user?.description ?? ""); }, [user?.description]);

  async function uploadAvatar(file: File) {
    if (!file) return;
    const MAX = 1_400_000; // ~1.4 MB source
    if (file.size > MAX) {
      avSave.run(async () => { throw new Error("файл слишком большой (макс 1.4 MB)"); });
      return;
    }
    const dataUrl: string = await new Promise((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve(String(r.result));
      r.onerror = () => reject(new Error("не удалось прочитать файл"));
      r.readAsDataURL(file);
    });
    const u = await avSave.run(() => api.setAvatar(dataUrl));
    if (u) setUser(u);
  }

  return (
    <div className="lg--strong card settings-card">
      <div className="row settings-card__title-row">
        <IconUser size={18} className="muted" />
        <h3 className="card__title">Профиль</h3>
      </div>

      <div className="row" style={{ gap: 16, alignItems: "center" }}>
        <Avatar
          seed={user?.id ?? ""}
          name={user?.nickname ?? ""}
          src={user?.avatar_url || undefined}
          size={72}
        />
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <button className="btn" onClick={() => fileRef.current?.click()}>
            Загрузить аватар
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            style={{ display: "none" }}
            onChange={(e) => e.target.files?.[0] && uploadAvatar(e.target.files[0])}
          />
          {avSave.state === "err" && <span className="hint-error">{avSave.msg}</span>}
          {avSave.state === "ok" && <span className="muted" style={{ fontSize: 12 }}>✓ сохранено</span>}
          <span className="subtle" style={{ fontSize: 11 }}>
            PNG / JPEG / WebP, до ~1.4 MB
          </span>
        </div>
      </div>

      <div className="settings-field">
        <label className="field__label">Никнейм</label>
        <div className="row" style={{ gap: 8 }}>
          <input className="input" value={nick} onChange={(e) => setNick(e.target.value)} maxLength={32} />
          <button
            className="btn btn--primary"
            onClick={async () => {
              const n = nick.trim();
              if (n.length < 2) return;
              const u = await nickSave.run(() => api.setNickname(n));
              if (u) setUser(u);
            }}
            disabled={nickSave.state === "busy" || nick.trim() === (user?.nickname ?? "")}
          >
            Сохранить
          </button>
        </div>
        {nickSave.state === "err" && <div className="hint-error">{nickSave.msg}</div>}
      </div>

      <div className="settings-field">
        <label className="field__label">Юзернейм</label>
        <div className="row" style={{ gap: 8 }}>
          <span className="subtle" style={{ fontSize: 14 }}>@</span>
          <input
            className="input"
            value={uname}
            onChange={(e) => setUname(e.target.value.replace(/\s+/g, ""))}
            maxLength={32}
            spellCheck={false}
          />
          <button
            className="btn btn--primary"
            onClick={async () => {
              const v = uname.trim().replace(/^@/, "");
              if (v.length < 3) return;
              if (!/^[a-zA-Z0-9_]+$/.test(v)) {
                unameSave.run(async () => { throw new Error("только a-z, 0-9, _"); });
                return;
              }
              const u = await unameSave.run(() => api.setUsername(v));
              if (u) setUser(u);
            }}
            disabled={unameSave.state === "busy" || uname === (user?.username ?? "")}
          >
            Сохранить
          </button>
        </div>
        <div className="subtle" style={{ fontSize: 11, marginTop: 6 }}>
          По юзернейму вас смогут найти и написать. 3–32 символа: латиница, цифры, <code>_</code>.
        </div>
        {unameSave.state === "err" && <div className="hint-error">{unameSave.msg}</div>}
      </div>

      <div className="settings-field">
        <label className="field__label">
          О себе <span className="subtle" style={{ fontWeight: 400 }}>· до 100 символов</span>
        </label>
        <textarea
          className="input"
          value={desc}
          onChange={(e) => setDesc(e.target.value.slice(0, 100))}
          maxLength={100}
          rows={2}
          style={{ resize: "vertical", minHeight: 54 }}
        />
        <div className="row" style={{ justifyContent: "space-between" }}>
          <span className="subtle" style={{ fontSize: 11 }}>{desc.length}/100</span>
          <button
            className="btn btn--primary"
            onClick={async () => {
              const u = await descSave.run(() => api.setDescription(desc.trim()));
              if (u) setUser(u);
            }}
            disabled={descSave.state === "busy" || desc === (user?.description ?? "")}
          >
            Сохранить
          </button>
        </div>
        {descSave.state === "err" && <div className="hint-error">{descSave.msg}</div>}
      </div>
    </div>
  );
}

export function Settings() {
  const s = useApp();
  const themes: { value: Theme; label: string }[] = [
    { value: "dark", label: "Тёмная" },
    { value: "light", label: "Светлая" },
    { value: "system", label: "Системная" },
  ];

  return (
    <div className="pane lg settings">
      <div className="settings__scroll">
        <div className="pane__head" style={{ padding: 0 }}>
          <div className="pane__title">Настройки</div>
        </div>

        <ProfileCard />

        {/* --- Appearance --- */}
        <div className="lg--strong card settings-card">
          <div className="row settings-card__title-row">
            <IconPalette size={18} className="muted" />
            <h3 className="card__title">Внешний вид</h3>
          </div>
          <div className="row-between">
            <div>
              <div className="row-title">Тема</div>
              <div className="subtle" style={{ fontSize: 12, marginTop: 2 }}>Пространство интерфейса</div>
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
          <div className="row-between">
            <div>
              <div className="row-title">Фоновые частицы</div>
              <div className="subtle" style={{ fontSize: 12, marginTop: 2 }}>Звёздочки, падающие с верха</div>
            </div>
            <Toggle checked={s.particles} onToggle={() => s.toggle("particles")} />
          </div>
          <div className="row-between">
            <div>
              <div className="row-title">Компактный режим чатов</div>
              <div className="subtle" style={{ fontSize: 12, marginTop: 2 }}>Меньше отступов в ленте сообщений</div>
            </div>
            <Toggle checked={s.compactChats} onToggle={() => s.toggle("compactChats")} />
          </div>
        </div>

        {/* --- Notifications --- */}
        <div className="lg--strong card settings-card">
          <div className="row settings-card__title-row">
            <IconBell size={18} className="muted" />
            <h3 className="card__title">Уведомления</h3>
          </div>
          <div className="row-between">
            <div>
              <div className="row-title">Показывать уведомления</div>
              <div className="subtle" style={{ fontSize: 12, marginTop: 2 }}>Сообщения и упоминания</div>
            </div>
            <Toggle checked={s.notifications} onToggle={() => s.toggle("notifications")} />
          </div>
          <div className="row-between">
            <div>
              <div className="row-title">Звуки</div>
            </div>
            <Toggle checked={s.sounds} onToggle={() => s.toggle("sounds")} />
          </div>
        </div>

        {/* --- Privacy --- */}
        <div className="lg--strong card settings-card">
          <div className="row settings-card__title-row">
            <IconLock size={18} className="muted" />
            <h3 className="card__title">Конфиденциальность</h3>
          </div>
          <div className="row-between">
            <div>
              <div className="row-title">Отчёты о прочтении</div>
              <div className="subtle" style={{ fontSize: 12, marginTop: 2 }}>Собеседник видит, что вы прочли</div>
            </div>
            <Toggle checked={s.readReceipts} onToggle={() => s.toggle("readReceipts")} />
          </div>
          <div className="row-between">
            <div>
              <div className="row-title">Время последнего визита</div>
            </div>
            <Toggle checked={s.lastSeen} onToggle={() => s.toggle("lastSeen")} />
          </div>
          <div className="row-between">
            <div>
              <div className="row-title">Разрешить добавлять в группы</div>
              <div className="subtle" style={{ fontSize: 12, marginTop: 2 }}>Другие пользователи могут звать вас в группы</div>
            </div>
            <Toggle checked={s.allowGroupInvites} onToggle={() => s.toggle("allowGroupInvites")} />
          </div>
          <div className="row-between">
            <div>
              <div className="row-title">Разрешить добавлять в каналы</div>
              <div className="subtle" style={{ fontSize: 12, marginTop: 2 }}>Другие пользователи могут добавлять вас в каналы</div>
            </div>
            <Toggle checked={s.allowChannelInvites} onToggle={() => s.toggle("allowChannelInvites")} />
          </div>
        </div>

        {/* --- About --- */}
        <div className="lg--strong card settings-card">
          <div className="row settings-card__title-row">
            <IconSparkle size={18} className="muted" />
            <h3 className="card__title">О приложении</h3>
          </div>
          <div className="row-between">
            <div className="muted">Версия</div>
            <div>OffMessenger 0.1.0</div>
          </div>
          {s.user && (
            <>
              <div className="row-between">
                <div className="muted">ID</div>
                <div style={{ fontFamily: "monospace", fontSize: 12 }}>{s.user.id.slice(0, 8)}…</div>
              </div>
              <div className="row-between">
                <div className="muted">Роль</div>
                <div>{s.user.role}</div>
              </div>
            </>
          )}
        </div>

        {/* --- Logout at the bottom of scroll --- */}
        <motion.button
          className="btn settings__logout"
          whileTap={{ scale: 0.99 }}
          onClick={s.logout}
          style={{ marginTop: 8 }}
        >
          <IconLogout size={16} /> Выйти из аккаунта
        </motion.button>
      </div>
    </div>
  );
}
