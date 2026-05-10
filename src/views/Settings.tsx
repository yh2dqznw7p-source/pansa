import { motion } from "framer-motion";
import { api } from "../lib/api";
import { useApp, type Theme } from "../lib/store";

function Toggle({ checked, onToggle }: { checked: boolean; onToggle: () => void }) {
  return <button className="toggle" role="switch" aria-checked={checked} onClick={onToggle}><span className="toggle__thumb" /></button>;
}

export function Settings() {
  const s = useApp();
  const themes: { value: Theme; label: string }[] = [
    { value: "light", label: "Светлая" },
    { value: "dark", label: "Тёмная" },
    { value: "system", label: "Системная" },
  ];

  return (
    <motion.div className="settings" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}>
      <div className="settings__content">
        <h1 className="h1">Настройки</h1>
        <div className="lg-surface lg-refract card">
          <h3 className="card__title">Профиль</h3>
          <div className="row-between"><span className="muted">Никнейм</span><span>{s.user?.nickname ?? "—"}</span></div>
          <div className="row-between"><span className="muted">Почта</span><span>{s.user?.email ?? "—"}</span></div>
          <div className="row-between"><span className="muted">Роль</span><span className={`role-badge role-${s.user?.role ?? "user"}`}>{s.user?.role ?? "user"}</span></div>
        </div>
        <div className="lg-surface lg-refract card">
          <h3 className="card__title">Тема</h3>
          <div className="row"><div className="segmented">{themes.map((t) => (<button key={t.value} className={`segmented__item ${s.theme === t.value ? "segmented__item--active" : ""}`} onClick={() => s.setTheme(t.value)}>{t.label}</button>))}</div></div>
        </div>
        <div className="lg-surface lg-refract card">
          <h3 className="card__title">Уведомления</h3>
          <div className="row-between"><div><div>Показывать уведомления</div><div className="subtle" style={{ fontSize: 12, marginTop: 2 }}>Новые сообщения и упоминания</div></div><Toggle checked={s.notifications} onToggle={() => s.toggle("notifications")} /></div>
          <div className="row-between"><div>Звуки уведомлений</div><Toggle checked={s.sounds} onToggle={() => s.toggle("sounds")} /></div>
        </div>
        <div className="lg-surface lg-refract card">
          <h3 className="card__title">Конфиденциальность</h3>
          <div className="row-between"><div><div>Отчёты о прочтении</div><div className="subtle" style={{ fontSize: 12, marginTop: 2 }}>Собеседник видит, что вы прочли сообщение</div></div><Toggle checked={s.readReceipts} onToggle={() => s.toggle("readReceipts")} /></div>
          <div className="row-between"><div>Показывать время последнего визита</div><Toggle checked={s.lastSeen} onToggle={() => s.toggle("lastSeen")} /></div>
        </div>
        <div className="lg-surface lg-refract card">
          <h3 className="card__title">Управление чатами</h3>
          <div className="row-between"><div><div>Компактный режим</div><div className="subtle" style={{ fontSize: 12, marginTop: 2 }}>Меньше отступов, больше сообщений на экране</div></div><Toggle checked={s.compactChats} onToggle={() => s.toggle("compactChats")} /></div>
          <div className="row-between"><div>Поддержка</div><button className="lg-button" onClick={() => api.openSupport()}>Открыть консоль поддержки</button></div>
        </div>
      </div>
      <div className="settings__footer">
        <motion.button className="lg-button lg-button--danger settings__logout" whileTap={{ scale: 0.99 }} onClick={s.logout}>Выйти из аккаунта</motion.button>
      </div>
    </motion.div>
  );
}
