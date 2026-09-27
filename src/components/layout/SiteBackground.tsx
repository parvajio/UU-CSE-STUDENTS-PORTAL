type SiteBackgroundVariant = "default" | "minimal" | "none"

interface SiteBackgroundProps {
  variant?: SiteBackgroundVariant
}

interface Glow {
  pos: string
  size: string
  color: string
}

/** Core glows — always rendered, even in `minimal` mode. */
const CORE_GLOWS: Glow[] = [
  {
    pos: "-top-10 left-[2%]",
    size: "h-[10rem] w-[13rem]",
    color: "bg-primary/[0.24] dark:bg-primary/[0.22]",
  },
  {
    pos: "right-[4%] top-[6%]",
    size: "h-[11rem] w-[14rem]",
    color: "bg-secondary/[0.22] dark:bg-secondary/[0.20]",
  },
  {
    pos: "bottom-[8%] left-[14%]",
    size: "h-[10rem] w-[13rem]",
    color: "bg-[#38BDF8]/[0.20] dark:bg-[#38BDF8]/[0.18]",
  },
]

/** Extra glows — fill out the full viewport height. */
const EXTRA_GLOWS: Glow[] = [
  {
    pos: "left-[10%] top-[30%]",
    size: "h-[9rem] w-[12rem]",
    color: "bg-[#818CF8]/[0.22] dark:bg-[#818CF8]/[0.18]",
  },
  {
    pos: "right-[12%] top-[52%]",
    size: "h-[10rem] w-[13rem]",
    color: "bg-[#22D3EE]/[0.18] dark:bg-[#22D3EE]/[0.16]",
  },
  {
    pos: "bottom-[6%] right-[26%]",
    size: "h-[10rem] w-[14rem]",
    color: "bg-secondary/[0.20] dark:bg-secondary/[0.18]",
  },
]

/**
 * Builds a wavy-circle path: radius modulated as r(θ) = R + A·sin(kθ + φ).
 * Computed once at module level — zero per-render cost.
 */
function wavyRingPath(
  lobes: number,
  ampPct: number,
  phase = 0,
  segments = 144,
): string {
  const cx = 100
  const cy = 100
  const R = 88
  let d = ""
  for (let i = 0; i <= segments; i++) {
    const t = (i / segments) * Math.PI * 2
    const r = R * (1 + (ampPct / 100) * Math.sin(lobes * t + phase))
    const x = cx + r * Math.cos(t)
    const y = cy + r * Math.sin(t)
    d += `${i === 0 ? "M" : "L"}${x.toFixed(2)},${y.toFixed(2)}`
  }
  return d + "Z"
}

/** Precomputed ring characters — distinct lobe counts/phases per group. */
const RING_A_OUTER = wavyRingPath(7, 3, 0)
const RING_A_INNER = wavyRingPath(5, 4, 1.3)
const RING_B_OUTER = wavyRingPath(6, 3.5, 0.6)
const RING_B_INNER = wavyRingPath(8, 3, 2.1)
const RING_C_OUTER = wavyRingPath(8, 3, 1.1)
const RING_C_INNER = wavyRingPath(5, 4, 2.6)
const RING_D_OUTER = wavyRingPath(6, 5, 0.3)
const RING_D_INNER = wavyRingPath(9, 4, 1.8)

interface WavyRingProps {
  d: string
  strokeClass: string
  spinClass: string
  durationSec: number
  className?: string
  strokeWidth?: number
}

/**
 * One wavy circumference ring. Rotation applies to the whole SVG element
 * (transform-only, compositor-cheap) — visible precisely because the wavy
 * edge breaks rotational symmetry.
 */
function WavyRing({
  d,
  strokeClass,
  spinClass,
  durationSec,
  className = "",
  strokeWidth = 1.25,
}: WavyRingProps) {
  return (
    <svg
      viewBox="0 0 200 200"
      fill="none"
      className={`${className} ${spinClass}`}
      style={{ animationDuration: `${durationSec}s` }}
    >
      <path
        d={d}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        className={strokeClass}
      />
    </svg>
  )
}

interface WaveTileProps {
  className?: string
  strokeA?: string
  strokeB?: string
}

/** One sine-wave SVG tile — two copies side by side drift seamlessly. */
function WaveTile({
  className = "h-24",
  strokeA = "rgba(45,212,191,0.35)",
  strokeB = "rgba(56,189,248,0.30)",
}: WaveTileProps) {
  return (
    <svg
      viewBox="0 0 1200 120"
      preserveAspectRatio="none"
      className={`w-1/2 shrink-0 ${className}`}
    >
      <path
        d="M0,60 C200,20 400,100 600,60 C800,20 1000,100 1200,60"
        fill="none"
        stroke={strokeA}
        strokeWidth="1.5"
      />
      <path
        d="M0,75 C200,40 400,110 600,75 C800,40 1000,110 1200,75"
        fill="none"
        stroke={strokeB}
        strokeWidth="1.5"
      />
    </svg>
  )
}

const TEAL_STROKE = "stroke-[#2DD4BF]/40 dark:stroke-[#2DD4BF]/50"
const SKY_STROKE = "stroke-[#38BDF8]/35 dark:stroke-[#38BDF8]/45"
const INDIGO_STROKE = "stroke-[#818CF8]/40 dark:stroke-[#818CF8]/50"

/**
 * Global background — one instance for the whole site, rendered in
 * `src/app/layout.tsx` behind everything.
 *
 * Near-static for performance: soft color glows are painted once and never
 * move. The ONLY motion is transform-only (compositor-cheap, no repaints):
 * four wavy circumference rings rotating slowly (visible because the wavy
 * edge breaks symmetry) and four seamless wave bands drifting horizontally.
 * All motion freezes under `prefers-reduced-motion` in `globals.css`.
 *
 * The glows give glass surfaces (navbar, hero cards, modals) something to
 * blur over. Opacity is tuned per mode so the tint reads on both `#F7F8FC`
 * (light) and `#0F1020` (dark).
 *
 * Variants exist for future opt-in intensity only (e.g. dense form pages):
 * `minimal` keeps three glows, `none` renders nothing.
 */
export function SiteBackground({ variant = "default" }: SiteBackgroundProps) {
  if (variant === "none") return null

  const glows =
    variant === "minimal" ? CORE_GLOWS : [...CORE_GLOWS, ...EXTRA_GLOWS]

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
    >
      {glows.map((glow, index) => (
        <div key={index} className={`absolute ${glow.pos}`}>
          <div
            className={`${glow.size} rounded-full blur-[55px] ${glow.color}`}
          />
        </div>
      ))}

      {/* Wavy rings — large, top-right corner */}
      <div className="absolute -right-[12rem] -top-[20rem]">
        <div className="relative h-[42rem] w-[42rem]">
          <WavyRing
            d={RING_A_OUTER}
            strokeClass={TEAL_STROKE}
            spinClass="animate-spin-slower"
            durationSec={55}
            className="absolute inset-0 h-full w-full"
          />
          <WavyRing
            d={RING_A_INNER}
            strokeClass={SKY_STROKE}
            spinClass="animate-spin-slower-rev"
            durationSec={70}
            className="absolute inset-[5rem]"
          />
        </div>
      </div>

      {/* Wavy rings — medium, top-center */}
      <div className="absolute -top-[15rem] left-1/2 -translate-x-1/2">
        <div className="relative h-[26rem] w-[26rem]">
          <WavyRing
            d={RING_B_OUTER}
            strokeClass={SKY_STROKE}
            spinClass="animate-spin-slower"
            durationSec={45}
            className="absolute inset-0 h-full w-full"
          />
          <WavyRing
            d={RING_B_INNER}
            strokeClass={INDIGO_STROKE}
            spinClass="animate-spin-slower-rev"
            durationSec={60}
            className="absolute inset-[3.5rem]"
          />
        </div>
      </div>

      {/* Wavy rings — medium, bottom-left corner */}
      <div className="absolute -bottom-[14rem] -left-[8rem]">
        <div className="relative h-[30rem] w-[30rem]">
          <WavyRing
            d={RING_C_OUTER}
            strokeClass={INDIGO_STROKE}
            spinClass="animate-spin-slower"
            durationSec={60}
            className="absolute inset-0 h-full w-full"
          />
          <WavyRing
            d={RING_C_INNER}
            strokeClass={TEAL_STROKE}
            spinClass="animate-spin-slower-rev"
            durationSec={48}
            className="absolute inset-[4rem]"
          />
        </div>
      </div>

      {/* Wavy rings — small, center-right */}
      <div className="absolute right-[5%] top-[44%]">
        <div className="relative h-[20rem] w-[20rem]">
          <WavyRing
            d={RING_D_OUTER}
            strokeClass={TEAL_STROKE}
            spinClass="animate-spin-slower"
            durationSec={40}
            className="absolute inset-0 h-full w-full"
          />
          <WavyRing
            d={RING_D_INNER}
            strokeClass={SKY_STROKE}
            spinClass="animate-spin-slower-rev"
            durationSec={52}
            className="absolute inset-[3rem]"
          />
        </div>
      </div>

      {/* Wave band — mini version, top-left corner, slanted below the navbar */}
      <div className="absolute left-[-6%] top-[10rem] w-[36%] origin-top-left -rotate-12 overflow-hidden">
        <div className="animate-wave flex w-[200%] [animation-duration:12s]">
          <WaveTile className="h-12" />
          <WaveTile className="h-12" />
        </div>
      </div>

      {/* Wave band — faint, mid-page */}
      <div className="absolute inset-x-0 top-[56%] overflow-hidden opacity-70">
        <div className="animate-wave flex w-[200%] [animation-duration:26s]">
          <WaveTile
            className="h-20"
            strokeA="rgba(45,212,191,0.28)"
            strokeB="rgba(56,189,248,0.24)"
          />
          <WaveTile
            className="h-20"
            strokeA="rgba(45,212,191,0.28)"
            strokeB="rgba(56,189,248,0.24)"
          />
        </div>
      </div>

      {/* Wave band — small, bottom-right corner, mirrored slant */}
      <div className="absolute bottom-[14%] right-[-6%] w-[30%] origin-bottom-right rotate-12 overflow-hidden">
        <div className="animate-wave flex w-[200%] [animation-duration:14s]">
          <WaveTile className="h-12" />
          <WaveTile className="h-12" />
        </div>
      </div>

      {/* Wave band — full version, bottom */}
      <div className="absolute inset-x-0 bottom-[4%] overflow-hidden">
        <div className="animate-wave flex w-[200%]">
          <WaveTile />
          <WaveTile />
        </div>
      </div>

      {/* Hairline top glow — ties into the navbar glass edge */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent dark:via-primary/40" />

      {/* Dark-mode vignette — deepens edges so glows read as ambient, not flat */}
      <div className="absolute inset-0 hidden bg-[radial-gradient(ellipse_at_top,transparent_55%,rgba(0,0,0,0.28)_100%)] dark:block" />
    </div>
  )
}
