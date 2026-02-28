import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowUpRight, ArrowDownRight, Minus, Target, Lightbulb, DollarSign, Brain, CheckCircle, Radar } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

interface PricingChange {
  type: string;
  tier: string;
  old_price?: number;
  current_price?: number;
  percent_change?: number;
}

interface ReportData {
  competitor?: { name: string; url: string };
  classification: string;
  last_scan_time: string;
  delta?: { changes?: PricingChange[] };
  insight?: string;
}

const subTabs = [
  { id: "pricing", label: "Pricing", icon: DollarSign },
  { id: "strategic", label: "Strategic Analysis", icon: Brain },
  { id: "recommendations", label: "Recommendations", icon: CheckCircle },
] as const;

type SubTabId = (typeof subTabs)[number]["id"];

const badgeStyles: Record<string, string> = {
  Critical: "border-destructive/30 bg-destructive/10 text-destructive glow-badge-critical",
  Warning: "border-warning/30 bg-warning/10 text-warning glow-badge-warning",
  Info: "border-primary/30 bg-primary/10 text-primary",
  Stable: "border-success/30 bg-success/10 text-success glow-badge-stable"
};

const PricingPanel = ({ report }: { report: ReportData }) => {
  const changes = report.delta?.changes || [];

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-border/50 bg-card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border/50">
              <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground">Tier</th>
              <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground">Previous</th>
              <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground">Current</th>
              <th className="text-right px-5 py-3 text-xs font-medium text-muted-foreground">Change</th>
            </tr>
          </thead>
          <tbody>
            {changes.length > 0 ? (
              changes.map((row, i) => (
                <tr key={i} className="border-b border-border/30 last:border-0 hover:bg-muted/20 transition-colors">
                  <td className="px-5 py-3 font-medium text-foreground">{row.tier}</td>
                  <td className="px-5 py-3 text-muted-foreground">{row.old_price ? `$${row.old_price}` : '-'}</td>
                  <td className="px-5 py-3 text-foreground">{row.current_price ? `$${row.current_price}` : '-'}</td>
                  <td className="px-5 py-3 text-right">
                    {row.type === 'increased' || row.type === 'added' ? (
                      <span className="inline-flex items-center gap-0.5 text-warning text-sm font-medium">
                        <ArrowUpRight className="h-3 w-3" />+{row.percent_change?.toFixed(1) || 0}%
                      </span>
                    ) : row.type === 'decreased' ? (
                      <span className="inline-flex items-center gap-0.5 text-success text-sm font-medium">
                        <ArrowDownRight className="h-3 w-3" />-{row.percent_change?.toFixed(1) || 0}%
                      </span>
                    ) : row.type === 'removed' ? (
                      <span className="inline-flex items-center gap-0.5 text-destructive text-sm font-medium">
                        <Minus className="h-3 w-3" />Removed
                      </span>
                    ) : (
                      <span className="text-muted-foreground text-sm">No change</span>
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4} className="px-5 py-6 text-center text-muted-foreground text-sm">
                  No pricing changes detected.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const StrategicPanel = ({ report }: { report: ReportData }) => (
  <div className="space-y-4">
    <div className="rounded-xl border border-primary/20 bg-card p-6 glow-primary">
      <div className="flex items-start gap-3">
        <Lightbulb className="h-5 w-5 text-primary mt-0.5 shrink-0" />
        <div className="space-y-3">
          <p className="text-sm text-foreground leading-relaxed">
            {report.insight || "No strategic insights generated. Run a scan to generate AI-powered intelligence."}
          </p>
        </div>
      </div>
    </div>
  </div>
);

const RecommendationsPanel = ({ report }: { report: ReportData }) => {
  const hasChanges = (report.delta?.changes?.length || 0) > 0;
  const classification = report.classification;

  // Generate dynamic recommendations based on report data
  const recommendations = [];

  if (classification === 'Critical' || classification === 'Warning') {
    recommendations.push({
      priority: "Critical",
      text: `Review your pricing strategy in response to ${report.competitor?.name || 'competitor'}'s recent changes.`,
      color: "text-destructive"
    });
  }

  if (hasChanges) {
    recommendations.push({
      priority: "High",
      text: "Analyze the pricing delta and consider adjustments to maintain competitive positioning.",
      color: "text-warning"
    });
  }

  recommendations.push({
    priority: "Medium",
    text: "Continue monitoring for follow-up changes in the next 2-4 weeks.",
    color: "text-primary"
  });

  recommendations.push({
    priority: "Low",
    text: "Document findings and share with relevant stakeholders.",
    color: "text-muted-foreground"
  });

  return (
    <div className="rounded-xl border border-border/50 bg-card p-5">
      <ul className="space-y-4">
        {recommendations.map((action, i) => (
          <li key={i} className="flex items-start gap-3">
            <Target className="h-4 w-4 text-primary mt-0.5 shrink-0" />
            <div>
              <span className={`text-[10px] font-semibold uppercase tracking-wider ${action.color}`}>{action.priority}</span>
              <p className="text-sm text-foreground mt-0.5">{action.text}</p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

const ReportsTab = () => {
  const [activeSubTab, setActiveSubTab] = useState<SubTabId>("pricing");

  const { data: response, isLoading, isError } = useQuery({
    queryKey: ['latestReport'],
    queryFn: () => api.getLatestReport(),
    retry: false
  });

  const report = response?.data as ReportData | undefined;

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-8 w-8 rounded-full border-4 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  if (isError || !report) {
    return (
      <div className="flex flex-col items-center justify-center h-full px-6">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl border border-border/50 bg-muted/50">
          <Radar className="h-7 w-7 text-muted-foreground" />
        </div>
        <h2 className="text-xl font-semibold text-foreground">No Report Found</h2>
        <p className="text-sm text-muted-foreground mt-2 max-w-sm text-center">
          Run a scan from the dashboard to generate intelligence.
        </p>
      </div>
    );
  }

  const badgeClass = badgeStyles[report.classification] || badgeStyles.Info;

  const panels: Record<SubTabId, React.ReactNode> = {
    pricing: <PricingPanel report={report} />,
    strategic: <StrategicPanel report={report} />,
    recommendations: <RecommendationsPanel report={report} />,
  };

  return (
    <div className="p-6 lg:p-8 max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-foreground">
            Reports — {report.competitor?.name || "Unknown Competitor"}
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Last scanned: {new Date(report.last_scan_time).toLocaleString()}
          </p>
        </div>
        <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium w-fit ${badgeClass}`}>
          <span className="h-1.5 w-1.5 rounded-full bg-current animate-pulse" />
          {report.classification}
        </span>
      </div>

      {/* Sub-tabs */}
      <div className="flex items-center gap-1 rounded-lg bg-muted/50 p-1 w-fit">
        {subTabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveSubTab(tab.id)}
            className={`relative flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all ${
              activeSubTab === tab.id
                ? "text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {activeSubTab === tab.id && (
              <motion.div
                layoutId="reports-subtab"
                className="absolute inset-0 rounded-md bg-card border border-border/50"
                transition={{ type: "spring", stiffness: 350, damping: 30 }}
              />
            )}
            <tab.icon className="h-3.5 w-3.5 relative z-10" />
            <span className="relative z-10 hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeSubTab}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.2 }}
        >
          {panels[activeSubTab]}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default ReportsTab;
