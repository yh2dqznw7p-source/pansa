import { AnimatePresence, motion } from "framer-motion";
import { useEffect } from "react";
import { Ambient } from "./components/Ambient";
import { LiquidGlassFilter } from "./components/LiquidGlassFilter";
import { Rail } from "./components/Rail";
import { TopUpSheet } from "./components/TopUpSheet";
import { useApp } from "./lib/store";
import { ChatList } from "./views/ChatList";
import { Conversation } from "./views/Conversation";
import { Discover } from "./views/Discover";
import { Login } from "./views/Login";
import { Register } from "./views/Register";
import { Settings } from "./views/Settings";

export default function App() {
  const { user, route, refreshUser } = useApp();
  useEffect(() => { refreshUser(); }, [refreshUser]);

  if (!user) {
    return (
      <>
        <Ambient />
        <LiquidGlassFilter />
        <AnimatePresence mode="wait">
          {route === "register" ? <Register key="register" /> : <Login key="login" />}
        </AnimatePresence>
      </>
    );
  }

  return (
    <>
      <Ambient />
      <LiquidGlassFilter />
      <TopUpSheet />

      <div className="shell drag">
        <Rail />

        {/* Middle pane — chat list (only in chats route) or fills the right too */}
        {route === "chats" && <ChatList />}
        {route === "settings" && <div style={{ display: "none" }} />}
        {route === "discover" && <div style={{ display: "none" }} />}

        {/* Right pane */}
        <motion.div
          key={route}
          initial={{ opacity: 0, y: 8, scale: 0.995 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          style={{
            minWidth: 0,
            minHeight: 0,
            gridColumn: route === "chats" ? "auto" : "2 / span 2",
          }}
        >
          {route === "chats" && <Conversation />}
          {route === "settings" && <Settings />}
          {route === "discover" && <Discover />}
        </motion.div>
      </div>
    </>
  );
}
