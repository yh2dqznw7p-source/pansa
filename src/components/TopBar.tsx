import { motion } from "framer-motion";
import { useApp } from "../lib/store";
import { IconPlus } from "./Icons";

export function TopBar() {
  const { user, openTopUp } = useApp();
  return (
    <div className="topbar drag">
      <div className="topbar__left no-drag">
        <div className="balance">
          <span className="balance__dot" />
          <motion.span
            key={user?.balance ?? 0}
            initial={{ y: -6, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.25 }}
            className="balance__value"
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

      <div className="topbar__right no-drag">
        <span className="topbar__brand">OffMessenger</span>
      </div>
    </div>
  );
}
