import { useApp, type Route } from "../lib/store";
import { IconChat, IconGear, IconHome } from "./Icons";

const ITEMS: { route: Route; label: string; icon: JSX.Element }[] = [
  { route: "home", label: "Главная", icon: <IconHome /> },
  { route: "chats", label: "Чаты", icon: <IconChat /> },
  { route: "settings", label: "Настройки", icon: <IconGear /> },
];

export function SideNav() {
  const { route, setRoute } = useApp();
  return (
    <nav className="sidenav">
      {ITEMS.map((it) => (
        <button key={it.route} className={`nav-item ${route === it.route ? "nav-item--active" : ""}`} onClick={() => setRoute(it.route)}>
          {it.icon}
          <span className="grow">{it.label}</span>
          <span className="nav-item__dot" />
        </button>
      ))}
    </nav>
  );
}
