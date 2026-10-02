type SiteBackgroundVariant = "default" | "minimal" | "none"

interface SiteBackgroundProps {
  variant?: SiteBackgroundVariant
}

interface Glow {
  pos: string
  size: string
  color: string
}

/**
 * Global background — one instance for the whole site, rendered in
 * `src/app/layout.tsx` behind everything.
 *
 * Eight static color circles give glass surfaces (navbar, hero cards, modals)
 * something colorful to blur over. Static on purpose: painted once, zero
 * per-frame cost — no animation, no rings, no wave bands. Hero sections own
 * their local accent blobs.
 */
const CORE_GLOWS: Glow[] = [
  {
    pos: "-top-10 left-[2%]",
    size: "h-[12rem] w-[15rem]",
    color: "bg-primary/[0.36] dark:bg-primary/[0.32]",
  },
  {
    pos: "right-[4%] top-[6%]",
    size: "h-[13rem] w-[16rem]",
    color: "bg-secondary/[0.34] dark:bg-secondary/[0.30]",
  },
  {
    pos: "bottom-[8%] left-[14%]",
    size: "h-[12rem] w-[15rem]",
    color: "bg-[#38BDF8]/[0.32] dark:bg-[#38BDF8]/[0.28]",
  },
  {
    pos: "left-[10%] top-[30%]",
    size: "h-[11rem] w-[14rem]",
    color: "bg-[#2DD4BF]/[0.30] dark:bg-[#2DD4BF]/[0.26]",
  },
  {
    pos: "right-[12%] top-[52%]",
    size: "h-[12rem] w-[15rem]",
    color: "bg-[#818CF8]/[0.32] dark:bg-[#818CF8]/[0.28]",
  },
  {
    pos: "bottom-[6%] right-[26%]",
    size: "h-[11rem] w-[14rem]",
    color: "bg-secondary/[0.30] dark:bg-secondary/[0.26]",
  },
  {
    pos: "left-[38%] top-[12%]",
    size: "h-[10rem] w-[13rem]",
    color: "bg-[#22D3EE]/[0.28] dark:bg-[#22D3EE]/[0.24]",
  },
  {
    pos: "right-[30%] bottom-[18%]",
    size: "h-[10rem] w-[13rem]",
    color: "bg-[#2DD4BF]/[0.28] dark:bg-[#2DD4BF]/[0.24]",
  },
]

export function SiteBackground({ variant = "default" }: SiteBackgroundProps) {
  if (variant === "none") return null

  // `minimal` currently renders the same quiet base; kept as a separate
  // branch so dense form/table pages can opt into an even lighter set later.
  const glows = CORE_GLOWS

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
    >
      {glows.map((glow, index) => (
        <div key={index} className={`absolute ${glow.pos}`}>
          <div
            className={`${glow.size} rounded-full blur-[40px] ${glow.color}`}
          />
        </div>
      ))}

      {/* Hairline top glow — ties into the navbar glass edge */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent dark:via-primary/40" />

      {/* Dark-mode vignette — deepens edges so glows read as ambient, not flat */}
      <div className="absolute inset-0 hidden bg-[radial-gradient(ellipse_at_top,transparent_55%,rgba(0,0,0,0.28)_100%)] dark:block" />
    </div>
  )
}
