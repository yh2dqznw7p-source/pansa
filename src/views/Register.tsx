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
    if (pwd.length < 6) return setErr("Пароль должен быть минимум 6 символов");
    setBusy(true);
    try {
      const c = await api.requestCode(email.trim());
      setSentCode(c); // dev convenience
      setStep("code");
    } catch (e: any) {
      setErr(typeof e === "string" ? e : e?.message ?? "Ошибка");
    } finally {
      setBusy(false);
    }
  }

  async function verifyAndRegister(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setBusy(true);
    try {
      const ok = await api.verifyCode(email.trim(), code.trim());
      if (!ok) {
        setErr("Неверный код");
        setBusy(false);
        return;
      }
      const r = await api.register(email.trim(), nick.trim(), pwd, pwd2);
      if (!r.ok || !r.user) {
        setErr(r.message ?? "Не удалось зарегистрироваться");
      } else {
        setUser(r.user);
      }
    } catch (e: any) {
      setErr(typeof e === "string" ? e : e?.message ?? "Ошибка");
    } finally {
      setBusy(false);
    }
  }

  return (
    <motion.div
      className="auth-viewport"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -16 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="auth-card lg-surface lg-surface--strong lg-refract">
        <div>
          <h1 className="auth-card__hello">Создать аккаунт</h1>
          <p className="auth-card__sub">
            {step === "form"
              ? "Заполните данные — мы отправим код на ваш локальный сервер"
              : "Введите код подтверждения"}
          </p>
        </div>

        {step === "form" && (
          <form className="form" onSubmit={requestCode}>
            <div className="form__field">
              <label className="label">Почта</label>
              <input
                type="email"
                className="lg-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="form__field">
              <label className="label">Никнейм</label>
              <input
                className="lg-input"
                value={nick}
                onChange={(e) => setNick(e.target.value)}
                required
                minLength={2}
                maxLength={32}
              />
            </div>
            <div className="form__field">
              <label className="label">Пароль</label>
              <input
                type="password"
                className="lg-input"
                value={pwd}
                onChange={(e) => setPwd(e.target.value)}
                required
                minLength={6}
              />
            </div>
            <div className="form__field">
              <label className="label">Повторите пароль</label>
              <input
                type="password"
                className={`lg-input ${mismatch ? "lg-input--error" : ""}`}
                value={pwd2}
                onChange={(e) => setPwd2(e.target.value)}
                required
              />
              {mismatch && <div className="error-hint">Пароли не совпадают</div>}
            </div>

            {err && <div className="error-hint">{err}</div>}

            <motion.button
              type="submit"
              className="lg-button lg-button--primary"
              whileTap={{ scale: 0.98 }}
              disabled={busy}
            >
              {busy ? "Отправка кода…" : "Отправить код"}
            </motion.button>
          </form>
        )}

        {step === "code" && (
          <form className="form" onSubmit={verifyAndRegister}>
            <div className="muted" style={{ fontSize: 13 }}>
              Код отправлен на локальный сервер <code>127.0.0.1:5005</code>.
              {sentCode && (
                <>
                  {" "}
                  <span className="subtle">(dev: <b>{sentCode}</b>)</span>
                </>
              )}
            </div>
            <div className="form__field">
              <label className="label">Код подтверждения</label>
              <input
                className="lg-input"
                inputMode="numeric"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/[^\d]/g, "").slice(0, 6))}
                required
                maxLength={6}
              />
            </div>

            {err && <div className="error-hint">{err}</div>}

            <div className="row" style={{ justifyContent: "space-between" }}>
              <button type="button" className="lg-button" onClick={() => setStep("form")}>
                Назад
              </button>
              <motion.button
                type="submit"
                className="lg-button lg-button--primary"
                whileTap={{ scale: 0.98 }}
                disabled={busy}
              >
                {busy ? "Проверка…" : "Подтвердить"}
              </motion.button>
            </div>
          </form>
        )}

        <div className="auth-card__link">
          <a href="#" onClick={(e) => { e.preventDefault(); setRoute("login"); }}>
            Уже есть аккаунт? Войти
          </a>
        </div>
      </div>
    </motion.div>
  );
}
