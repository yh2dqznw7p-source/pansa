import { useEffect, useRef } from "react";

/**
 * Ambient liquid background — three overlapping layers:
 *   1. Colorful orbs (CSS radial gradients) that slowly drift.
 *   2. Subtle film grain (SVG noise as data URL) for texture.
 *   3. A low-opacity parallax offset that tracks cursor motion so
 *      the refraction through .lg surfaces feels alive.
 */
export function Ambient() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let raf = 0;
    let tx = 0, ty = 0;
    const el = ref.current;
    if (!el) return;

    const onMove = (e: MouseEvent) => {
      const nx = (e.clientX / window.innerWidth - 0.5) * 2;
      const ny = (e.clientY / window.innerHeight - 0.5) * 2;
      tx = nx * 12;
      ty = ny * 12;
    };
    const tick = () => {
      if (el) el.style.transform = `translate3d(${tx}px, ${ty}px, 0)`;
      raf = requestAnimationFrame(tick);
    };
    window.addEventListener("mousemove", onMove, { passive: true });
    raf = requestAnimationFrame(tick);
    return () => {
      window.removeEventListener("mousemove", onMove);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div className="lg-ambient" aria-hidden>
      <div ref={ref} className="lg-ambient__grid" />
      <div className="lg-ambient__noise" />
    </div>
  );
}
