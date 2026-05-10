import { motion } from "framer-motion";
import { useApp } from "../lib/store";
import { IconSparkle } from "../components/Icons";

export function Discover() {
  const { setRoute } = useApp();
  return (
    <motion.div
      className="pane lg center"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      style={{ padding: 40 }}
    >
      <div style={{ textAlign: "center", maxWidth: 380 }}>
        <div style={{
          width: 72, height: 72, borderRadius: 22,
          margin: "0 auto 18px",
          background: "linear-gradient(135deg, var(--accent), var(--accent-warm))",
          display: "grid", placeItems: "center",
          boxShadow: "0 18px 40px -14px color-mix(in srgb, var(--accent) 60%, transparent)",
        }}>
          <IconSparkle size={32} className="" />
        </div>
        <div className="h1">Скоро здесь</div>
        <div className="muted" style={{ fontSize: 14, marginTop: 8, lineHeight: 1.5 }}>
          Каналы, открытые комнаты, интересные люди.
          Сейчас сосредоточьтесь на чатах.
        </div>
        <button className="btn btn--primary" style={{ marginTop: 20 }} onClick={() => setRoute("chats")}>
          К чатам
        </button>
      </div>
    </motion.div>
  );
}
