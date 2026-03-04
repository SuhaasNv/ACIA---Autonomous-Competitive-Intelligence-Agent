import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import Navbar from "@/components/Navbar";
import Hero from "@/components/ui/animated-shader-hero";
import {
  Zap,
  GitCompare,
  Globe,
  Brain,
  ShieldCheck,
  BellOff,
  ArrowRight,
  Check,
  TrendingUp,
  TrendingDown,
  ChevronDown,
} from "lucide-react";

function FadeUp({
  children,
  delay = 0,
  className = "",
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.65, delay, ease: [0.16, 1, 0.3, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

const staggerContainer = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1, delayChildren: 0.05 } },
};
const staggerItem = {
  hidden: { opacity: 0, y: 36 },
  show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.16, 1, 0.3, 1] } },
};

const features = [
  {
    icon: Zap,
    title: "Instant Intelligence",
    description:
      "Scan any competitor pricing page and receive structured competitive insights in seconds — not hours of manual research.",
  },
  {
    icon: GitCompare,
    title: "Precision Delta Engine",
    description:
      "A custom diff engine compares JSON snapshots and scores change magnitude. Gemini AI only fires when the delta is ≥ 5%.",
  },
  {
    icon: Globe,
    title: "Anti-Bot Scraping",
    description:
      "Bright Data MCP → residential proxy → direct fetch, with retries and exponential backoff. Signal gets the page even when they fight back.",
  },
  {
    icon: Brain,
    title: "AI Strategic Briefs",
    description:
      "Gemini 2.5 Flash converts raw structural diffs into actionable reports: what changed, why it matters, and how to respond.",
  },
  {
    icon: BellOff,
    title: "Zero Noise",
    description:
      "No background polling. No wasted API calls. You pull the trigger — Signal only invokes AI when something meaningful changed.",
  },
  {
    icon: ShieldCheck,
    title: "Secure by Default",
    description:
      "Supabase Auth with JWT middleware. Row-level security on all data. Rate limiting on all endpoints. Your intel stays yours.",
  },
];

const steps = [
  {
    number: "01",
    title: "Add a competitor",
    description:
      "Paste any pricing page URL. Signal captures the full HTML structure and stores a clean JSON snapshot as your baseline.",
  },
  {
    number: "02",
    title: "Scan on demand",
    description:
      "Hit Scan. The delta engine re-fetches the page, diffs the snapshot, and scores the magnitude of every change.",
  },
  {
    number: "03",
    title: "Get actionable intel",
    description:
      "If a material change is detected, Gemini generates a strategic brief — what shifted, what it signals, and how to respond.",
  },
];

const stats = [
  { value: "< 10s", label: "Per scan" },
  { value: "≥ 5%", label: "Signal threshold" },
  { value: "3-layer", label: "Scraping fallback" },
  { value: "Zero", label: "Background polling" },
];

const poweredBy = [
  { name: "Bright Data", tagline: "Scraping" },
  { name: "Gemini 2.5", tagline: "AI Analysis" },
  { name: "Supabase", tagline: "Auth & DB" },
  { name: "ActionBook", tagline: "Web Agent" },
  { name: "Acontext", tagline: "Memory Layer" },
];

const reportPreview = {
  classification: "AGGRESSIVE EXPANSION",
  classColor: "text-orange-400",
  classBg: "bg-orange-500/10 border-orange-500/20",
  insight:
    "Competitor is repositioning upmarket. Starter price spike (+69%) filters low-value leads; Enterprise discount (-25%) targets land-and-expand. Recommend revisiting your Pro tier positioning within 2 weeks.",
  tiers: [
    { name: "Starter", prev: "$29", curr: "$49", delta: "+69%", dir: "up" },
    { name: "Pro", prev: "$49", curr: "$99", delta: "+102%", dir: "up" },
    { name: "Enterprise", prev: "$199", curr: "$149", delta: "-25%", dir: "down" },
  ],
};

const Landing = () => {
  const navigate = useNavigate();

  return (
    <div className="bg-background">
      <Navbar />

      {/* ─── HERO ─── */}
      <Hero
        trustBadge={{
          text: "Built for SaaS founders tracking competitor pricing strategy.",
          icons: ["⚡"],
        }}
        headline={{
          line1: "Know Every Move",
          line2: "Before It Matters.",
        }}
        subtitle="Signal monitors competitor pricing pages and delivers AI-powered strategic insights whenever a meaningful change is detected — in seconds, not hours."
        buttons={{
          primary: {
            text: "Start Monitoring Free",
            onClick: () => navigate("/register"),
          },
          secondary: {
            text: "See how it works ↓",
            onClick: () =>
              document.getElementById("how-it-works")?.scrollIntoView({ behavior: "smooth" }),
          },
        }}
      />

      {/* Scroll indicator floating over hero bottom */}
      <div className="relative h-0">
        <motion.a
          href="#how-it-works"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2.2, duration: 0.6 }}
          className="absolute -top-14 left-1/2 -translate-x-1/2 text-white/25 hover:text-white/50 transition-colors z-20 hidden sm:block"
          aria-label="Scroll to how it works"
        >
          <motion.div
            animate={{ y: [0, 7, 0] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
          >
            <ChevronDown className="h-6 w-6" />
          </motion.div>
        </motion.a>
      </div>

      {/* ─── STATS BAR ─── */}
      <section className="border-y border-border/30 bg-card/20 py-8 sm:py-10 px-4 sm:px-6">
        <div className="mx-auto max-w-4xl">
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-30px" }}
            className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8"
          >
            {stats.map((stat) => (
              <motion.div key={stat.label} variants={staggerItem} className="text-center">
                <p className="text-xl sm:text-2xl font-black text-foreground">{stat.value}</p>
                <p className="mt-1 text-[10px] sm:text-xs font-medium uppercase tracking-widest text-muted-foreground/60">
                  {stat.label}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ─── POWERED BY ─── */}
      <section className="py-10 sm:py-12 px-4 sm:px-6">
        <div className="mx-auto max-w-4xl">
          <p className="text-center text-[10px] sm:text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground/40 mb-6 sm:mb-8">
            Powered by
          </p>
          <div className="flex items-center justify-center gap-6 sm:gap-10 md:gap-12 flex-wrap">
            {poweredBy.map((p) => (
              <div key={p.name} className="text-center">
                <p className="text-xs sm:text-sm font-semibold text-foreground/70">{p.name}</p>
                <p className="text-[9px] sm:text-[10px] font-medium uppercase tracking-widest text-muted-foreground/40">
                  {p.tagline}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── HOW IT WORKS ─── */}
      <section id="how-it-works" className="py-16 sm:py-20 md:py-28 px-4 sm:px-6">
        <div className="mx-auto max-w-5xl">
          <FadeUp className="text-center mb-10 sm:mb-16">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary mb-3 sm:mb-4">
              The process
            </p>
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-foreground leading-tight">
              From URL to intelligence
              <br />
              <span className="text-gradient">in seconds.</span>
            </h2>
            <p className="mt-4 sm:mt-5 text-sm sm:text-base text-muted-foreground max-w-lg mx-auto leading-relaxed">
              No setup. No integrations. No waiting. Add a URL, hit scan, and Signal handles the rest.
            </p>
          </FadeUp>

          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-40px" }}
            className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6"
          >
            {steps.map((step, i) => (
              <motion.div
                key={step.number}
                variants={staggerItem}
                className="relative rounded-2xl border border-border/60 bg-card/40 p-5 sm:p-7 backdrop-blur-sm overflow-hidden group hover:border-primary/30 transition-colors duration-300"
              >
                <div
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                  style={{
                    background:
                      "radial-gradient(ellipse at top left, hsl(200 85% 55% / 0.06) 0%, transparent 60%)",
                  }}
                />
                <span className="text-4xl sm:text-5xl font-black text-primary/15 leading-none select-none">
                  {step.number}
                </span>
                <h3 className="mt-3 text-base sm:text-lg font-semibold text-foreground">{step.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{step.description}</p>
                {i < steps.length - 1 && (
                  <div className="hidden md:block absolute -right-3 top-1/2 -translate-y-1/2 z-10">
                    <ArrowRight className="h-5 w-5 text-border" />
                  </div>
                )}
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ─── LIVE REPORT PREVIEW ─── */}
      <section className="py-16 sm:py-20 md:py-24 px-4 sm:px-6 relative overflow-hidden">
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 80% 60% at 50% 50%, hsl(200 85% 55% / 0.04) 0%, transparent 70%)",
          }}
        />
        <div className="mx-auto max-w-5xl relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-12 items-center">
            <FadeUp>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary mb-3 sm:mb-4">
                Real output
              </p>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground leading-tight">
                Not a dashboard.
                <br />
                <span className="text-gradient">A decision brief.</span>
              </h2>
              <p className="mt-4 sm:mt-5 text-sm text-muted-foreground leading-relaxed max-w-md">
                Every scan produces a structured intelligence report — per-tier delta scoring, strategic
                classification, and a Gemini-generated analysis telling you exactly what to do next.
              </p>
              <div className="mt-6 sm:mt-8">
                <Link
                  to="/register"
                  className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 sm:px-6 py-2.5 sm:py-3 text-sm font-medium text-primary-foreground transition-all hover:bg-primary/90 glow-primary"
                >
                  Try it on your competitor <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </FadeUp>

            {/* Report Card Mockup */}
            <FadeUp delay={0.15}>
              <div className="rounded-2xl border border-border/60 bg-card/60 p-4 sm:p-6 backdrop-blur-sm font-mono text-xs space-y-3 sm:space-y-4 shadow-2xl overflow-hidden">
                {/* Window chrome */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <div className="h-2.5 w-2.5 rounded-full bg-red-500/80" />
                    <div className="h-2.5 w-2.5 rounded-full bg-yellow-500/80" />
                    <div className="h-2.5 w-2.5 rounded-full bg-green-500/80" />
                  </div>
                  <span className="text-muted-foreground/40 text-[9px] sm:text-[10px] truncate ml-2">
                    signal · latest-report
                  </span>
                </div>

                {/* Classification badge */}
                <div
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border ${reportPreview.classBg}`}
                >
                  <TrendingUp className={`h-3 w-3 sm:h-3.5 sm:w-3.5 ${reportPreview.classColor}`} />
                  <span
                    className={`font-bold text-[10px] sm:text-[11px] tracking-wider ${reportPreview.classColor}`}
                  >
                    {reportPreview.classification}
                  </span>
                </div>

                {/* Tier delta table */}
                <div>
                  <p className="text-muted-foreground/50 text-[9px] sm:text-[10px] uppercase tracking-widest mb-2 sm:mb-3">
                    Pricing Delta
                  </p>
                  {reportPreview.tiers.map((t) => (
                    <div
                      key={t.name}
                      className="flex items-center justify-between py-1.5 sm:py-2 border-b border-border/30 last:border-0"
                    >
                      <span className="text-foreground/70 font-sans text-[11px] sm:text-xs">{t.name}</span>
                      <div className="flex items-center gap-2 sm:gap-3">
                        <span className="text-muted-foreground/50 line-through text-[9px] sm:text-[10px]">
                          {t.prev}
                        </span>
                        <span className="text-foreground font-semibold text-[11px] sm:text-xs">{t.curr}</span>
                        <span
                          className={`flex items-center gap-0.5 font-bold text-[10px] sm:text-[11px] ${
                            t.dir === "up" ? "text-red-400" : "text-green-400"
                          }`}
                        >
                          {t.dir === "up" ? (
                            <TrendingUp className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                          ) : (
                            <TrendingDown className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                          )}
                          {t.delta}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* AI insight */}
                <div className="rounded-xl border border-primary/15 bg-primary/5 p-3 sm:p-4">
                  <div className="flex items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-2">
                    <Brain className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-primary flex-shrink-0" />
                    <span className="text-primary text-[9px] sm:text-[10px] font-semibold uppercase tracking-widest">
                      Gemini Strategic Analysis
                    </span>
                  </div>
                  <p className="text-muted-foreground/80 text-[10px] sm:text-[11px] leading-relaxed font-sans">
                    {reportPreview.insight}
                  </p>
                </div>

                {/* Meta footer */}
                <div className="flex items-center justify-between text-muted-foreground/30 text-[9px] sm:text-[10px]">
                  <span>brightdata · 3 tiers</span>
                  <span>8.3s · Δ 68.7%</span>
                </div>
              </div>
            </FadeUp>
          </div>
        </div>
      </section>

      {/* ─── FEATURES ─── */}
      <section className="py-16 sm:py-20 md:py-28 px-4 sm:px-6 relative overflow-hidden">
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 80% 50% at 50% 0%, hsl(200 85% 55% / 0.04) 0%, transparent 70%)",
          }}
        />
        <div className="mx-auto max-w-5xl relative z-10">
          <FadeUp className="text-center mb-10 sm:mb-16">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary mb-3 sm:mb-4">
              Built different
            </p>
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-foreground leading-tight">
              Everything you need.
              <br />
              <span className="text-gradient">Nothing you don't.</span>
            </h2>
            <p className="mt-4 sm:mt-5 text-sm sm:text-base text-muted-foreground max-w-lg mx-auto leading-relaxed">
              Signal is designed for precision. Every component earns its place.
            </p>
          </FadeUp>

          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-40px" }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5"
          >
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={feature.title}
                  variants={staggerItem}
                  className="group rounded-2xl border border-border/60 bg-card/40 p-5 sm:p-6 backdrop-blur-sm hover:border-primary/30 hover:bg-card/60 transition-all duration-300 cursor-default"
                >
                  <div className="mb-3 sm:mb-4 inline-flex items-center justify-center rounded-xl border border-primary/20 bg-primary/10 p-2.5">
                    <Icon className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                  </div>
                  <h3 className="text-sm sm:text-base font-semibold text-foreground mb-1.5 sm:mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* ─── WHAT YOU GET ─── */}
      <section className="py-16 sm:py-20 px-4 sm:px-6">
        <div className="mx-auto max-w-4xl">
          <div className="rounded-2xl sm:rounded-3xl border border-border/60 bg-card/40 p-6 sm:p-10 lg:p-14 backdrop-blur-sm overflow-hidden relative">
            <div
              className="pointer-events-none absolute inset-0"
              style={{
                background:
                  "radial-gradient(ellipse 70% 60% at 50% 100%, hsl(260 65% 68% / 0.06) 0%, transparent 70%)",
              }}
            />
            <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12 items-center">
              <FadeUp>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary mb-3 sm:mb-4">
                  What you get
                </p>
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground leading-tight">
                  A complete picture of your
                  <br />
                  <span className="text-gradient">competitive landscape.</span>
                </h2>
                <p className="mt-4 sm:mt-5 text-sm text-muted-foreground leading-relaxed">
                  Every scan produces a structured intelligence report — not raw HTML soup. Signal tracks
                  pricing tiers, feature flags, packaging changes, and positioning shifts, all in one place.
                </p>
              </FadeUp>

              <motion.ul
                variants={staggerContainer}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true, margin: "-40px" }}
                className="space-y-3"
              >
                {[
                  "Pricing tier breakdowns with delta scoring",
                  "Feature flag tracking across plans",
                  "AI-generated strategic brief per scan",
                  "Historical snapshot baseline",
                  "Change severity classification (Stable / Aggressive / etc.)",
                  "Zero false positives with the 5% threshold engine",
                ].map((item) => (
                  <motion.li
                    key={item}
                    variants={staggerItem}
                    className="flex items-start gap-2.5 sm:gap-3 text-sm text-muted-foreground"
                  >
                    <div className="mt-0.5 flex-shrink-0 rounded-full bg-primary/15 p-0.5">
                      <Check className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-primary" />
                    </div>
                    {item}
                  </motion.li>
                ))}
              </motion.ul>
            </div>
          </div>
        </div>
      </section>

      {/* ─── WHO IT'S FOR ─── */}
      <section className="py-16 sm:py-20 px-4 sm:px-6">
        <div className="mx-auto max-w-4xl">
          <FadeUp className="text-center mb-8 sm:mb-12">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary mb-3 sm:mb-4">
              Who it's for
            </p>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground leading-tight">
              Built for the teams
              <br />
              <span className="text-gradient">who can't afford surprises.</span>
            </h2>
          </FadeUp>

          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-40px" }}
            className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-5"
          >
            {[
              {
                role: "SaaS Founders",
                icon: "🚀",
                pain: "You hear a competitor repriced from a customer call. Signal would have told you 3 weeks ago.",
              },
              {
                role: "Product Managers",
                icon: "📐",
                pain: "Quarterly pricing reviews are guesswork without a live picture of what the market is doing.",
              },
              {
                role: "Growth Teams",
                icon: "📈",
                pain: "You're running pricing experiments blind. Signal gives you a real-time read on what's working for competitors.",
              },
            ].map((persona) => (
              <motion.div
                key={persona.role}
                variants={staggerItem}
                className="rounded-2xl border border-border/60 bg-card/40 p-5 sm:p-6 backdrop-blur-sm"
              >
                <div className="text-2xl sm:text-3xl mb-2 sm:mb-3">{persona.icon}</div>
                <h3 className="text-sm sm:text-base font-semibold text-foreground mb-1.5 sm:mb-2">
                  {persona.role}
                </h3>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed italic">
                  "{persona.pain}"
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ─── FINAL CTA ─── */}
      <section className="py-20 sm:py-24 md:py-28 px-4 sm:px-6 relative overflow-hidden">
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 60% 70% at 50% 50%, hsl(200 85% 55% / 0.06) 0%, transparent 70%)",
          }}
        />
        <FadeUp className="mx-auto max-w-xl sm:max-w-2xl text-center relative z-10">
          <h2 className="text-2xl sm:text-3xl md:text-5xl font-bold text-foreground leading-tight">
            Stop guessing.
            <br />
            <span className="text-gradient">Start knowing.</span>
          </h2>
          <p className="mt-4 sm:mt-5 text-sm sm:text-base text-muted-foreground leading-relaxed max-w-md mx-auto">
            Add your first competitor in under 30 seconds. Signal handles everything after that.
          </p>
          <div className="mt-8 sm:mt-10 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 px-2 sm:px-0">
            <Link
              to="/register"
              className="w-full sm:w-auto rounded-lg bg-primary px-7 sm:px-8 py-3.5 text-sm font-medium text-primary-foreground transition-all hover:bg-primary/90 glow-primary inline-flex items-center justify-center gap-2 hover:scale-105"
            >
              Get started free <ArrowRight className="h-4 w-4" />
            </Link>
            <a
              href="https://acia-autonomous-competitive-intelli.vercel.app"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
            >
              View live demo <ArrowRight className="h-3.5 w-3.5" />
            </a>
          </div>
          <p className="mt-4 text-xs text-muted-foreground/50">No credit card required. Free to try.</p>
        </FadeUp>
      </section>

      {/* ─── FOOTER ─── */}
      <footer className="border-t border-border/40 py-8 sm:py-10 px-4 sm:px-6">
        <div className="mx-auto max-w-5xl">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-5 sm:gap-6 text-center sm:text-left">
            <div className="flex items-center gap-2">
              <div className="h-6 w-6 sm:h-7 sm:w-7 rounded-md bg-primary/20 flex items-center justify-center">
                <div className="h-2.5 w-2.5 sm:h-3 sm:w-3 rounded-sm bg-primary" />
              </div>
              <span className="text-sm font-semibold text-foreground">Signal — ACIA</span>
            </div>
            <div className="flex items-center gap-5 sm:gap-6 text-xs text-muted-foreground/50">
              <a
                href="https://github.com/SuhaasNv/ACIA---Autonomous-Competitive-Intelligence-Agent"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-muted-foreground transition-colors"
              >
                GitHub
              </a>
              <Link to="/register" className="hover:text-muted-foreground transition-colors">
                Sign Up
              </Link>
              <Link to="/login" className="hover:text-muted-foreground transition-colors">
                Sign In
              </Link>
            </div>
            <p className="text-xs text-muted-foreground/40">© 2026 Signal — ACIA. Built by Suhaas.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
