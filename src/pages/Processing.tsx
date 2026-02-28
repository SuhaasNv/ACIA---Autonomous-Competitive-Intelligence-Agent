import { useEffect, useState, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Globe, DollarSign, Layers, Brain, Check, AlertCircle } from "lucide-react";
import { api } from "@/lib/api";
import { toast } from "sonner";

const steps = [
  { icon: Globe, label: "Accessing Website…", duration: 2000 },
  { icon: DollarSign, label: "Extracting Pricing Structure…", duration: 2500 },
  { icon: Layers, label: "Detecting Feature Changes…", duration: 2000 },
  { icon: Brain, label: "Generating Strategic Insight…", duration: 2500 },
];

const Processing = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  const hasFetchedRef = useRef(false);

  useEffect(() => {
    if (hasFetchedRef.current) return;
    hasFetchedRef.current = true;

    let isMounted = true;

    // Artificial timing for UI engagement, advancing every 1.5s
    // Will stall on last step until API resolves
    const uiInterval = setInterval(() => {
      setCurrentStep(prev => {
        if (prev < steps.length - 1) return prev + 1;
        return prev;
      });
    }, 1500);

    const performScan = async () => {
      try {
        const res = await api.runScan();
        if (isMounted) {
          clearInterval(uiInterval);
          setCurrentStep(steps.length); // complete all visually

          if (!res.data?.hasSignificantChange && !res.data?.isFirstRun) {
            toast.info("Scan completed: No changes detected.");
            setTimeout(() => navigate("/dashboard"), 800);
          } else {
            setTimeout(() => navigate("/report"), 800);
          }
        }
      } catch (error: unknown) {
        const err = error as Error;
        if (isMounted) {
          clearInterval(uiInterval);
          setError(err.message || "Scrape failure");
          toast.error(err.message || "Failed to scan competitor");
        }
      }
    };

    performScan();

    return () => {
      isMounted = false;
      clearInterval(uiInterval);
    };
  }, [navigate]);

  return (
    <div className="min-h-screen gradient-hero flex items-center justify-center relative">
      <div className="pointer-events-none absolute inset-0 grid-bg opacity-15" />

      {/* Glow orb */}
      <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[400px] w-[400px] rounded-full bg-primary/10 blur-3xl animate-pulse-glow" />

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="relative z-10 w-full max-w-sm px-6"
      >
        <div className="text-center mb-10">
          <h2 className="text-xl font-semibold text-foreground">
            {error ? "Analysis Failed" : "Analyzing Competitor"}
          </h2>
          <p className="text-sm text-destructive mt-1">
            {error ? error : <span className="text-muted-foreground">This will take a moment…</span>}
          </p>
          {error && (
            <button onClick={() => navigate("/dashboard")} className="mt-4 text-xs font-medium text-primary hover:underline">
              Return to Dashboard →
            </button>
          )}
        </div>

        <div className="space-y-4">
          {steps.map((step, i) => {
            const StepIcon = step.icon;
            const isActive = i === currentStep;
            const isComplete = i < currentStep;

            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.15 }}
                className={`flex items-center gap-3 rounded-lg border px-4 py-3 transition-all duration-500 ${isActive
                  ? "border-primary/50 bg-primary/5 glow-primary"
                  : isComplete
                    ? "border-border/30 bg-muted/30"
                    : "border-border/20 bg-transparent"
                  }`}
              >
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-lg transition-colors duration-500 ${error
                    ? "bg-destructive/20 text-destructive"
                    : isActive
                      ? "bg-primary/20 text-primary"
                      : isComplete
                        ? "bg-success/20 text-success"
                        : "bg-muted/50 text-muted-foreground"
                    }`}
                >
                  <AnimatePresence mode="wait">
                    {error ? (
                      <motion.div
                        key="error"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 300 }}
                      >
                        <AlertCircle className="h-4 w-4" />
                      </motion.div>
                    ) : isComplete ? (
                      <motion.div
                        key="check"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 300 }}
                      >
                        <Check className="h-4 w-4" />
                      </motion.div>
                    ) : (
                      <StepIcon className={`h-4 w-4 ${isActive && !error ? "animate-pulse" : ""}`} />
                    )}
                  </AnimatePresence>
                </div>

                <span
                  className={`text-sm font-medium transition-colors duration-500 ${isActive
                    ? "text-foreground"
                    : isComplete
                      ? "text-muted-foreground"
                      : "text-muted-foreground/50"
                    }`}
                >
                  {step.label}
                </span>
              </motion.div>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
};

export default Processing;
