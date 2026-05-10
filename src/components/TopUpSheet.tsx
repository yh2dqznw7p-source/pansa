import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import { api } from "../lib/api";
import { useApp } from "../lib/store";
import { IconClose } from "./Icons";

const PRESETS = [50, 100, 500, 1000, 2000, 5000];

export function TopUpSheet() {
  const { topUpOpen, closeTopUp, setUser } = useApp();
  const [selected, setSelected] = useState<number | null>(null);
  const [custom, setCustom] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const customAmount = Number.parseInt(custom, 10);
  const amount = selected ?? (isFinite(customAmount) ? customAmount : 0);
  const showHint = custom.length > 0 && (!isFinite(customAmount) || customAmount < 50);

  async function submit() {
    setErr(null);
    if (amount < 50) { setErr("Минимальная сумма — 50 ₽"); return; }
    setBusy(true);
    try {
      const u = await api.topUp(amount);
      setUser(u);
      setSelected(null);
      setCustom("");
      closeTopUp();
    } catch (e: any) { setErr(typeof e === "string" ? e : e?.message ?? "Ошибка"); } finally { setBusy(false); }
  }

  return (
    <AnimatePresence>
      {topUpOpen && (
        <>
          <motion.div className="overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} onClick={closeTopUp} />
          <motion.div className="sheet lg-surface lg-surface--strong lg-refract" initial={{ y: -60, opacity: 0, scale: 0.98 }} animate={{ y: 0, opacity: 1, scale: 1 }} exit={{ y: -40, opacity: 0, scale: 0.98 }} transition={{ type: "spring", stiffness: 260, damping: 26 }}>
            <div className="row">
              <h2 className="h2 grow">Пополнение</h2>
              <button className="lg-button lg-button--ghost" onClick={closeTopUp} aria-label="Закрыть"><IconClose size={18} /></button>
            </div>
            <div className="label">Быстрые наборы</div>
            <div className="token-grid">
              {PRESETS.map((v) => (
                <motion.button key={v} className={`token-card ${selected === v ? "token-card--active" : ""}`} onClick={() => { setSelected(v); setCustom(""); setErr(null); }} whileTap={{ scale: 0.97 }}>
                  <div className="token-card__value">{v} ₽</div>
                  <div className="token-card__sub">{v * 10} токенов</div>
                </motion.button>
              ))}
            </div>
            <div className="form__field">
              <label className="label" htmlFor="custom-amount">Другая сумма</label>
              <input id="custom-amount" className={`lg-input ${showHint ? "lg-input--error" : ""}`} inputMode="numeric" placeholder="от 50 ₽" value={custom} onChange={(e) => { setCustom(e.target.value.replace(/[^\d]/g, "")); setSelected(null); setErr(null); }} />
              <AnimatePresence>
                {showHint && <motion.div className="error-hint" initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.18 }}>Сумма должна быть не меньше 50 ₽</motion.div>}
              </AnimatePresence>
            </div>
            {err && <div className="error-hint">{err}</div>}
            <div className="row" style={{ justifyContent: "flex-end" }}>
              <button className="lg-button" onClick={closeTopUp}>Отмена</button>
              <motion.button className="lg-button lg-button--primary" onClick={submit} disabled={busy || amount < 50} whileTap={{ scale: 0.97 }}>{busy ? "Пополнение…" : `Пополнить${amount >= 50 ? ` на ${amount} ₽` : ""}`}</motion.button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
