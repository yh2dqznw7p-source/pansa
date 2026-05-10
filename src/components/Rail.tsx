import { motion } from "framer-motion";
import { useApp, type Route } from "../lib/store";
import { IconChat, IconGear, IconSparkle } from "./Icons";
import { Avatar } from "./Avatar";

type Item = { route: Route; label: string; icon: JSX.Element };

const ITEMS: Item[] = [
  { route: "chats", label: "Чаты", icon: <IconChat /> },
  { route: "discover", label: "Интересное", icon: <IconSparkle /> },
  { route: "settings", label: "Настройки", icon: <IconGear /> },
];

export function Rail() {
  const { route, setRoute, user } = useApp();
  return (
    <nav className="rail lg">
      <div className="rail__logo">O</div>
      {ITEMS.map((it) => (
        <motion.button
          key={it.route}
          className={`rail__btn ${route === it.route ? "rail__btn--active" : ""}`}
          onClick={() => setRoute(it.route)}
          whileTap={{ scale: 0.92 }}
          aria-label={it.label}
          title={it.label}
        >
          {it.icon}
        </motion.button>
      ))}
      <div className="rail__spacer" />
      {user && (
        <Avatar
          seed={user.id}
          name={user.nickname}
          size={44}
          className="rail__avatar"
        />
      )}
    </nav>
  );
}
