import { motion } from "framer-motion";
import { useApp } from "../lib/store";
import { IconPlus } from "./Icons";

export function TopBar() {
  const { user, openTopUp } = useApp();
  return (
    <div className="row" style={{ gap: 8 }}>
      <div className="balance-pill">
        <span className="balance-pill__dot" />
        <motion.span
          key={user?.balance ?? 0}
          initial={{ y: -4, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.25 }}
          className="balance-pill__value"
        >
          {user?.balance ?? 0} ₽
        </motion.span>
      </div>
      <motion.button
        className="plus-btn"
        onClick={openTopUp}
        whileTap={{ scale: 0.9 }}
        aria-label="Пополнить баланс"
      >
        <IconPlus size={18} />
      </motion.button>
    </div>
  );
}
