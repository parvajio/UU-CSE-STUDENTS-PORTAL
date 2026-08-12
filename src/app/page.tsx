import Link from "next/link"
import { 
  Users, 
  FileText, 
  GraduationCap, 
  Building2, 
  Calendar, 
  ArrowRight, 
  Sparkles, 
  ShieldCheck, 
  BookOpen,
  Code2
} from "lucide-react"

export default function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-16 pb-24 md:pt-24 md:pb-32">
        {/* Soft background gradient glow */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-gradient-to-tr from-primary/15 via-secondary/15 to-transparent rounded-full blur-3xl pointer-events-none" />

        <div className="container mx-auto px-4 max-w-6xl relative z-10">
          <div className="text-center max-w-3xl mx-auto space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary/10 border border-primary/25 text-primary text-xs font-semibold tracking-wide">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Official Departmental Portal</span>
            </div>

            <h1 className="text-4xl md:text-6xl font-heading font-bold tracking-tight text-foreground">
              Empowering CSE <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">Students & Alumni</span>
            </h1>

            <p className="text-lg md:text-xl text-muted-foreground leading-relaxed">
              The central academic and professional hub for Computer Science & Engineering. Discover verified expert profiles, browse past semester question papers, and collaborate with your peers.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <Link
                href="/experts"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground font-medium shadow-[0_2px_8px_rgba(91,95,239,0.25)] hover:bg-primary-hover transition-all"
              >
                <Users className="w-4 h-4" />
                <span>Explore Experts</span>
                <ArrowRight className="w-4 h-4 ml-1" />
              </Link>
              <Link
                href="/question-bank"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-surface border border-border text-foreground font-medium hover:bg-accent hover:text-accent-foreground transition-all"
              >
                <FileText className="w-4 h-4" />
                <span>Browse Question Bank</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Live Features Section */}
      <section className="py-16 border-t border-border/60 bg-surface/30">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="space-y-3 mb-12">
            <div className="inline-block px-3 py-1 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-semibold uppercase tracking-wider">
              Available Now
            </div>
            <h2 className="text-2xl md:text-3xl font-heading font-bold text-foreground">
              Core Platform Features
            </h2>
            <p className="text-muted-foreground max-w-2xl">
              Fully active modules designed to assist your academic journey and professional networking.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Experts Card */}
            <div className="relative overflow-hidden rounded-2xl bg-surface border border-border p-8 shadow-[0_2px_12px_rgba(91,95,239,0.06),0_1px_2px_rgba(91,95,239,0.04)] before:absolute before:top-0 before:left-0 before:right-0 before:h-[3px] before:bg-gradient-to-r before:from-primary before:to-secondary hover:-translate-y-1 transition-all duration-200">
              <div className="flex items-center justify-between mb-6">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                  <Users className="w-6 h-6" />
                </div>
                <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-xs font-medium border border-emerald-500/20">
                  Live
                </span>
              </div>

              <h3 className="text-xl font-heading font-semibold mb-3 text-foreground">
                Experts & Portfolios Directory
              </h3>
              <p className="text-muted-foreground mb-6 leading-relaxed">
                Connect with student and alumni specialists tagged by tech stacks (Web Development, Machine Learning, Systems, Cybersecurity). View structured portfolio sections, GitHub stats, and connect directly.
              </p>

              <div className="flex items-center justify-between pt-4 border-t border-border/60">
                <span className="text-xs text-muted-foreground font-medium">Guest & User Access</span>
                <Link
                  href="/experts"
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:text-primary-hover"
                >
                  <span>View Experts</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>

            {/* Question Bank Card */}
            <div className="relative overflow-hidden rounded-2xl bg-surface border border-border p-8 shadow-[0_2px_12px_rgba(91,95,239,0.06),0_1px_2px_rgba(91,95,239,0.04)] before:absolute before:top-0 before:left-0 before:right-0 before:h-[3px] before:bg-gradient-to-r before:from-primary before:to-secondary hover:-translate-y-1 transition-all duration-200">
              <div className="flex items-center justify-between mb-6">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                  <FileText className="w-6 h-6" />
                </div>
                <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-xs font-medium border border-emerald-500/20">
                  Live
                </span>
              </div>

              <h3 className="text-xl font-heading font-semibold mb-3 text-foreground">
                Verified Question Bank
              </h3>
              <p className="text-muted-foreground mb-6 leading-relaxed">
                Access past semester exams, midterms, finals, and quizzes categorized by course code, batch, and semester. Download high-resolution question papers individually or bundle them as ZIP archives.
              </p>

              <div className="flex items-center justify-between pt-4 border-t border-border/60">
                <span className="text-xs text-muted-foreground font-medium">Full-text search & filters</span>
                <Link
                  href="/question-bank"
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:text-primary-hover"
                >
                  <span>Browse Question Bank</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Coming Soon Section */}
      <section className="py-16 border-t border-border/60">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="space-y-3 mb-12">
            <div className="inline-block px-3 py-1 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs font-semibold uppercase tracking-wider">
              Roadmap & Upcoming
            </div>
            <h2 className="text-2xl md:text-3xl font-heading font-bold text-foreground">
              Coming Soon
            </h2>
            <p className="text-muted-foreground max-w-2xl">
              We are actively developing these specialized modules to further expand the portal&apos;s capabilities.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Faculty Directory */}
            <div className="relative overflow-hidden rounded-2xl bg-surface/60 border border-border/80 p-6 opacity-90">
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-600 dark:text-amber-400">
                  <GraduationCap className="w-5 h-5" />
                </div>
                <span className="px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-400 text-xs font-medium border border-amber-500/20">
                  Coming Soon
                </span>
              </div>

              <h3 className="text-lg font-heading font-semibold mb-2 text-foreground">
                Faculty Directory
              </h3>
              <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
                Comprehensive directory of departmental faculty members, research interests, office hours, consultation schedules, and publication links.
              </p>

              <div className="pt-3 border-t border-border/60 flex items-center justify-between text-xs text-muted-foreground">
                <span>Route: /faculty</span>
                <span className="font-medium text-amber-600 dark:text-amber-400">In Development</span>
              </div>
            </div>

            {/* Student Clubs */}
            <div className="relative overflow-hidden rounded-2xl bg-surface/60 border border-border/80 p-6 opacity-90">
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-600 dark:text-amber-400">
                  <Building2 className="w-5 h-5" />
                </div>
                <span className="px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-400 text-xs font-medium border border-amber-500/20">
                  Coming Soon
                </span>
              </div>

              <h3 className="text-lg font-heading font-semibold mb-2 text-foreground">
                Student Clubs & Societies
              </h3>
              <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
                Hub for coding clubs, AI research circles, competitive programming squads, robotics teams, and leadership rosters.
              </p>

              <div className="pt-3 border-t border-border/60 flex items-center justify-between text-xs text-muted-foreground">
                <span>Route: /clubs</span>
                <span className="font-medium text-amber-600 dark:text-amber-400">In Development</span>
              </div>
            </div>

            {/* Campus Events */}
            <div className="relative overflow-hidden rounded-2xl bg-surface/60 border border-border/80 p-6 opacity-90">
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-600 dark:text-amber-400">
                  <Calendar className="w-5 h-5" />
                </div>
                <span className="px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-400 text-xs font-medium border border-amber-500/20">
                  Coming Soon
                </span>
              </div>

              <h3 className="text-lg font-heading font-semibold mb-2 text-foreground">
                Events & Workshops
              </h3>
              <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
                Stay updated with departmental hackathons, tech fests, guest lectures, submission deadlines, and campus seminars.
              </p>

              <div className="pt-3 border-t border-border/60 flex items-center justify-between text-xs text-muted-foreground">
                <span>Route: /events</span>
                <span className="font-medium text-amber-600 dark:text-amber-400">In Development</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer Callout */}
      <section className="py-16 border-t border-border/60 bg-surface/20 text-center">
        <div className="container mx-auto px-4 max-w-4xl space-y-4">
          <h3 className="text-xl font-heading font-semibold text-foreground">
            Are you a CSE Student or Alumni?
          </h3>
          <p className="text-muted-foreground max-w-xl mx-auto text-sm">
            Log in to build your professional portfolio, contribute past exam questions to the question bank, and connect with peers.
          </p>
          <div className="pt-2 flex items-center justify-center gap-3">
            <Link
              href="/login"
              className="px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary-hover transition-all"
            >
              Sign In
            </Link>
            <Link
              href="/register"
              className="px-5 py-2.5 rounded-xl bg-surface border border-border text-foreground text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-all"
            >
              Create Account
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
