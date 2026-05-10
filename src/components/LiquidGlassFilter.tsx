// Global SVG filters — the heart of the liquid-glass look.
//   * lg-displace  — edge refraction used by `.lg::before`
//   * lg-goo       — optional "melted" effect for bubbles
export function LiquidGlassFilter() {
  return (
    <svg
      aria-hidden
      width="0"
      height="0"
      style={{ position: "absolute", width: 0, height: 0, pointerEvents: "none" }}
    >
      <defs>
        <filter id="lg-displace" x="-10%" y="-10%" width="120%" height="120%">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.008 0.012"
            numOctaves="2"
            seed="9"
            result="noise"
          />
          <feGaussianBlur in="noise" stdDeviation="1.5" result="soft" />
          <feDisplacementMap
            in="SourceGraphic"
            in2="soft"
            scale="22"
            xChannelSelector="R"
            yChannelSelector="G"
          />
        </filter>

        <filter id="lg-goo">
          <feGaussianBlur in="SourceGraphic" stdDeviation="8" result="b" />
          <feColorMatrix
            in="b"
            type="matrix"
            values="
              1 0 0 0 0
              0 1 0 0 0
              0 0 1 0 0
              0 0 0 20 -10"
            result="g"
          />
          <feComposite in="SourceGraphic" in2="g" operator="atop" />
        </filter>
      </defs>
    </svg>
  );
}
