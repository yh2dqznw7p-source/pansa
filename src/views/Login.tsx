import { motion } from "framer-motion";
import { useState } from "react";
import { api } from "../lib/api";
import { useApp } from "../lib/store";
import { IconApple, IconGoogle, IconVK } from "../components/Icons";

export function Login() {
  const { setUser, setRoute } = useApp();
  const [email, setEmail] = useState("");
  const [pwd, setPwd] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setBusy(true);
    try {
      const r = await api.login(email.trim(), pwd);
      if (!r.ok || !r.user) setErr(r.message ?? "Не удалось войти");
      else setUser(r.user);
    } catch (e: any) { setErr(typeof e === "string" ? e : e?.message ?? "Ошибка"); } finally { setBusy(false); }
  }

  function oauthStub(provider: string) { setErr(`${provider}: требуется client_id в настройках провайдера`); }

  return (
    <motion.div className="auth-viewport" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}>
      <form className="auth-card lg-surface lg-surface--strong lg-refract" onSubmit={submit}>
        <div>
          <h1 className="auth-card__hello">Здравствуйте, рады вас видеть</h1>
          <p className="auth-card__sub">Войдите, чтобы продолжить общение</p>
        </div>
        <div className="form">
          <div className="form__field">
            <label className="label" htmlFor="email">Почта</label>
            <input id="email" type="email" className="lg-input" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" required />
          </div>
          <div className="form__field">
            <label className="label" htmlFor="pwd">Пароль</label>
            <input id="pwd" type="password" className="lg-input" placeholder="••••••••" value={pwd} onChange={(e) => setPwd(e.target.value)} autoComplete="current-password" required />
          </div>
          {err && <div className="error-hint">{err}</div>}
          <motion.button type="submit" className="lg-button lg-button--primary" whileTap={{ scale: 0.98 }} disabled={busy}>{busy ? "Входим…" : "Войти"}</motion.button>
        </div>
        <div className="divider">или</div>
        <div className="social-grid">
          <button type="button" className="lg-button" onClick={() => oauthStub("Google")}><IconGoogle /> Google</button>
          <button type="button" className="lg-button" onClick={() => oauthStub("ВКонтакте")}><IconVK /> ВКонтакте</button>
          <button type="button" className="lg-button" onClick={() => oauthStub("Apple")}><IconApple /> Apple ID</button>
        </div>
        <div className="auth-card__link">
          <span className="muted">Нет аккаунта? </span>
          <a href="#" onClick={(e) => { e.preventDefault(); setRoute("register"); }}>Зарегистрироваться</a>
        </div>
      </form>
    </motion.div>
  );
}
