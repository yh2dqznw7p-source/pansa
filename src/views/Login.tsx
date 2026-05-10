import { motion } from "framer-motion";
import { useState } from "react";
import { api } from "../lib/api";
import { useApp } from "../lib/store";

export function Login() {
  const { setUser, setRoute } = useApp();
  const [email, setEmail] = useState("");
  const [pwd, setPwd] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null); setBusy(true);
    try {
      const r = await api.login(email.trim(), pwd);
      if (!r.ok || !r.user) setErr(r.message ?? "Не удалось войти");
      else setUser(r.user);
    } catch (e: any) {
      setErr(typeof e === "string" ? e : e?.message ?? "Ошибка");
    } finally { setBusy(false); }
  }

  return (
    <div className="auth-stage">
      <motion.form
        className="auth-card lg lg--strong"
        onSubmit={submit}
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="auth-hero">
          <div className="auth-hero__logo" aria-hidden />
          <div className="auth-hero__title">Здравствуйте</div>
          <div className="auth-hero__sub">рады снова вас видеть в OffMessenger</div>
        </div>

        <div className="field">
          <label className="field__label">Почта</label>
          <input
            type="email"
            className="input"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            required
          />
        </div>
        <div className="field">
          <label className="field__label">Пароль</label>
          <input
            type="password"
            className="input"
            placeholder="••••••••"
            value={pwd}
            onChange={(e) => setPwd(e.target.value)}
            autoComplete="current-password"
            required
          />
        </div>

        {err && <div className="hint-error">{err}</div>}

        <motion.button
          type="submit"
          className="btn btn--primary"
          whileTap={{ scale: 0.98 }}
          disabled={busy}
          style={{ padding: "14px 20px", fontSize: 14 }}
        >
          {busy ? "Входим…" : "Войти"}
        </motion.button>

        <div className="link-row">
          <span className="muted">Нет аккаунта? </span>
          <a href="#" onClick={(e) => { e.preventDefault(); setRoute("register"); }}>
            Зарегистрироваться
          </a>
        </div>
      </motion.form>
    </div>
  );
}
