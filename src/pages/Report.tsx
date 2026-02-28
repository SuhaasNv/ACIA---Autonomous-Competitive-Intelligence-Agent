import { motion } from "framer-motion";
import { ArrowUpRight, ArrowDownRight, Minus, Lightbulb, Radar, Info, TrendingUp, TrendingDown, PlusCircle, MinusCircle } from "lucide-react";
import AppSidebar from "@/components/AppSidebar";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

const ChangeIndicator = ({ type, percent }: { type: string; percent?: number }) => {
  if (type === 'increased' || type === 'added') {
    return <span className="inline-flex items-center gap-0.5 text-warning text-sm font-medium"><ArrowUpRight className="h-3 w-3" />+{percent?.toFixed(1) || 0}%</span>;
  }
  if (type === 'decreased') {
    return <span className="inline-flex items-center gap-0.5 text-success text-sm font-medium"><ArrowDownRight className="h-3 w-3" />-{percent?.toFixed(1) || 0}%</span>;
  }
  if (type === 'removed') {
    return <span className="inline-flex items-center gap-0.5 text-destructive text-sm font-medium"><Minus className="h-3 w-3" />Removed</span>;
  }
  return <span className="inline-flex items-center gap-0.5 text-muted-foreground text-sm"><Minus className="h-3 w-3" />No change</span>;
};

// ─── Competitive Context Insight ────────────────────────────────────────────

type ChangeType = 'increased' | 'decreased' | 'added' | 'removed' | string;

const contextInsights: Record<string, { icon: React.ComponentType<{ className?: string }>; text: string; color: string }> = {
  increased: {
    icon: TrendingUp,
    text: "Upward pricing shift may indicate strong demand or product maturity.",
    color: "border-warning/20 bg-warning/5 text-warning",
  },
  decreased: {
    icon: TrendingDown,
    text: "Downward pricing pressure may signal a competitive response or market repositioning.",
    color: "border-success/20 bg-success/5 text-success",
  },
  added: {
    icon: PlusCircle,
    text: "New tier introduction suggests market segmentation or a deliberate upsell strategy.",
    color: "border-primary/20 bg-primary/5 text-primary",
  },
  removed: {
    icon: MinusCircle,
    text: "Tier removal may reflect portfolio simplification or forced customer migration.",
    color: "border-destructive/20 bg-destructive/5 text-destructive",
  },
};

function getDominantChangeType(changes: { type: string }[]): ChangeType | null {
  const priority: ChangeType[] = ['increased', 'added', 'removed', 'decreased'];
  for (const p of priority) {
    if (changes.some(c => c.type === p)) return p;
  }
  return null;
}

const ReportPage = () => {
  const { data: response, isLoading, isError } = useQuery({
    queryKey: ['latestReport'],
    queryFn: () => api.getLatestReport(),
  });

  const report = response?.data;

  if (isLoading) {
    return (
      <div className="flex min-h-screen bg-background">
        <AppSidebar />
        <main className="flex-1 overflow-auto flex items-center justify-center">
          <div className="h-8 w-8 rounded-full border-4 border-primary border-t-transparent animate-spin" />
        </main>
      </div>
    );
  }

  if (isError || !report) {
    return (
      <div className="flex min-h-screen bg-background">
        <AppSidebar />
        <main className="flex-1 overflow-auto flex items-center justify-center">
          <div className="text-center">
            <Radar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-lg font-medium text-foreground">No Report Found</h2>
            <p className="text-sm text-muted-foreground">Run a scan from the dashboard to generate intelligence.</p>
          </div>
        </main>
      </div>
    );
  }

  const badgeStyles = {
    Critical: "border-destructive/30 bg-destructive/10 text-destructive",
    Warning: "border-warning/30 bg-warning/10 text-warning",
    Info: "border-primary/30 bg-primary/10 text-primary",
    Stable: "border-success/30 bg-success/10 text-success"
  } as Record<string, string>;

  const badgeClass = badgeStyles[report.classification] || badgeStyles.Info;

  return (
    <div className="flex min-h-screen bg-background">
      <AppSidebar />

      <main className="flex-1 overflow-auto">
        <div className="mx-auto max-w-5xl px-6 py-8 lg:px-10">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-8"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-semibold text-foreground">{report.competitor?.name || "Unknown"}</h1>
                <p className="text-sm text-muted-foreground mt-1">
                  Last scanned: {new Date(report.last_scan_time).toLocaleString()}
                </p>
              </div>
              <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium w-fit ${badgeClass}`}>
                <span className={`h-1.5 w-1.5 rounded-full bg-current`} />
                {report.classification}
              </span>
            </div>
          </motion.div>

          {/* Pricing Delta */}
          <motion.section
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.5 }}
            className="mb-6"
          >
            <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3">Pricing Delta</h2>
            <div className="rounded-xl border border-border/50 bg-card overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/50 bg-muted/20">
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Tier</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Previous</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Current</th>
                    <th className="text-right px-4 py-3 font-medium text-muted-foreground">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {report.delta?.changes?.length > 0 ? (
                    report.delta.changes.map((row: { type: string; tier: string; old_price?: number; current_price?: number; percent_change?: number }, i: number) => (
                      <tr key={i} className="border-b border-border/30 last:border-0 hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-3 font-medium text-foreground">{row.tier}</td>
                        <td className="px-4 py-3 text-muted-foreground">{row.old_price ? `$${row.old_price}` : '-'}</td>
                        <td className="px-4 py-3 text-foreground">{row.current_price ? `$${row.current_price}` : '-'}</td>
                        <td className="px-4 py-3 text-right">
                          <ChangeIndicator type={row.type} percent={row.percent_change} />
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="px-4 py-6 text-center text-muted-foreground text-sm">
                        No pricing changes detected.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </motion.section>

          {/* Competitive Context Insight */}
          {(() => {
            const changes = report.delta?.changes ?? [];
            const dominant = getDominantChangeType(changes);
            const ctx = dominant ? contextInsights[dominant] : null;
            if (!ctx) return null;
            const Icon = ctx.icon;
            return (
              <motion.section
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.5 }}
                className="mb-6"
              >
                <div className={`flex items-start gap-3 rounded-xl border px-4 py-3 ${ctx.color}`}>
                  <Icon className="h-4 w-4 mt-0.5 shrink-0 opacity-80" />
                  <p className="text-sm leading-relaxed">{ctx.text}</p>
                </div>
              </motion.section>
            );
          })()}

          {/* Strategic Insight */}
          <motion.section
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="mb-6"
          >
            <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3">Strategic Insight</h2>
            <div className="rounded-xl border border-primary/20 bg-card p-6 glow-primary">
              <div className="flex items-start gap-3">
                <Lightbulb className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                <p className="text-sm text-foreground leading-relaxed">
                  {report.insight || "No specific insights generated."}
                </p>
              </div>
            </div>
          </motion.section>

          {/* Meta Info */}
          <motion.section
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
          >
            <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/30 w-fit px-3 py-1.5 rounded-lg border border-border/50">
              <Info className="h-3.5 w-3.5" />
              Generated autonomously by Gemini 2.5 Flash
            </div>
          </motion.section>
        </div>
      </main>
    </div>
  );
};

export default ReportPage;
