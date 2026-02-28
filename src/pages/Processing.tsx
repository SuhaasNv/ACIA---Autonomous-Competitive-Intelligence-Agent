import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Globe, Bot, DollarSign, GitCompare, Brain, Check, 
  Sparkles, Terminal, Zap, Search, Database, FileText, ChevronRight,
  Shield, Target, TrendingUp, TrendingDown, Minus, AlertCircle
} from "lucide-react";
import { api } from "@/lib/api";
import { toast } from "sonner";

// Classification badge styles
const classificationStyles: Record<string, { badge: string; dot: string; icon: React.ComponentType<{ className?: string }> }> = {
  "Aggressive Expansion": { 
    badge: "border-destructive/30 bg-destructive/10 text-destructive", 
    dot: "bg-destructive animate-pulse", 
    icon: TrendingUp 
  },
  "Premium Repositioning": { 
    badge: "border-amber-500/30 bg-amber-500/10 text-amber-500", 
    dot: "bg-amber-500 animate-pulse", 
    icon: TrendingUp 
  },
  "Market Penetration": { 
    badge: "border-emerald-500/30 bg-emerald-500/10 text-emerald-500", 
    dot: "bg-emerald-500 animate-pulse", 
    icon: TrendingDown 
  },
  "Stable": { 
    badge: "border-success/30 bg-success/10 text-success", 
    dot: "bg-success", 
    icon: Minus 
  },
  "Critical": { 
    badge: "border-destructive/30 bg-destructive/10 text-destructive", 
    dot: "bg-destructive animate-pulse", 
    icon: Target 
  },
  "High": { 
    badge: "border-amber-500/30 bg-amber-500/10 text-amber-500", 
    dot: "bg-amber-500 animate-pulse", 
    icon: Target 
  },
  "Low": { 
    badge: "border-success/30 bg-success/10 text-success", 
    dot: "bg-success", 
    icon: Shield 
  }
};

// Step type icons mapping
const stepIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  init: Zap,
  detect: Search,
  fetch: Globe,
  loaded: FileText,
  extract: DollarSign,
  partial: Search,
  search: Search,
  agent: Bot,
  navigate: Bot,
  discover: Search,
  warn: AlertCircle,
  error: AlertCircle,
  fallback: Database,
  pricing: DollarSign,
  compare: GitCompare,
  baseline: Database,
  delta: GitCompare,
  ai: Brain,
  insight: Sparkles,
  save: Database,
  complete: Check
};

interface AgentStep {
  type: string;
  message: string;
  detail?: string | null;
  timestamp: number;
}

interface ScanMeta {
  dataSource: string;
  actionBookUsed: boolean;
  pricingPageUrl: string | null;
  tiersFound: number;
  durationMs: number;
  stages: {
    fetchingHomepage: boolean;
    agentNavigating: boolean | null;
    extractingPricing: boolean;
    computingDelta: boolean;
    generatingInsight: boolean;
  };
  steps: AgentStep[];
  classification?: string;
  confidence?: number;
  impact?: string;
}

// Main stage definitions for the progress indicator
const mainStages = [
  { id: "fetch", label: "Fetching", icon: Globe },
  { id: "agent", label: "Agent", icon: Bot, conditional: true },
  { id: "extract", label: "Extracting", icon: DollarSign },
  { id: "compare", label: "Comparing", icon: GitCompare },
  { id: "insight", label: "Analyzing", icon: Brain },
];

const Processing = () => {
  const [visibleSteps, setVisibleSteps] = useState<AgentStep[]>([]);
  const [currentStageIndex, setCurrentStageIndex] = useState(0);
  const [scanComplete, setScanComplete] = useState(false);
  const [scanMeta, setScanMeta] = useState<ScanMeta | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fatalError, setFatalError] = useState<string | null>(null);
  const [showAgentMode, setShowAgentMode] = useState(false);
  const navigate = useNavigate();
  const hasFetchedRef = useRef(false);
  const stepsContainerRef = useRef<HTMLDivElement>(null);
  const showAgentModeRef = useRef(false);
  const scanCompleteRef = useRef(false);

  // Simulated steps while waiting for API
  const simulatedSteps: AgentStep[] = [
    { type: 'init', message: 'Initializing scan', detail: null, timestamp: 0 },
    { type: 'fetch', message: 'Fetching target page...', detail: null, timestamp: 500 },
  ];

  // Keep refs in sync so the scan effect always reads the latest values
  useEffect(() => {
    showAgentModeRef.current = showAgentMode;
  }, [showAgentMode]);

  useEffect(() => {
    scanCompleteRef.current = scanComplete;
  }, [scanComplete]);

  // Navigate as soon as scan is complete
  useEffect(() => {
    if (!scanComplete) return;
    const timer = setTimeout(() => {
      navigate("/report");
    }, 1200);
    return () => clearTimeout(timer);
  }, [scanComplete, navigate]);

  // Auto-scroll steps container
  useEffect(() => {
    if (stepsContainerRef.current) {
      stepsContainerRef.current.scrollTop = stepsContainerRef.current.scrollHeight;
    }
  }, [visibleSteps]);

  useEffect(() => {
    if (hasFetchedRef.current) return;
    hasFetchedRef.current = true;

    let isMounted = true;
    let stepIndex = 0;

    // Start showing simulated steps
    const showSimulatedSteps = () => {
      try {
        const interval = setInterval(() => {
          if (!isMounted || stepIndex >= simulatedSteps.length) {
            clearInterval(interval);
            return;
          }
          setVisibleSteps(prev => {
            // Safety check to prevent infinite additions
            if (prev.length >= simulatedSteps.length) {
              clearInterval(interval);
              return prev;
            }
            return [...prev, simulatedSteps[stepIndex]];
          });
          stepIndex++;
        }, 800);
        return interval;
      } catch (error) {
        console.error('Error in showSimulatedSteps:', error);
        setFatalError('An error occurred while initializing the scan process.');
        return null;
      }
    };

    // Stage progression while waiting
    const progressStages = () => {
      try {
        const interval = setInterval(() => {
          if (!isMounted || scanCompleteRef.current) {
            clearInterval(interval);
            return;
          }
          setCurrentStageIndex(prev => {
            const maxIndex = showAgentModeRef.current ? 2 : 1;
            if (prev < maxIndex) return prev + 1;
            return prev;
          });
        }, 2500);
        return interval;
      } catch (error) {
        console.error('Error in progressStages:', error);
        setFatalError('An error occurred while tracking scan progress.');
        return null;
      }
    };

    const simInterval = showSimulatedSteps();
    const stageInterval = progressStages();

    const performScan = async () => {
      try {
        const res = await api.runScan();
        
        if (isMounted) {
          if (simInterval) clearInterval(simInterval);
          if (stageInterval) clearInterval(stageInterval);
          
          const meta = res?.scanMeta as ScanMeta | undefined;
          
          if (meta) {
            setScanMeta(meta);
            
            // Check if agent was used
            if (meta.actionBookUsed) {
              setShowAgentMode(true);
            }
            
            // Progressively reveal actual steps
            if (meta.steps && meta.steps.length > 0) {
              setVisibleSteps([]); // Clear simulated steps
              
              let idx = 0;
              const revealInterval = setInterval(() => {
                if (!isMounted) {
                  clearInterval(revealInterval);
                  return;
                }

                if (idx < meta.steps.length) {
                  setVisibleSteps(prev => {
                    // Prevent duplicate additions
                    if (prev.length <= idx) {
                      return [...prev, meta.steps[idx]];
                    }
                    return prev;
                  });
                  
                  // Update stage based on step type
                  const stepType = meta.steps[idx].type;
                  if (['agent', 'navigate', 'discover'].includes(stepType)) {
                    setShowAgentMode(true);
                    setCurrentStageIndex(1);
                  } else if (['extract', 'pricing'].includes(stepType)) {
                    setCurrentStageIndex(showAgentModeRef.current ? 2 : 1);
                  } else if (['compare', 'baseline', 'delta'].includes(stepType)) {
                    setCurrentStageIndex(showAgentModeRef.current ? 3 : 2);
                  } else if (['ai', 'insight'].includes(stepType)) {
                    setCurrentStageIndex(showAgentModeRef.current ? 4 : 3);
                  }
                  
                  idx++;
                } else {
                  clearInterval(revealInterval);
                  scanCompleteRef.current = true;
                  setScanComplete(true);
                  setCurrentStageIndex(mainStages.filter(s => !s.conditional || meta.actionBookUsed).length - 1);
                }
              }, 150); // Fast reveal for completed scan
            } else {
              // No steps in response, complete immediately
              scanCompleteRef.current = true;
              setScanComplete(true);
              setCurrentStageIndex(mainStages.filter(s => !s.conditional || (meta && meta.actionBookUsed)).length - 1);
            }
          } else {
            scanCompleteRef.current = true;
            setScanComplete(true);
          }
        }
      } catch (error: unknown) {
        const err = error as Error;
        if (isMounted) {
          if (simInterval) clearInterval(simInterval);
          if (stageInterval) clearInterval(stageInterval);
          setError(err.message || "Scan failure");
          toast.error(err.message || "Failed to scan competitor");
        }
      }
    };

    performScan().catch(error => {
      console.error('performScan failed:', error);
      if (isMounted) {
        setFatalError('An error occurred while starting the scan.');
      }
    });

    return () => {
      isMounted = false;
      if (simInterval) clearInterval(simInterval);
      if (stageInterval) clearInterval(stageInterval);
    };
  }, [navigate]);

  // Get filtered stages based on agent mode
  const activeStages = mainStages.filter(s => !s.conditional || showAgentMode);

  return (
    <div className="min-h-screen gradient-hero flex items-center justify-center relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 grid-bg opacity-15" />

      {/* Animated background glow */}
      <motion.div 
        className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[500px] w-[500px] rounded-full blur-3xl"
        animate={{
          background: showAgentMode 
            ? ['rgba(245, 158, 11, 0.1)', 'rgba(245, 158, 11, 0.15)', 'rgba(245, 158, 11, 0.1)']
            : ['rgba(59, 130, 246, 0.1)', 'rgba(59, 130, 246, 0.15)', 'rgba(59, 130, 246, 0.1)']
        }}
        transition={{ duration: 2, repeat: Infinity }}
      />

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="relative z-10 w-full max-w-2xl px-6"
      >
        {/* Header with Agent Mode indicator */}
        <div className="text-center mb-6">
          <AnimatePresence mode="wait">
            {showAgentMode ? (
              <motion.div
                key="agent-active"
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 mb-4"
              >
                <Bot className="h-4 w-4 text-amber-500 animate-pulse" />
                <span className="text-xs font-semibold text-amber-500 tracking-wide">
                  AUTONOMOUS WEB AGENT ACTIVE
                </span>
              </motion.div>
            ) : (
              <motion.div
                key="scan-active"
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/30 mb-4"
              >
                <Sparkles className="h-4 w-4 text-primary" />
                <span className="text-xs font-semibold text-primary tracking-wide">
                  INTELLIGENT SCAN
                </span>
              </motion.div>
            )}
          </AnimatePresence>
          
          <h2 className="text-2xl font-semibold text-foreground">
            {error ? "Analysis Failed" : scanComplete ? "Analysis Complete" : "Analyzing Competitor"}
          </h2>
          
          {error && (
            <div className="mt-4">
              <p className="text-sm text-destructive mb-3">{error}</p>
              <button 
                onClick={() => navigate("/dashboard")} 
                className="text-xs font-medium text-primary hover:underline"
              >
                Return to Dashboard →
              </button>
            </div>
          )}
        </div>

        {/* Stage Progress Indicator */}
        {!error && (
          <div className="flex items-center justify-center gap-2 mb-6">
            {activeStages.map((stage, idx) => {
              const StageIcon = stage.icon;
              const isActive = idx === currentStageIndex && !scanComplete;
              const isComplete = idx < currentStageIndex || scanComplete;
              const isAgentStage = stage.id === 'agent';
              
              return (
                <div key={stage.id} className="flex items-center">
                  <motion.div
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-300 ${
                      isComplete
                        ? "bg-success/20 text-success"
                        : isActive
                          ? isAgentStage
                            ? "bg-amber-500/20 text-amber-500 shadow-lg shadow-amber-500/20"
                            : "bg-primary/20 text-primary shadow-lg shadow-primary/20"
                          : "bg-muted/30 text-muted-foreground"
                    }`}
                    animate={isActive ? { scale: [1, 1.05, 1] } : {}}
                    transition={{ repeat: Infinity, duration: 1.5 }}
                  >
                    {isComplete ? (
                      <Check className="h-3 w-3" />
                    ) : (
                      <StageIcon className={`h-3 w-3 ${isActive ? 'animate-pulse' : ''}`} />
                    )}
                    <span className="hidden sm:inline">{stage.label}</span>
                  </motion.div>
                  
                  {idx < activeStages.length - 1 && (
                    <ChevronRight className={`h-4 w-4 mx-1 ${
                      idx < currentStageIndex ? 'text-success' : 'text-muted-foreground/30'
                    }`} />
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Agent Thought Trace Panel */}
        {!error && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-xl border border-border/50 bg-card/80 backdrop-blur-sm overflow-hidden"
          >
            {/* Panel Header */}
            <div className="flex items-center gap-2 px-4 py-3 border-b border-border/30 bg-muted/30">
              <Terminal className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs font-medium text-muted-foreground">Agent Thought Trace</span>
              <div className="flex-1" />
              {!scanComplete && (
                <motion.div
                  className="h-2 w-2 rounded-full bg-primary"
                  animate={{ opacity: [1, 0.3, 1] }}
                  transition={{ repeat: Infinity, duration: 1 }}
                />
              )}
            </div>

            {/* Steps Container */}
            <div 
              ref={stepsContainerRef}
              className="h-[280px] overflow-y-auto p-4 space-y-2 scroll-smooth [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
            >
              <AnimatePresence mode="popLayout">
                {Array.isArray(visibleSteps) && visibleSteps.map((step, idx) => {
                  try {
                    const StepIcon = stepIcons[step.type] || Zap;
                    const isAgentStep = ['agent', 'navigate', 'discover'].includes(step.type);
                    const isErrorStep = ['error', 'warn'].includes(step.type);
                    const isCompleteStep = step.type === 'complete';
                    
                    return (
                      <motion.div
                        key={`${step.type}-${idx}`}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.2 }}
                        className={`flex items-start gap-3 px-3 py-2 rounded-lg ${
                          isCompleteStep
                            ? 'bg-success/10 border border-success/20'
                            : isErrorStep
                              ? 'bg-destructive/10 border border-destructive/20'
                              : isAgentStep
                                ? 'bg-amber-500/10 border border-amber-500/20'
                                : 'bg-muted/30'
                        }`}
                      >
                        <div className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md ${
                          isCompleteStep
                            ? 'bg-success/20 text-success'
                            : isErrorStep
                              ? 'bg-destructive/20 text-destructive'
                              : isAgentStep
                                ? 'bg-amber-500/20 text-amber-500'
                                : 'bg-primary/20 text-primary'
                        }`}>
                          <StepIcon className="h-3.5 w-3.5" />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-medium ${
                            isCompleteStep
                              ? 'text-success'
                              : isErrorStep
                                ? 'text-destructive'
                                : isAgentStep
                                  ? 'text-amber-500'
                                  : 'text-foreground'
                          }`}>
                            {step.message}
                          </p>
                          {step.detail && (
                            <p className="text-xs text-muted-foreground mt-0.5 truncate">
                              {step.detail}
                            </p>
                          )}
                        </div>
                        
                        <span className="text-[10px] text-muted-foreground/60 tabular-nums shrink-0">
                          {(step.timestamp / 1000).toFixed(1)}s
                        </span>
                      </motion.div>
                    );
                  } catch (renderError) {
                    console.error('Error rendering step:', renderError);
                    return null;
                  }
                })}
              </AnimatePresence>
              
              {/* Waiting indicator */}
              {!scanComplete && Array.isArray(visibleSteps) && visibleSteps.length > 0 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-center gap-2 px-3 py-2 text-muted-foreground"
                >
                  <motion.div
                    className="flex gap-1"
                    animate={{ opacity: [0.3, 1, 0.3] }}
                    transition={{ repeat: Infinity, duration: 1.5 }}
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-current" />
                    <span className="h-1.5 w-1.5 rounded-full bg-current" />
                    <span className="h-1.5 w-1.5 rounded-full bg-current" />
                  </motion.div>
                </motion.div>
              )}
            </div>
          </motion.div>
        )}

        {/* Intelligence Summary */}
        {scanMeta && scanComplete && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 space-y-3"
          >
            {/* Strategic Badge */}
            <div className="flex items-center justify-center gap-4">
              {scanMeta.classification && (
                <div className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium">
                  <span className={`h-1.5 w-1.5 rounded-full ${
                    classificationStyles[scanMeta.classification]?.dot || classificationStyles.Stable.dot
                  }`} />
                  {scanMeta.classification}
                </div>
              )}
              
              {scanMeta.confidence != null && (
                <div className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium">
                  <Shield className="h-3 w-3 text-muted-foreground" />
                  {scanMeta.confidence}% confidence
                </div>
              )}
              
              {scanMeta.impact && (
                <div className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium">
                  <Target className="h-3 w-3 text-muted-foreground" />
                  {scanMeta.impact} impact
                </div>
              )}
            </div>
            
            {/* Summary Stats */}
            <div className="flex items-center justify-center gap-6 text-xs text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <DollarSign className="h-3.5 w-3.5" />
                <span>{scanMeta.tiersFound || 0} tier{(scanMeta.tiersFound || 0) !== 1 ? 's' : ''}</span>
              </div>
              <div className="flex items-center gap-1.5">
                {scanMeta.actionBookUsed ? (
                  <>
                    <Bot className="h-3.5 w-3.5 text-amber-500" />
                    <span className="text-amber-500">Agent-assisted</span>
                  </>
                ) : (
                  <>
                    <Globe className="h-3.5 w-3.5" />
                    <span>Direct scan</span>
                  </>
                )}
              </div>
              <div className="flex items-center gap-1.5">
                <Zap className="h-3.5 w-3.5" />
                <span>{(scanMeta.durationMs / 1000).toFixed(1)}s</span>
              </div>
            </div>
          </motion.div>
        )}
      </motion.div>
    </div>
  );

  // Render fatal error state if present
  if (fatalError) {
    return (
      <div className="min-h-screen gradient-hero flex items-center justify-center relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 grid-bg opacity-15" />
        <motion.div 
          className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[500px] w-[500px] rounded-full blur-3xl bg-destructive/10"
        />
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="relative z-10 w-full max-w-md px-6 text-center"
        >
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-destructive/10 border border-destructive/30">
            <AlertCircle className="h-8 w-8 text-destructive" />
          </div>
          <h2 className="text-xl font-semibold text-foreground mb-2">Something went wrong</h2>
          <p className="text-sm text-muted-foreground mb-6">
            {fatalError}
          </p>
          <button 
            onClick={() => navigate("/dashboard")}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
          >
            Return to Dashboard
          </button>
        </motion.div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen gradient-hero flex items-center justify-center relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 grid-bg opacity-15" />

      {/* Animated background glow */}
      <motion.div 
        className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[500px] w-[500px] rounded-full blur-3xl"
        animate={{
          background: showAgentMode 
            ? ['rgba(245, 158, 11, 0.1)', 'rgba(245, 158, 11, 0.15)', 'rgba(245, 158, 11, 0.1)']
            : ['rgba(59, 130, 246, 0.1)', 'rgba(59, 130, 246, 0.15)', 'rgba(59, 130, 246, 0.1)']
        }}
        transition={{ duration: 2, repeat: Infinity }}
      />

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="relative z-10 w-full max-w-2xl px-6"
      >
        {/* Header with Agent Mode indicator */}
        <div className="text-center mb-6">
          <AnimatePresence mode="wait">
            {showAgentMode ? (
              <motion.div
                key="agent-active"
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 mb-4"
              >
                <Bot className="h-4 w-4 text-amber-500 animate-pulse" />
                <span className="text-xs font-semibold text-amber-500 tracking-wide">
                  AUTONOMOUS WEB AGENT ACTIVE
                </span>
              </motion.div>
            ) : (
              <motion.div
                key="scan-active"
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/30 mb-4"
              >
                <Sparkles className="h-4 w-4 text-primary" />
                <span className="text-xs font-semibold text-primary tracking-wide">
                  INTELLIGENT SCAN
                </span>
              </motion.div>
            )}
          </AnimatePresence>
          
          <h2 className="text-2xl font-semibold text-foreground">
            {error ? "Analysis Failed" : scanComplete ? "Analysis Complete" : "Analyzing Competitor"}
          </h2>
          
          {error && (
            <div className="mt-4">
              <p className="text-sm text-destructive mb-3">{error}</p>
              <button 
                onClick={() => navigate("/dashboard")} 
                className="text-xs font-medium text-primary hover:underline"
              >
                Return to Dashboard →
              </button>
            </div>
          )}
        </div>

        {/* Stage Progress Indicator */}
        {!error && (
          <div className="flex items-center justify-center gap-2 mb-6">
            {activeStages.map((stage, idx) => {
              const StageIcon = stage.icon;
              const isActive = idx === currentStageIndex && !scanComplete;
              const isComplete = idx < currentStageIndex || scanComplete;
              const isAgentStage = stage.id === 'agent';
              
              return (
                <div key={stage.id} className="flex items-center">
                  <motion.div
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-300 ${
                      isComplete
                        ? "bg-success/20 text-success"
                        : isActive
                          ? isAgentStage
                            ? "bg-amber-500/20 text-amber-500 shadow-lg shadow-amber-500/20"
                            : "bg-primary/20 text-primary shadow-lg shadow-primary/20"
                          : "bg-muted/30 text-muted-foreground"
                    }`}
                    animate={isActive ? { scale: [1, 1.05, 1] } : {}}
                    transition={{ repeat: Infinity, duration: 1.5 }}
                  >
                    {isComplete ? (
                      <Check className="h-3 w-3" />
                    ) : (
                      <StageIcon className={`h-3 w-3 ${isActive ? 'animate-pulse' : ''}`} />
                    )}
                    <span className="hidden sm:inline">{stage.label}</span>
                  </motion.div>
                  
                  {idx < activeStages.length - 1 && (
                    <ChevronRight className={`h-4 w-4 mx-1 ${
                      idx < currentStageIndex ? 'text-success' : 'text-muted-foreground/30'
                    }`} />
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Agent Thought Trace Panel */}
        {!error && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-xl border border-border/50 bg-card/80 backdrop-blur-sm overflow-hidden"
          >
            {/* Panel Header */}
            <div className="flex items-center gap-2 px-4 py-3 border-b border-border/30 bg-muted/30">
              <Terminal className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs font-medium text-muted-foreground">Agent Thought Trace</span>
              <div className="flex-1" />
              {!scanComplete && (
                <motion.div
                  className="h-2 w-2 rounded-full bg-primary"
                  animate={{ opacity: [1, 0.3, 1] }}
                  transition={{ repeat: Infinity, duration: 1 }}
                />
              )}
            </div>

            {/* Steps Container */}
            <div 
              ref={stepsContainerRef}
              className="h-[280px] overflow-y-auto p-4 space-y-2 scroll-smooth [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
            >
              <AnimatePresence mode="popLayout">
                {Array.isArray(visibleSteps) && visibleSteps.map((step, idx) => {
                  try {
                    const StepIcon = stepIcons[step.type] || Zap;
                    const isAgentStep = ['agent', 'navigate', 'discover'].includes(step.type);
                    const isErrorStep = ['error', 'warn'].includes(step.type);
                    const isCompleteStep = step.type === 'complete';
                    
                    return (
                      <motion.div
                        key={`${step.type}-${idx}`}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.2 }}
                        className={`flex items-start gap-3 px-3 py-2 rounded-lg ${
                          isCompleteStep
                            ? 'bg-success/10 border border-success/20'
                            : isErrorStep
                              ? 'bg-destructive/10 border border-destructive/20'
                              : isAgentStep
                                ? 'bg-amber-500/10 border border-amber-500/20'
                                : 'bg-muted/30'
                        }`}
                      >
                        <div className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md ${
                          isCompleteStep
                            ? 'bg-success/20 text-success'
                            : isErrorStep
                              ? 'bg-destructive/20 text-destructive'
                              : isAgentStep
                                ? 'bg-amber-500/20 text-amber-500'
                                : 'bg-primary/20 text-primary'
                        }`}>
                          <StepIcon className="h-3.5 w-3.5" />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-medium ${
                            isCompleteStep
                              ? 'text-success'
                              : isErrorStep
                                ? 'text-destructive'
                                : isAgentStep
                                  ? 'text-amber-500'
                                  : 'text-foreground'
                          }`}>
                            {step.message}
                          </p>
                          {step.detail && (
                            <p className="text-xs text-muted-foreground mt-0.5 truncate">
                              {step.detail}
                            </p>
                          )}
                        </div>
                        
                        <span className="text-[10px] text-muted-foreground/60 tabular-nums shrink-0">
                          {(step.timestamp / 1000).toFixed(1)}s
                        </span>
                      </motion.div>
                    );
                  } catch (renderError) {
                    console.error('Error rendering step:', renderError);
                    return null;
                  }
                })}
              </AnimatePresence>
              
              {/* Waiting indicator */}
              {!scanComplete && Array.isArray(visibleSteps) && visibleSteps.length > 0 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-center gap-2 px-3 py-2 text-muted-foreground"
                >
                  <motion.div
                    className="flex gap-1"
                    animate={{ opacity: [0.3, 1, 0.3] }}
                    transition={{ repeat: Infinity, duration: 1.5 }}
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-current" />
                    <span className="h-1.5 w-1.5 rounded-full bg-current" />
                    <span className="h-1.5 w-1.5 rounded-full bg-current" />
                  </motion.div>
                </motion.div>
              )}
            </div>
          </motion.div>
        )}

        {/* Intelligence Summary */}
        {scanMeta && scanComplete && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 space-y-3"
          >
            {/* Strategic Badge */}
            <div className="flex items-center justify-center gap-4">
              {scanMeta.classification && (
                <div className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium">
                  <span className={`h-1.5 w-1.5 rounded-full ${
                    classificationStyles[scanMeta.classification]?.dot || classificationStyles.Stable.dot
                  }`} />
                  {scanMeta.classification}
                </div>
              )}
              
              {scanMeta.confidence != null && (
                <div className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium">
                  <Shield className="h-3 w-3 text-muted-foreground" />
                  {scanMeta.confidence}% confidence
                </div>
              )}
              
              {scanMeta.impact && (
                <div className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium">
                  <Target className="h-3 w-3 text-muted-foreground" />
                  {scanMeta.impact} impact
                </div>
              )}
            </div>
            
            {/* Summary Stats */}
            <div className="flex items-center justify-center gap-6 text-xs text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <DollarSign className="h-3.5 w-3.5" />
                <span>{scanMeta.tiersFound || 0} tier{(scanMeta.tiersFound || 0) !== 1 ? 's' : ''}</span>
              </div>
              <div className="flex items-center gap-1.5">
                {scanMeta.actionBookUsed ? (
                  <>
                    <Bot className="h-3.5 w-3.5 text-amber-500" />
                    <span className="text-amber-500">Agent-assisted</span>
                  </>
                ) : (
                  <>
                    <Globe className="h-3.5 w-3.5" />
                    <span>Direct scan</span>
                  </>
                )}
              </div>
              <div className="flex items-center gap-1.5">
                <Zap className="h-3.5 w-3.5" />
                <span>{(scanMeta.durationMs / 1000).toFixed(1)}s</span>
              </div>
            </div>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
};

export default Processing;
