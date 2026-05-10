import { motion } from "framer-motion";
import { useApp } from "../lib/store";

export function Home() {
  const { user, openTopUp, setRoute } = useApp();
  return (
    <motion.div
      className="scroll"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      style={{ padding: 32, display: "flex", flexDirection: "column", gap: 24 }}
    >
      <div className="lg-surface lg-refract card">
        <h2 className="h1">Привет, {user?.nickname || "друг"} 👋</h2>
        <p className="muted" style={{ marginTop: 8 }}>
          Это ваш домашний экран. Баланс, уведомления, быстрый доступ к чатам.
        </p>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 16,
        }}
      >
        <motion.div
          className="lg-surface lg-refract card"
          whileHover={{ y: -2 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
        >
          <div className="label">Баланс</div>
          <div className="h1" style={{ marginTop: 8 }}>{user?.balance ?? 0} ₽</div>
          <button className="lg-button lg-button--primary" style={{ marginTop: 16 }} onClick={openTopUp}>
            Пополнить
          </button>
        </motion.div>

        <motion.div
          className="lg-surface lg-refract card"
          whileHover={{ y: -2 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
        >
          <div className="label">Чаты</div>
          <div className="h2" style={{ marginTop: 8 }}>Открыть список</div>
          <button className="lg-button" style={{ marginTop: 16 }} onClick={() => setRoute("chats")}>
            Перейти
          </button>
        </motion.div>

        <motion.div
          className="lg-surface lg-refract card"
          whileHover={{ y: -2 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
        >
          <div className="label">Настройки</div>
          <div className="h2" style={{ marginTop: 8 }}>Темы, приватность, уведомления</div>
          <button className="lg-button" style={{ marginTop: 16 }} onClick={() => setRoute("settings")}>
            Открыть
          </button>
        </motion.div>
      </div>
    </motion.div>
  );
}
