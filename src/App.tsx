import { motion } from "framer-motion";
import { useEffect } from "react";
import { Ambient } from "./components/Ambient";
import { IconPlus } from "./components/Icons";
import { LiquidGlassFilter } from "./components/LiquidGlassFilter";
import { Rail } from "./components/Rail";
import { TopUpSheet } from "./components/TopUpSheet";
import { useApp } from "./lib/store";
import { ChatList } from "./views/ChatList";
import { Conversation } from "./views/Conversation";
import { Login } from "./views/Login";
import { Register } from "./views/Register";
import { Search } from "./views/Search";
import { Settings } from "./views/Settings";

function TopBar() {
  const { user, openTopUp } = useApp();
  return (
    <header className="topbar drag">
      <div className="topbar__brand">
        <div className="topbar__logo">O</div>
        <div className="topbar__name">OffMessenger</div>
      </div>
      <div className="topbar__right no-drag">
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
          title="Пополнить"
        >
          <IconPlus size={18} />
        </motion.button>
      </div>
    </header>
  );
}

export default function App() {
  const { user, route, refreshUser } = useApp();
  useEffect(() => { refreshUser(); }, [refreshUser]);

  if (!user) {
    return (
      <>
        <Ambient />
        <LiquidGlassFilter />
        {route === "register" ? <Register /> : <Login />}
      </>
    );
  }

  // In "chats" we show the middle list. Other routes fill the right area.
  const showList = route === "chats";

  return (
    <>
      <Ambient />
      <LiquidGlassFilter />
      <TopUpSheet />

      <div className="shell">
        <TopBar />

        <div className="shell__body">
          <Rail />

          {showList && <ChatList />}

          <motion.div
            key={route}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            style={{
              minWidth: 0,
              minHeight: 0,
              gridColumn: showList ? "auto" : "2 / span 2",
            }}
          >
            {route === "chats" && <Conversation />}
            {route === "search" && <Search />}
            {route === "settings" && <Settings />}
          </motion.div>
        </div>
      </div>
    </>
  );
}
