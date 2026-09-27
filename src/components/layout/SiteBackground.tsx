type SiteBackgroundVariant = "default" | "minimal" | "none"

interface SiteBackgroundProps {
  variant?: SiteBackgroundVariant
}

interface Bubble {
  pos: string
  size: string
  color: string
  anim: string
}

/** Core bubbles — always rendered, even in `minimal` mode. */
const CORE_BUBBLES: Bubble[] = [
  {
    pos: "-top-10 left-[2%]",
    size: "h-[10rem] w-[13rem]",
    color: "bg-primary/[0.24] dark:bg-primary/[0.22]",
    anim: "animate-drift-1",
  },
  {
    pos: "right-[4%] top-[6%]",
    size: "h-[11rem] w-[14rem]",
    color: "bg-secondary/[0.22] dark:bg-secondary/[0.20]",
    anim: "animate-drift-2",
  },
  {
    pos: "bottom-[8%] left-[14%]",
    size: "h-[10rem] w-[13rem]",
    color: "bg-[#38BDF8]/[0.20] dark:bg-[#38BDF8]/[0.18]",
    anim: "animate-drift-3",
  },
]

/** Extra bubbles — full live-background field, full viewport height. */
const EXTRA_BUBBLES: Bubble[] = [
  {
    pos: "left-[36%] top-[2%]",
    size: "h-[8rem] w-[11rem]",
    color: "bg-[#38BDF8]/[0.22] dark:bg-[#38BDF8]/[0.18]",
    anim: "animate-drift-4",
  },
  {
    pos: "left-[10%] top-[22%]",
    size: "h-[9rem] w-[12rem]",
    color: "bg-[#818CF8]/[0.22] dark:bg-[#818CF8]/[0.18]",
    anim: "animate-drift-5",
  },
  {
    pos: "right-[12%] top-[26%]",
    size: "h-[10rem] w-[13rem]",
    color: "bg-primary/[0.20] dark:bg-primary/[0.18]",
    anim: "animate-drift-6",
  },
  {
    pos: "left-[30%] top-[40%]",
    size: "h-[8rem] w-[10rem]",
    color: "bg-secondary/[0.20] dark:bg-secondary/[0.18]",
    anim: "animate-drift-2 [animation-duration:18s]",
  },
  {
    pos: "right-[28%] top-[46%]",
    size: "h-[9rem] w-[12rem]",
    color: "bg-[#22D3EE]/[0.18] dark:bg-[#22D3EE]/[0.16]",
    anim: "animate-drift-1 [animation-duration:22s]",
  },
  {
    pos: "left-[4%] top-[58%]",
    size: "h-[10rem] w-[13rem]",
    color: "bg-[#C4B5FD]/[0.22] dark:bg-[#C4B5FD]/[0.16]",
    anim: "animate-drift-3 [animation-duration:20s]",
  },
  {
    pos: "right-[4%] top-[64%]",
    size: "h-[11rem] w-[14rem]",
    color: "bg-[#818CF8]/[0.20] dark:bg-[#818CF8]/[0.18]",
    anim: "animate-drift-4 [animation-duration:26s]",
  },
  {
    pos: "bottom-[14%] left-[38%]",
    size: "h-[9rem] w-[12rem]",
    color: "bg-primary/[0.18] dark:bg-primary/[0.18]",
    anim: "animate-drift-5 [animation-duration:24s]",
  },
  {
    pos: "bottom-[4%] right-[24%]",
    size: "h-[10rem] w-[14rem]",
    color: "bg-secondary/[0.20] dark:bg-secondary/[0.18]",
    anim: "animate-drift-6 [animation-duration:16s]",
  },
]

/**
 * Global live background — one instance for the whole site, rendered in
 * `src/app/layout.tsx` behind everything.
 *
 * A field of twelve small color bubbles (brand primary/secondary plus
 * sky/indigo/cyan/lavender from the same cool family) scattered across the
 * full viewport height, each drifting on its own path at its own speed,
 * layered under teal/cyan orbit rings — large top-right, medium
 * top-center, medium bottom-left, small center-right — each with a slowly
 * circling light arc, plus seamless wave bands (full bottom, mini slanted
 * top-left below the navbar). Rings and waves slowly cycle hue, staggered
 * so colors never
 * match. They give glass
 * surfaces (navbar, hero cards, modals) something to blur over. Opacity is
 * tuned per mode so the tint reads on both `#F7F8FC` (light) and `#0F1020`
 * (dark).
 *
 * Motion is transform-only on wrapper divs (blur stays on static inner divs
 * so the browser just composites), with staggered 16–28s durations.
 * Disabled under `prefers-reduced-motion` in `globals.css`.
 *
 * Variants exist for future opt-in intensity only (e.g. dense form pages):
 * `minimal` keeps three bubbles, `none` renders nothing.
 */
/** One sine-wave SVG tile — two copies side by side drift seamlessly. */
function WaveTile({ className = "h-24" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 1200 120"
      preserveAspectRatio="none"
      className={`w-1/2 shrink-0 ${className}`}
    >
      <path
        d="M0,60 C200,20 400,100 600,60 C800,20 1000,100 1200,60"
        fill="none"
        stroke="rgba(45,212,191,0.35)"
        strokeWidth="1.5"
      />
      <path
        d="M0,75 C200,40 400,110 600,75 C800,40 1000,110 1200,75"
        fill="none"
        stroke="rgba(56,189,248,0.30)"
        strokeWidth="1.5"
      />
    </svg>
  )
}

export function SiteBackground({ variant = "default" }: SiteBackgroundProps) {
  if (variant === "none") return null

  const bubbles =
    variant === "minimal" ? CORE_BUBBLES : [...CORE_BUBBLES, ...EXTRA_BUBBLES]

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
    >
      {bubbles.map((bubble, index) => (
        <div key={index} className={`absolute ${bubble.pos} ${bubble.anim}`}>
          <div
            className={`${bubble.size} rounded-full blur-[55px] ${bubble.color}`}
          />
        </div>
      ))}

      {/* Orbit rings — large, top-right corner */}
      <div className="absolute -right-[12rem] -top-[20rem] animate-hue">
        <div className="relative h-[42rem] w-[42rem]">
          <div className="absolute inset-0 rounded-full border border-[#2DD4BF]/25 dark:border-[#2DD4BF]/30" />
          <div className="absolute inset-[5rem] rounded-full border border-[#38BDF8]/20 dark:border-[#38BDF8]/25" />
          <div className="absolute inset-[10rem] rounded-full border border-[#2DD4BF]/15 dark:border-[#2DD4BF]/20" />
          {/* Orbiting light arc — the moving element of the rings */}
          <div className="conic-arc absolute inset-0 animate-orbit" />
        </div>
      </div>

      {/* Orbit rings — medium, top-center */}
      <div className="absolute -top-[15rem] left-1/2 -translate-x-1/2 animate-hue [animation-duration:44s]">
        <div className="relative h-[26rem] w-[26rem]">
          <div className="absolute inset-0 rounded-full border border-[#38BDF8]/20 dark:border-[#38BDF8]/25" />
          <div className="absolute inset-[3.5rem] rounded-full border border-[#2DD4BF]/15 dark:border-[#2DD4BF]/20" />
          <div className="conic-arc absolute inset-0 animate-orbit-rev [animation-duration:30s]" />
        </div>
      </div>

      {/* Orbit rings — medium, bottom-left corner */}
      <div className="absolute -bottom-[14rem] -left-[8rem] animate-hue [animation-duration:32s]">
        <div className="relative h-[30rem] w-[30rem]">
          <div className="absolute inset-0 rounded-full border border-[#38BDF8]/20 dark:border-[#38BDF8]/25" />
          <div className="absolute inset-[4rem] rounded-full border border-[#2DD4BF]/15 dark:border-[#2DD4BF]/20" />
          <div className="conic-arc absolute inset-[4rem] animate-orbit-rev" />
        </div>
      </div>

      {/* Orbit rings — small, center-right */}
      <div className="absolute right-[5%] top-[44%] animate-hue [animation-duration:40s]">
        <div className="relative h-[20rem] w-[20rem]">
          <div className="absolute inset-0 rounded-full border border-[#2DD4BF]/20 dark:border-[#2DD4BF]/25" />
          <div className="absolute inset-[3rem] rounded-full border border-[#38BDF8]/15 dark:border-[#38BDF8]/20" />
          <div className="conic-arc absolute inset-0 animate-orbit [animation-duration:20s]" />
        </div>
      </div>

      {/* Wave band — mini version, top-left corner, slanted below the navbar */}
      <div className="absolute left-[-6%] top-[10rem] w-[36%] origin-top-left -rotate-12 overflow-hidden animate-hue [animation-duration:28s]">
        <div className="animate-wave flex w-[200%] [animation-duration:12s]">
          <WaveTile className="h-12" />
          <WaveTile className="h-12" />
        </div>
      </div>

      {/* Wave band — full version, bottom */}
      <div className="absolute inset-x-0 bottom-[4%] overflow-hidden animate-hue [animation-duration:28s]">
        <div className="animate-wave flex w-[200%]">
          <WaveTile />
          <WaveTile />
        </div>
      </div>

      {/* Hairline top glow — ties into the navbar glass edge */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent dark:via-primary/40" />

      {/* Dark-mode vignette — deepens edges so bubbles read as ambient, not flat */}
      <div className="absolute inset-0 hidden bg-[radial-gradient(ellipse_at_top,transparent_55%,rgba(0,0,0,0.28)_100%)] dark:block" />
    </div>
  )
}
