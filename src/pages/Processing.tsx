import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Globe, Bot, DollarSign, GitCompare, Brain, Check, AlertCircle, Sparkles } from "lucide-react";
import { api } from "@/lib/api";
import { toast } from "sonner";

// Step definitions with conditional visibility
interface Step {
  id: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  activeLabel?: string;
  conditional?: boolean; // Only shown if ActionBook is used
}

const allSteps: Step[] = [
  { 
    id: "fetchingHomepage",
    icon: Globe, 
    label: "Fetching homepage",
    activeLabel: "Accessing competitor homepage…"
  },
  { 
    id: "agentNavigating",
    icon: Bot, 
    label: "Agent navigating to pricing",
    activeLabel: "🤖 Agent autonomously finding pricing page…",
    conditional: true // Only shown if ActionBook is triggered
  },
  { 
    id: "extractingPricing",
    icon: DollarSign, 
    label: "Extracting pricing",
    activeLabel: "Parsing pricing structure…"
  },
  { 
    id: "computingDelta",
    icon: GitCompare, 
    label: "Computing delta",
    activeLabel: "Comparing with previous snapshot…"
  },
  { 
    id: "generatingInsight",
    icon: Brain, 
    label: "Generating insight",
    activeLabel: "AI analyzing competitive changes…"
  },
  { 
    id: "complete",
    icon: Sparkles, 
    label: "Complete",
    activeLabel: "Analysis complete!"
  }
];

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
}

const Processing = () => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [showAgentStep, setShowAgentStep] = useState(false);
  const [scanComplete, setScanComplete] = useState(false);
  const [scanMeta, setScanMeta] = useState<ScanMeta | null>(null);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const hasFetchedRef = useRef(false);
  const stepTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Get visible steps based on whether ActionBook was used
  const visibleSteps = allSteps.filter(step => !step.conditional || showAgentStep);
  const currentStep = visibleSteps[currentStepIndex];

  // Advance to next step with timing
  const advanceStep = () => {
    setCurrentStepIndex(prev => {
      const maxIndex = visibleSteps.length - 1;
      if (prev < maxIndex) return prev + 1;
      return prev;
    });
  };

  useEffect(() => {
    if (hasFetchedRef.current) return;
    hasFetchedRef.current = true;

    let isMounted = true;

    const performScan = async () => {
      try {
        // Start with first step active immediately
        setCurrentStepIndex(0);
        
        // Advance through initial steps with timing
        // This provides visual feedback while API processes
        const advanceInterval = setInterval(() => {
          if (isMounted && !scanComplete) {
            setCurrentStepIndex(prev => {
              // Don't advance past "extractingPricing" until we know about ActionBook
              const maxPreloadIndex = showAgentStep ? 2 : 1;
              if (prev < maxPreloadIndex) return prev + 1;
              return prev;
            });
          }
        }, 2000);

        // Make the actual API call
        const res = await api.runScan();
        
        if (isMounted) {
          clearInterval(advanceInterval);
          
          const meta = res?.scanMeta as ScanMeta | undefined;
          
          if (meta) {
            setScanMeta(meta);
            
            // If ActionBook was used, show the agent step
            if (meta.actionBookUsed) {
              setShowAgentStep(true);
            }
            
            // Rapid completion animation
            const completeAllSteps = () => {
              const finalSteps = allSteps.filter(s => !s.conditional || meta.actionBookUsed);
              let idx = 0;
              
              const rapidAdvance = setInterval(() => {
                if (idx < finalSteps.length) {
                  setCurrentStepIndex(idx);
                  idx++;
                } else {
                  clearInterval(rapidAdvance);
                  setScanComplete(true);
                  
                  // Navigate after brief completion display
                  setTimeout(() => {
                    if (!res?.hasSignificantChange && !res?.isFirstRun) {
                      toast.info("Scan completed: No changes detected.");
                      navigate("/dashboard");
                    } else {
                      navigate("/report");
                    }
                  }, 800);
                }
              }, 300);
            };
            
            completeAllSteps();
          } else {
            // Fallback if no meta - just complete
            setScanComplete(true);
            setCurrentStepIndex(visibleSteps.length - 1);
            
            setTimeout(() => {
              if (!res?.hasSignificantChange && !res?.isFirstRun) {
                toast.info("Scan completed: No changes detected.");
                navigate("/dashboard");
              } else {
                navigate("/report");
              }
            }, 800);
          }
        }
      } catch (error: unknown) {
        const err = error as Error;
        if (isMounted) {
          setError(err.message || "Scan failure");
          toast.error(err.message || "Failed to scan competitor");
        }
      }
    };

    performScan();

    return () => {
      isMounted = false;
      if (stepTimerRef.current) {
        clearTimeout(stepTimerRef.current);
      }
    };
  }, [navigate, showAgentStep, visibleSteps.length, scanComplete]);

  return (
    <div className="min-h-screen gradient-hero flex items-center justify-center relative">
      <div className="pointer-events-none absolute inset-0 grid-bg opacity-15" />

      {/* Glow orb */}
      <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[400px] w-[400px] rounded-full bg-primary/10 blur-3xl animate-pulse-glow" />

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="relative z-10 w-full max-w-md px-6"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 mb-4"
          >
            {showAgentStep ? (
              <>
                <Bot className="h-4 w-4 text-primary" />
                <span className="text-xs font-medium text-primary">Agent Active</span>
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 text-primary" />
                <span className="text-xs font-medium text-primary">Intelligent Scan</span>
              </>
            )}
          </motion.div>
          
          <h2 className="text-xl font-semibold text-foreground">
            {error ? "Analysis Failed" : scanComplete ? "Analysis Complete" : "Analyzing Competitor"}
          </h2>
          <p className="text-sm mt-1">
            {error ? (
              <span className="text-destructive">{error}</span>
            ) : scanComplete ? (
              <span className="text-success">Redirecting to results…</span>
            ) : currentStep?.activeLabel ? (
              <span className="text-muted-foreground">{currentStep.activeLabel}</span>
            ) : (
              <span className="text-muted-foreground">Processing…</span>
            )}
          </p>
          {error && (
            <button 
              onClick={() => navigate("/dashboard")} 
              className="mt-4 text-xs font-medium text-primary hover:underline"
            >
              Return to Dashboard →
            </button>
          )}
        </div>

        {/* Steps */}
        <div className="space-y-3">
          <AnimatePresence mode="popLayout">
            {visibleSteps.map((step, i) => {
              const StepIcon = step.icon;
              const isActive = i === currentStepIndex && !scanComplete;
              const isComplete = i < currentStepIndex || scanComplete;
              const isAgentStep = step.id === "agentNavigating";

              return (
                <motion.div
                  key={step.id}
                  initial={{ opacity: 0, y: -10, height: 0 }}
                  animate={{ opacity: 1, y: 0, height: "auto" }}
                  exit={{ opacity: 0, y: -10, height: 0 }}
                  transition={{ duration: 0.3, delay: i * 0.05 }}
                  className={`flex items-center gap-3 rounded-xl border px-4 py-3 transition-all duration-500 ${
                    error
                      ? "border-destructive/30 bg-destructive/5"
                      : isActive
                        ? isAgentStep
                          ? "border-amber-500/50 bg-amber-500/10 shadow-lg shadow-amber-500/10"
                          : "border-primary/50 bg-primary/5 shadow-lg shadow-primary/10"
                        : isComplete
                          ? "border-border/30 bg-success/5"
                          : "border-border/20 bg-transparent"
                  }`}
                >
                  {/* Icon container */}
                  <div
                    className={`flex h-9 w-9 items-center justify-center rounded-lg transition-all duration-500 ${
                      error
                        ? "bg-destructive/20 text-destructive"
                        : isActive
                          ? isAgentStep
                            ? "bg-amber-500/20 text-amber-500"
                            : "bg-primary/20 text-primary"
                          : isComplete
                            ? "bg-success/20 text-success"
                            : "bg-muted/50 text-muted-foreground"
                    }`}
                  >
                    <AnimatePresence mode="wait">
                      {error ? (
                        <motion.div
                          key="error"
                          initial={{ scale: 0, rotate: -180 }}
                          animate={{ scale: 1, rotate: 0 }}
                          transition={{ type: "spring", stiffness: 300 }}
                        >
                          <AlertCircle className="h-4 w-4" />
                        </motion.div>
                      ) : isComplete ? (
                        <motion.div
                          key="check"
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ type: "spring", stiffness: 400, damping: 15 }}
                        >
                          <Check className="h-4 w-4" />
                        </motion.div>
                      ) : (
                        <motion.div
                          key="icon"
                          animate={isActive ? { scale: [1, 1.1, 1] } : {}}
                          transition={{ repeat: Infinity, duration: 1.5 }}
                        >
                          <StepIcon className={`h-4 w-4 ${isActive && !error ? "animate-pulse" : ""}`} />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Label */}
                  <div className="flex-1">
                    <span
                      className={`text-sm font-medium transition-colors duration-500 ${
                        isActive
                          ? isAgentStep
                            ? "text-amber-500"
                            : "text-foreground"
                          : isComplete
                            ? "text-muted-foreground"
                            : "text-muted-foreground/50"
                      }`}
                    >
                      {step.label}
                    </span>
                    
                    {/* Agent step extra info */}
                    {isAgentStep && isActive && (
                      <motion.p
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-xs text-amber-500/70 mt-0.5"
                      >
                        Autonomously finding pricing page…
                      </motion.p>
                    )}
                  </div>

                  {/* Active indicator */}
                  {isActive && !error && (
                    <motion.div
                      className={`h-2 w-2 rounded-full ${isAgentStep ? "bg-amber-500" : "bg-primary"}`}
                      animate={{ scale: [1, 1.3, 1], opacity: [1, 0.7, 1] }}
                      transition={{ repeat: Infinity, duration: 1 }}
                    />
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        {/* Scan metadata footer */}
        {scanMeta && scanComplete && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 px-4 py-3 rounded-lg bg-muted/30 border border-border/30"
          >
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>
                {scanMeta.tiersFound} tier{scanMeta.tiersFound !== 1 ? "s" : ""} found
              </span>
              <span>
                {scanMeta.actionBookUsed ? "Agent-assisted" : "Direct scan"}
              </span>
              <span>
                {(scanMeta.durationMs / 1000).toFixed(1)}s
              </span>
            </div>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
};

export default Processing;
