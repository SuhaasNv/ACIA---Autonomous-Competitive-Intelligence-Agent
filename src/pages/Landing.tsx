import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import Navbar from "@/components/Navbar";
import BlobBackground from "@/components/BlobBackground";
import {
  Zap,
  GitCompare,
  Globe,
  Brain,
  ShieldCheck,
  BellOff,
  ChevronDown,
  ArrowRight,
  Check,
} from "lucide-react";

// Reusable fade-up-when-in-view wrapper
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
      initial={{ opacity: 0, y: 48 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.65, delay, ease: [0.16, 1, 0.3, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// Stagger container
const staggerContainer = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.1, delayChildren: 0.05 },
  },
};
const staggerItem = {
  hidden: { opacity: 0, y: 40 },
  show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.16, 1, 0.3, 1] } },
};

const features = [
  {
    icon: Zap,
    title: "Instant Intelligence",
    description:
      "Scan any competitor pricing page and receive structured competitive insights in seconds, not hours.",
  },
  {
    icon: GitCompare,
    title: "Delta Engine",
    description:
      "A custom diff engine compares JSON snapshots and scores change magnitude. AI only fires when the delta ≥ 5%.",
  },
  {
    icon: Globe,
    title: "Anti-Bot Scraping",
    description:
      "Bright Data MCP proxy with direct axios fallback. Signal gets the page — even when they fight back.",
  },
  {
    icon: Brain,
    title: "AI-Powered Briefs",
    description:
      "Gemini 2.5 Flash converts raw structural diffs into strategic reports: what changed, why it matters, what to do.",
  },
  {
    icon: BellOff,
    title: "Zero Noise",
    description:
      "No background polling. No wasted API calls. You pull the trigger — Signal delivers only when something changed.",
  },
  {
    icon: ShieldCheck,
    title: "Secure by Default",
    description:
      "Supabase Auth with JWT middleware. Row-level security on all data. Protected routes everywhere.",
  },
];

const steps = [
  {
    number: "01",
    title: "Add a competitor",
    description:
      "Paste any pricing page URL. Signal captures the full HTML structure and stores a clean JSON snapshot.",
  },
  {
    number: "02",
    title: "Scan on demand",
    description:
      "Hit Scan. The delta engine re-fetches the page, diffs the snapshot, and scores the magnitude of change.",
  },
  {
    number: "03",
    title: "Get actionable intel",
    description:
      "If a material change is detected, Gemini generates a strategic brief — what shifted, what it signals, how to respond.",
  },
];


const Landing = () => {
  return (
    <div className="bg-background">
      {/* ─── HERO ─── */}
      <section className="relative min-h-screen overflow-hidden gradient-hero">
        <BlobBackground />
        <div className="pointer-events-none absolute inset-0 grid-bg opacity-20" />

        <Navbar />

        <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="max-w-3xl"
          >
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="mb-6 inline-flex items-center gap-2 rounded-full border border-border/50 bg-muted/50 px-4 py-1.5 text-xs text-muted-foreground backdrop-blur-sm"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
              Now in Private Beta
            </motion.div>

            <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-6xl lg:text-7xl leading-[1.1]">
              Autonomous Competitive{" "}
              <span className="text-gradient">Intelligence</span>{" "}
              for SaaS Teams.
            </h1>

            <p className="mt-6 text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed">
              Detect strategic pricing and feature shifts before your competitors do.
            </p>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.5 }}
              className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4"
            >
              <Link
                to="/register"
                className="rounded-lg bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition-all hover:bg-primary/90 glow-primary"
              >
                Start Monitoring
              </Link>
              <a
                href="#how-it-works"
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
              >
                See how it works <ArrowRight className="h-3.5 w-3.5" />
              </a>
            </motion.div>

          </motion.div>

          {/* Scroll indicator */}
          <motion.a
            href="#how-it-works"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.4, duration: 0.5 }}
            className="absolute bottom-10 left-1/2 -translate-x-1/2 text-muted-foreground/50 hover:text-muted-foreground transition-colors"
          >
            <motion.div
              animate={{ y: [0, 8, 0] }}
              transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
            >
              <ChevronDown className="h-6 w-6" />
            </motion.div>
          </motion.a>
        </div>
      </section>

      {/* ─── HOW IT WORKS ─── */}
      <section id="how-it-works" className="py-28 px-6">
        <div className="mx-auto max-w-5xl">
          <FadeUp className="text-center mb-16">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary mb-4">
              The process
            </p>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground leading-tight">
              From URL to intelligence
              <br />
              <span className="text-gradient">in seconds.</span>
            </h2>
            <p className="mt-5 text-muted-foreground max-w-lg mx-auto text-base leading-relaxed">
              No setup. No integrations. No waiting. Add a URL, hit scan, and Signal handles the rest.
            </p>
          </FadeUp>

          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-60px" }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6"
          >
            {steps.map((step, i) => (
              <motion.div
                key={step.number}
                variants={staggerItem}
                className="relative rounded-2xl border border-border/60 bg-card/40 p-7 backdrop-blur-sm overflow-hidden group hover:border-primary/30 transition-colors duration-300"
              >
                {/* Subtle glow on hover */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                  style={{ background: "radial-gradient(ellipse at top left, hsl(200 85% 55% / 0.06) 0%, transparent 60%)" }}
                />

                <span className="text-5xl font-black text-primary/15 leading-none select-none">
                  {step.number}
                </span>
                <h3 className="mt-3 text-lg font-semibold text-foreground">{step.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                  {step.description}
                </p>

                {/* Connector arrow (not on last) */}
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

      {/* ─── FEATURES ─── */}
      <section className="py-28 px-6 relative overflow-hidden">
        {/* Subtle background accent */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 80% 50% at 50% 0%, hsl(200 85% 55% / 0.04) 0%, transparent 70%)",
          }}
        />
        <div className="mx-auto max-w-5xl relative z-10">
          <FadeUp className="text-center mb-16">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary mb-4">
              Built different
            </p>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground leading-tight">
              Everything you need.
              <br />
              <span className="text-gradient">Nothing you don't.</span>
            </h2>
            <p className="mt-5 text-muted-foreground max-w-lg mx-auto text-base leading-relaxed">
              Signal is designed for precision. Every component earns its place.
            </p>
          </FadeUp>

          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-60px" }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5"
          >
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={feature.title}
                  variants={staggerItem}
                  className="group rounded-2xl border border-border/60 bg-card/40 p-6 backdrop-blur-sm hover:border-primary/30 hover:bg-card/60 transition-all duration-300 cursor-default"
                >
                  <div className="mb-4 inline-flex items-center justify-center rounded-xl border border-primary/20 bg-primary/10 p-2.5">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="text-base font-semibold text-foreground mb-2">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* ─── WHAT YOU GET ─── */}
      <section className="py-28 px-6">
        <div className="mx-auto max-w-4xl">
          <div className="rounded-3xl border border-border/60 bg-card/40 p-10 sm:p-14 backdrop-blur-sm overflow-hidden relative">
            <div
              className="pointer-events-none absolute inset-0"
              style={{
                background:
                  "radial-gradient(ellipse 70% 60% at 50% 100%, hsl(260 65% 68% / 0.07) 0%, transparent 70%)",
              }}
            />
            <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <FadeUp>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary mb-4">
                  What you get
                </p>
                <h2 className="text-3xl sm:text-4xl font-bold text-foreground leading-tight">
                  A complete picture of your
                  <br />
                  <span className="text-gradient">competitive landscape.</span>
                </h2>
                <p className="mt-5 text-sm text-muted-foreground leading-relaxed">
                  Every scan produces a structured report — not raw HTML soup. Signal tracks pricing
                  tiers, feature flags, packaging changes, and positioning shifts, all in one place.
                </p>
              </FadeUp>

              <motion.ul
                variants={staggerContainer}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true, margin: "-60px" }}
                className="space-y-4"
              >
                {[
                  "Pricing tier breakdowns with delta scoring",
                  "Feature flag tracking across plans",
                  "AI-generated strategic brief per scan",
                  "Historical snapshot timeline",
                  "Change severity classification",
                  "Zero false positives with the delta engine",
                ].map((item) => (
                  <motion.li
                    key={item}
                    variants={staggerItem}
                    className="flex items-start gap-3 text-sm text-muted-foreground"
                  >
                    <div className="mt-0.5 flex-shrink-0 rounded-full bg-primary/15 p-0.5">
                      <Check className="h-3.5 w-3.5 text-primary" />
                    </div>
                    {item}
                  </motion.li>
                ))}
              </motion.ul>
            </div>
          </div>
        </div>
      </section>

      {/* ─── FINAL CTA ─── */}
      <section className="py-28 px-6">
        <FadeUp className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl sm:text-5xl font-bold text-foreground leading-tight">
            Stop guessing.
            <br />
            <span className="text-gradient">Start knowing.</span>
          </h2>
          <p className="mt-5 text-muted-foreground text-base leading-relaxed max-w-md mx-auto">
            Add your first competitor in under 30 seconds. Signal handles everything after that.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/register"
              className="rounded-lg bg-primary px-8 py-3.5 text-sm font-medium text-primary-foreground transition-all hover:bg-primary/90 glow-primary inline-flex items-center gap-2"
            >
              Get started free <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <p className="mt-4 text-xs text-muted-foreground/60">No credit card required.</p>
        </FadeUp>
      </section>

      {/* ─── FOOTER ─── */}
      <footer className="border-t border-border/40 py-8 px-6">
        <div className="mx-auto max-w-5xl flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground/50">
          <span>© 2026 Signal — ACIA. Built by Suhaas.</span>
          <Link to="/register" className="hover:text-muted-foreground transition-colors">
            Register →
          </Link>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
