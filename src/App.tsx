import { AnimatePresence, motion } from "framer-motion";
import { useEffect } from "react";
import { LiquidGlassFilter } from "./components/LiquidGlassFilter";
import { SideNav } from "./components/SideNav";
import { TopBar } from "./components/TopBar";
import { TopUpSheet } from "./components/TopUpSheet";
import { useApp } from "./lib/store";
import { Chats } from "./views/Chats";
import { Home } from "./views/Home";
import { Login } from "./views/Login";
import { Register } from "./views/Register";
import { Settings } from "./views/Settings";

export default function App() {
  const { user, route, refreshUser } = useApp();
  useEffect(() => { refreshUser(); }, [refreshUser]);

  const authed = !!user;
  const authView = route === "register" ? <Register key="register" /> : <Login key="login" />;

  return (
    <>
      <div className="lg-ambient" />
      <LiquidGlassFilter />
      <TopUpSheet />
      <div className="app-shell">
        <TopBar />
        <main className="main">
          <AnimatePresence mode="wait">
            {!authed && (
              <motion.div key="auth" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }} style={{ height: "100%" }}>{authView}</motion.div>
            )}
            {authed && (
              <motion.div key="app" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }} style={{ height: "100%" }}>
                <div className="layout">
                  <SideNav />
                  <div style={{ minHeight: 0, position: "relative" }}>
                    <AnimatePresence mode="wait">
                      {route === "home" && <Home key="home" />}
                      {route === "chats" && <Chats key="chats" />}
                      {route === "settings" && <Settings key="settings" />}
                    </AnimatePresence>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>
    </>
  );
}
