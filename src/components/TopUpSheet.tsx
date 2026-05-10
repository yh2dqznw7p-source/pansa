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

  const n = Number.parseInt(custom, 10);
  const amount = selected ?? (isFinite(n) ? n : 0);
  const showHint = custom.length > 0 && (!isFinite(n) || n < 50);

  async function submit() {
    setErr(null);
    if (amount < 50) return setErr("Минимальная сумма — 50 ₽");
    setBusy(true);
    try {
      const u = await api.topUp(amount);
      setUser(u);
      setSelected(null); setCustom("");
      closeTopUp();
    } catch (e: any) {
      setErr(typeof e === "string" ? e : e?.message ?? "Ошибка");
    } finally {
      setBusy(false);
    }
  }

  return (
    <AnimatePresence>
      {topUpOpen && (
        <>
          <motion.div
            className="overlay"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={closeTopUp}
          />
          <motion.div
            className="sheet lg lg--strong"
            initial={{ y: -80, opacity: 0, scale: 0.96 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: -50, opacity: 0, scale: 0.96 }}
            transition={{ type: "spring", stiffness: 280, damping: 28 }}
          >
            <div className="row">
              <div>
                <div className="h2">Пополнение</div>
                <div className="subtle" style={{ fontSize: 12, marginTop: 4 }}>
                  Выберите быстрый набор или введите сумму
                </div>
              </div>
              <div style={{ marginLeft: "auto" }}>
                <button className="btn btn--ghost btn--icon" onClick={closeTopUp} aria-label="Закрыть">
                  <IconClose size={18} />
                </button>
              </div>
            </div>

            <div className="token-grid">
              {PRESETS.map((v) => (
                <motion.button
                  key={v}
                  className={`token-card ${selected === v ? "token-card--active" : ""}`}
                  onClick={() => { setSelected(v); setCustom(""); setErr(null); }}
                  whileTap={{ scale: 0.96 }}
                >
                  <div className="token-card__value">{v} ₽</div>
                  <div className="token-card__sub">{v * 10} токенов</div>
                </motion.button>
              ))}
            </div>

            <div className="field">
              <label className="field__label">Другая сумма</label>
              <input
                className={`input ${showHint ? "input--error" : ""}`}
                inputMode="numeric"
                placeholder="от 50 ₽"
                value={custom}
                onChange={(e) => { setCustom(e.target.value.replace(/\D/g, "")); setSelected(null); setErr(null); }}
              />
              <AnimatePresence>
                {showHint && (
                  <motion.div
                    className="hint-error"
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                  >
                    Сумма должна быть не меньше 50 ₽
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {err && <div className="hint-error">{err}</div>}

            <div className="row" style={{ justifyContent: "flex-end", gap: 10 }}>
              <button className="btn" onClick={closeTopUp}>Отмена</button>
              <motion.button
                className="btn btn--primary"
                onClick={submit}
                disabled={busy || amount < 50}
                whileTap={{ scale: 0.96 }}
              >
                {busy ? "Пополнение…" : `Пополнить${amount >= 50 ? ` на ${amount} ₽` : ""}`}
              </motion.button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
