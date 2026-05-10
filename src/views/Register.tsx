import { motion } from "framer-motion";
import { useState } from "react";
import { api } from "../lib/api";
import { useApp } from "../lib/store";

type Step = "form" | "code";

export function Register() {
  const { setUser, setRoute } = useApp();
  const [step, setStep] = useState<Step>("form");
  const [email, setEmail] = useState("");
  const [nick, setNick] = useState("");
  const [pwd, setPwd] = useState("");
  const [pwd2, setPwd2] = useState("");
  const [code, setCode] = useState("");
  const [sentCode, setSentCode] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const mismatch = pwd2.length > 0 && pwd !== pwd2;

  async function requestCode(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    if (pwd !== pwd2) return setErr("Пароли не совпадают");
    if (pwd.length < 6) return setErr("Пароль — минимум 6 символов");
    setBusy(true);
    try {
      const c = await api.requestCode(email.trim());
      setSentCode(c || null);
      setStep("code");
    } catch (e: any) {
      setErr(typeof e === "string" ? e : e?.message ?? "Ошибка");
    } finally { setBusy(false); }
  }

  async function verifyAndRegister(e: React.FormEvent) {
    e.preventDefault();
    setErr(null); setBusy(true);
    try {
      const r = await api.register(email.trim(), nick.trim(), pwd, pwd2, code.trim());
      if (!r.ok || !r.user) setErr(r.message ?? "Не удалось зарегистрироваться");
      else setUser(r.user);
    } catch (e: any) {
      setErr(typeof e === "string" ? e : e?.message ?? "Ошибка");
    } finally { setBusy(false); }
  }

  return (
    <div className="auth-stage">
      <motion.div
        className="auth-card lg lg--strong"
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="auth-hero">
          <div className="auth-hero__logo" aria-hidden />
          <div className="auth-hero__title">Создать аккаунт</div>
          <div className="auth-hero__sub">
            {step === "form" ? "Заполните данные — отправим код подтверждения" : "Введите код"}
          </div>
        </div>

        {step === "form" && (
          <form onSubmit={requestCode} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div className="field">
              <label className="field__label">Почта</label>
              <input type="email" className="input" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className="field">
              <label className="field__label">Никнейм</label>
              <input className="input" value={nick} onChange={(e) => setNick(e.target.value)} required minLength={2} maxLength={32} />
            </div>
            <div className="field">
              <label className="field__label">Пароль</label>
              <input type="password" className="input" value={pwd} onChange={(e) => setPwd(e.target.value)} required minLength={6} />
            </div>
            <div className="field">
              <label className="field__label">Повторите пароль</label>
              <input
                type="password"
                className={`input ${mismatch ? "input--error" : ""}`}
                value={pwd2}
                onChange={(e) => setPwd2(e.target.value)}
                required
              />
              {mismatch && <div className="hint-error">Пароли не совпадают</div>}
            </div>

            {err && <div className="hint-error">{err}</div>}

            <motion.button
              type="submit"
              className="btn btn--primary"
              whileTap={{ scale: 0.98 }}
              disabled={busy}
              style={{ padding: "14px 20px", fontSize: 14 }}
            >
              {busy ? "Отправка…" : "Отправить код"}
            </motion.button>
          </form>
        )}

        {step === "code" && (
          <form onSubmit={verifyAndRegister} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div className="muted" style={{ fontSize: 13, textAlign: "center" }}>
              Код отправлен.
              {sentCode && <> <span className="subtle">(dev: <b>{sentCode}</b>)</span></>}
            </div>
            <div className="field">
              <label className="field__label">Код подтверждения</label>
              <input
                className="input"
                inputMode="numeric"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                required
                maxLength={6}
                style={{ fontSize: 20, letterSpacing: "0.3em", textAlign: "center" }}
              />
            </div>
            {err && <div className="hint-error">{err}</div>}
            <div className="row" style={{ justifyContent: "space-between", gap: 10 }}>
              <button type="button" className="btn" onClick={() => setStep("form")}>Назад</button>
              <motion.button type="submit" className="btn btn--primary" whileTap={{ scale: 0.98 }} disabled={busy}>
                {busy ? "Проверка…" : "Подтвердить"}
              </motion.button>
            </div>
          </form>
        )}

        <div className="link-row">
          <a href="#" onClick={(e) => { e.preventDefault(); setRoute("login"); }}>
            Уже есть аккаунт? Войти
          </a>
        </div>
      </motion.div>
    </div>
  );
}
