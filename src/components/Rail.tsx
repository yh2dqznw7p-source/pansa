import { motion } from "framer-motion";
import { useApp, type Route } from "../lib/store";
import { Avatar } from "./Avatar";
import { IconChat, IconGear, IconSearch } from "./Icons";

type Item = { route: Route; label: string; icon: JSX.Element };

const TOP: Item[] = [
  { route: "chats", label: "Чаты", icon: <IconChat /> },
  { route: "search", label: "Поиск", icon: <IconSearch /> },
];

export function Rail() {
  const { route, setRoute, user } = useApp();
  return (
    <nav className="rail lg">
      {TOP.map((it) => (
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

      <motion.button
        className={`rail__btn ${route === "settings" ? "rail__btn--active" : ""}`}
        onClick={() => setRoute("settings")}
        whileTap={{ scale: 0.92 }}
        aria-label="Настройки"
        title="Настройки"
      >
        <IconGear />
      </motion.button>

      {user && (
        <Avatar
          seed={user.id}
          name={user.nickname}
          size={40}
          className="rail__avatar"
        />
      )}
    </nav>
  );
}
