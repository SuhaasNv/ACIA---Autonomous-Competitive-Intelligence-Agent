import { motion, AnimatePresence } from "framer-motion";
import { ArrowUpRight, ArrowDownRight, Minus, AlertTriangle, Shield, TrendingUp, Lightbulb, Radar, Play, AlertCircle, Pencil } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useState } from "react";
import AddCompetitorModal from "@/components/AddCompetitorModal";
import EditCompetitorModal from "@/components/EditCompetitorModal";
import { toast } from "sonner";

interface PricingChange {
  type: string;
  tier: string;
  old_price?: number;
  current_price?: number;
  percent_change?: number;
}

const riskColors: Record<string, { badge: string; dot: string }> = {
  High: { badge: "border-destructive/40 bg-destructive/10 text-destructive glow-badge-critical", dot: "bg-destructive animate-pulse" },
  Warning: { badge: "border-warning/40 bg-warning/10 text-warning glow-badge-warning", dot: "bg-warning animate-pulse" },
  Stable: { badge: "border-success/40 bg-success/10 text-success glow-badge-stable", dot: "bg-success" },
  Info: { badge: "border-primary/40 bg-primary/10 text-primary glow-badge-stable", dot: "bg-primary" },
};

const directionIcon = {
  up: <ArrowUpRight className="h-3.5 w-3.5 text-warning" />,
  down: <ArrowDownRight className="h-3.5 w-3.5 text-success" />,
  neutral: <Minus className="h-3.5 w-3.5 text-muted-foreground" />,
};

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
};

const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] as const } },
};

const DashboardTab = () => {
  const navigate = useNavigate();
  const [modalOpen, setModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [isScanning, setIsScanning] = useState(false);

  const { data: compRes, isLoading: isCompLoading, error: compError, refetch: refetchComp } = useQuery({
    queryKey: ['competitor'],
    queryFn: () => api.getCompetitor(),
    retry: false
  });

  const { data: repRes, isLoading: isRepLoading } = useQuery({
    queryKey: ['latestReport'],
    queryFn: () => api.getLatestReport(),
    enabled: !!compRes?.data,
    retry: false
  });

  const competitor = compRes?.data;
  const report = repRes?.data;

  const handleScan = () => {
    setIsScanning(true);
    navigate("/processing");
  };

  const handleCreate = async (data: { name: string; pricingUrl: string }) => {
    const loadingToast = toast.loading("Creating competitor...");
    try {
      await api.createCompetitor(data.name, data.pricingUrl);
      toast.success("Competitor configured", { id: loadingToast });
      setModalOpen(false);
      refetchComp();
      handleScan();
    } catch (error: unknown) {
      const err = error as Error;
      toast.error(err.message || "Failed to create", { id: loadingToast });
    }
  };

  const handleEdit = async (data: { name: string; pricingUrl: string }) => {
    if (!competitor?.id) return;
    const loadingToast = toast.loading("Updating competitor...");
    try {
      await api.updateCompetitor(competitor.id, data.name, data.pricingUrl);
      toast.success("Competitor updated", { id: loadingToast });
      setEditModalOpen(false);
      refetchComp();
    } catch (error: unknown) {
      const err = error as Error;
      toast.error(err.message || "Failed to update", { id: loadingToast });
    }
  };

  if (isCompLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-8 w-8 rounded-full border-4 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  // Handle No Competitor State inline
  if (!competitor || compError) {
    return (
      <div className="flex flex-col items-center justify-center h-full px-6">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl border border-border/50 bg-muted/50">
          <Radar className="h-7 w-7 text-muted-foreground" />
        </div>
        <h2 className="text-xl font-semibold text-foreground">No Competitor Configured</h2>
        <p className="text-sm text-muted-foreground mt-2 max-w-sm text-center">
          Start monitoring a competitor’s pricing changes.
        </p>
        <button
          onClick={() => setModalOpen(true)}
          className="mt-6 inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-all hover:bg-primary/90 glow-primary"
        >
          <Play className="h-4 w-4" />
          Add Competitor
        </button>

        <AddCompetitorModal open={modalOpen} onClose={() => setModalOpen(false)} onSubmit={handleCreate} />
      </div>
    );
  }

  const riskLevel = report ? report.classification : 'Info';
  const riskClass = riskColors[riskLevel] || riskColors.Info;

  // Format miniPricing based on latest report delta
  const isSetup = !!report;
  const hasChanges = isSetup && report.delta?.changes?.length > 0;
  return (
    <div className="p-6 lg:p-8 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Real-time competitive landscape overview</p>
        </div>
        <button
          onClick={handleScan}
          disabled={isScanning}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-all hover:bg-primary/90 glow-primary disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isScanning ? (
            <div className="h-4 w-4 rounded-full border-2 border-primary-foreground border-t-transparent animate-spin" />
          ) : (
            <Play className="h-4 w-4 fill-current" />
          )}
          {isScanning ? "Processing..." : "Scan Now"}
        </button>
      </div>

      {/* Alert banner */}
      <AnimatePresence>
        {!isSetup && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3 rounded-xl border border-primary/20 bg-primary/5 px-4 py-3"
          >
            <AlertCircle className="h-4 w-4 text-primary shrink-0 animate-pulse" />
            <p className="text-sm text-foreground">
              <span className="font-medium">Ready for baseline.</span>
              <span className="text-muted-foreground"> — Run your first scan to establish a pricing baseline for {competitor.name}.</span>
            </p>
          </motion.div>
        )}
        {hasChanges && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3 rounded-xl border border-warning/20 bg-warning/5 px-4 py-3"
          >
            <AlertTriangle className="h-4 w-4 text-warning shrink-0 animate-pulse" />
            <p className="text-sm text-foreground">
              <span className="font-medium">Changes Detected</span>
              <span className="text-muted-foreground"> — {competitor.name} made pricing modifications. </span>
              <Link to="/report" className="text-primary hover:underline font-medium">View Report →</Link>
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Competitor Status Cards */}
      <div>
        <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">Competitor Status</h2>
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="max-w-sm"
        >
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-xl border border-border/50 bg-card p-4 hover:border-border transition-colors group"
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">{competitor.name}</h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setEditModalOpen(true)}
                  className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                  title="Edit competitor"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
                {hasChanges ? directionIcon.up : directionIcon.neutral}
              </div>
            </div>
            <div className="flex items-center gap-2 mb-2">
              <span className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10px] font-medium ${riskClass.badge}`}>
                <span className={`h-1.5 w-1.5 rounded-full ${riskClass.dot}`} />
                {riskLevel}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Last: {report ? new Date(report.last_scan_time).toLocaleDateString() : 'Never'}</span>
              <span className={`font-medium ${hasChanges ? "text-warning" : "text-muted-foreground"}`}>
                {report ? (hasChanges ? 'Delta Active' : 'Stable') : 'Pending'}
              </span>
            </div>
          </motion.div>
        </motion.div>
      </div>

      {/* Bottom row */}
      <div className="grid lg:grid-cols-5 gap-4">
        {/* Mini Pricing Delta */}
        <div className="lg:col-span-3">
          <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">Latest Pricing Delta — {competitor.name}</h2>
          <div className="rounded-xl border border-border/50 bg-card overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/50">
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">Tier</th>
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">Previous</th>
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">Current</th>
                  <th className="text-right px-4 py-2.5 text-xs font-medium text-muted-foreground">Change</th>
                </tr>
              </thead>
              <tbody>
                {isRepLoading ? (
                  <tr><td colSpan={4} className="px-4 py-4 text-center text-xs text-muted-foreground">Loading...</td></tr>
                ) : !isSetup ? (
                  <tr><td colSpan={4} className="px-4 py-4 text-center text-xs text-muted-foreground">No scans completed.</td></tr>
                ) : hasChanges ? (
                  report.delta.changes.map((row: PricingChange, i: number) => (
                    <tr key={i} className="border-b border-border/30 last:border-0 hover:bg-muted/20 transition-colors">
                      <td className="px-4 py-2.5 font-medium text-foreground text-xs">{row.tier}</td>
                      <td className="px-4 py-2.5 text-muted-foreground text-xs">{row.old_price ? `$${row.old_price}` : '-'}</td>
                      <td className="px-4 py-2.5 text-foreground text-xs">{row.current_price ? `$${row.current_price}` : '-'}</td>
                      <td className="px-4 py-2.5 text-right">
                        <span className={`text-xs font-medium ${row.type === 'increased' ? "text-warning" : row.type === 'decreased' ? "text-success" : "text-muted-foreground"}`}>
                          {row.type === 'increased' ? '+' : row.type === 'decreased' ? '-' : ''}{row.percent_change?.toFixed(1) || 0}%
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr><td colSpan={4} className="px-4 py-4 text-center text-xs text-muted-foreground">No recent pricing changes.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Strategic Insight Summary */}
        <div className="lg:col-span-2">
          <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">Strategic Insight</h2>
          <div className="rounded-xl border border-primary/20 bg-card p-4 h-[calc(100%-28px)] flex flex-col glow-primary">
            <div className="flex items-center gap-2 mb-3">
              <Lightbulb className="h-4 w-4 text-primary" />
              <span className="text-xs font-medium text-primary">Key Finding</span>
            </div>
            <p className="text-xs text-foreground leading-relaxed flex-1">
              {isSetup ? (report.insight || "No strategic insight generated.") : "Run your first scan to generate an AI intelligence baseline."}
            </p>
            <div className="flex items-center gap-4 mt-3 pt-3 border-t border-border/30">
              <div className="flex items-center gap-1.5">
                <Shield className="h-3 w-3 text-muted-foreground" />
                <span className="text-[10px] text-muted-foreground">High confidence</span>
              </div>
              <div className="flex items-center gap-1.5">
                <TrendingUp className="h-3 w-3 text-muted-foreground" />
                <span className="text-[10px] text-muted-foreground">Impact: Critical</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <EditCompetitorModal
        open={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        onSubmit={handleEdit}
        competitor={competitor}
      />
    </div>
  );
};

export default DashboardTab;
