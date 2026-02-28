import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Plus, Radar } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import AppSidebar from "@/components/AppSidebar";
import AddCompetitorModal from "@/components/AddCompetitorModal";

const Dashboard = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const navigate = useNavigate();

  const handleAddCompetitor = async (data: { name: string; pricingUrl: string }) => {
    const loadingToast = toast.loading("Creating competitor...");
    try {
      await api.createCompetitor(data.name, data.pricingUrl);
      toast.success("Competitor added successfully", { id: loadingToast });
      setModalOpen(false);
      navigate("/processing", { state: data });
    } catch (error: unknown) {
      const err = error as Error;
      toast.error(err.message || "Failed to create competitor", { id: loadingToast });
    }
  };

  return (
    <div className="flex min-h-screen bg-background">
      <AppSidebar />

      <main className="flex-1 relative">
        {/* Grid background */}
        <div className="pointer-events-none absolute inset-0 grid-bg opacity-20" />

        <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-md"
          >
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl border border-border/50 bg-muted/50">
              <Radar className="h-7 w-7 text-muted-foreground" />
            </div>

            <h2 className="text-xl font-semibold text-foreground">No competitors monitored yet.</h2>
            <p className="text-sm text-muted-foreground mt-2">
              Add your first competitor to start receiving intelligence reports.
            </p>

            <button
              onClick={() => setModalOpen(true)}
              className="mt-6 inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-all hover:bg-primary/90 glow-primary"
            >
              <Plus className="h-4 w-4" />
              Add Competitor
            </button>
          </motion.div>
        </div>

        <AddCompetitorModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          onSubmit={handleAddCompetitor}
        />
      </main>
    </div>
  );
};

export default Dashboard;
