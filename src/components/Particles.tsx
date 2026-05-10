import { useEffect, useRef } from "react";

/**
 * Falling starlet particles rendered on a <canvas> that covers the whole
 * viewport. Monochrome only — each star is white with variable alpha.
 *
 * `density` controls how many active stars exist at a time.
 * Call-site toggles mount/unmount via the Zustand setting.
 */
export function Particles({ density = 60 }: { density?: number }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf = 0;
    let w = 0, h = 0;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    type Star = {
      x: number; y: number;
      vx: number; vy: number;
      size: number;
      rot: number; rotSpeed: number;
      life: number; maxLife: number;
      twinkle: number;
    };
    const stars: Star[] = [];

    function resize() {
      w = canvas!.clientWidth;
      h = canvas!.clientHeight;
      canvas!.width = w * dpr;
      canvas!.height = h * dpr;
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    resize();
    window.addEventListener("resize", resize);

    function spawn(y = -8): Star {
      const x = Math.random() * w;
      return {
        x, y,
        vx: (Math.random() - 0.5) * 0.25,
        vy: 0.35 + Math.random() * 0.9,
        size: 0.7 + Math.random() * 2.0,
        rot: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 0.02,
        life: 0,
        maxLife: 600 + Math.random() * 400,
        twinkle: Math.random() * Math.PI * 2,
      };
    }
    // Seed with some already mid-air so the first frame looks natural.
    for (let i = 0; i < density; i++) stars.push(spawn(Math.random() * h));

    function drawStar(s: Star) {
      const alpha = Math.max(
        0,
        Math.min(1, 0.35 + 0.5 * Math.sin(s.twinkle))
      ) * (1 - s.life / s.maxLife);
      ctx!.save();
      ctx!.translate(s.x, s.y);
      ctx!.rotate(s.rot);
      ctx!.fillStyle = `rgba(255,255,255,${alpha.toFixed(3)})`;
      // 4-point glyph star (sparkle)
      const r = s.size;
      ctx!.beginPath();
      ctx!.moveTo(0, -r);
      ctx!.quadraticCurveTo(r * 0.25, -r * 0.25, r, 0);
      ctx!.quadraticCurveTo(r * 0.25, r * 0.25, 0, r);
      ctx!.quadraticCurveTo(-r * 0.25, r * 0.25, -r, 0);
      ctx!.quadraticCurveTo(-r * 0.25, -r * 0.25, 0, -r);
      ctx!.closePath();
      ctx!.fill();
      ctx!.restore();
    }

    function frame() {
      ctx!.clearRect(0, 0, w, h);
      // Keep population around `density`
      if (stars.length < density && Math.random() < 0.6) stars.push(spawn());

      for (let i = stars.length - 1; i >= 0; i--) {
        const s = stars[i];
        s.x += s.vx;
        s.y += s.vy;
        s.rot += s.rotSpeed;
        s.twinkle += 0.06;
        s.life += 1;
        drawStar(s);
        if (s.y > h + 10 || s.life > s.maxLife) {
          stars.splice(i, 1);
        }
      }
      raf = requestAnimationFrame(frame);
    }
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, [density]);

  return <canvas ref={ref} className="particles" aria-hidden />;
}
