import { Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";

const Navbar = () => {
  const location = useLocation();
  const isLanding = location.pathname === "/";

  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl"
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <Link to="/" className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-md bg-primary/20 flex items-center justify-center">
            <div className="h-3 w-3 rounded-sm bg-primary" />
          </div>
          <span className="text-lg font-semibold tracking-tight text-foreground">Signal</span>
        </Link>

        {isLanding && (
          <div className="flex items-center gap-4">
            <Link
              to="/register"
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-all hover:bg-primary/90 glow-primary"
            >
              Start Monitoring
            </Link>
          </div>
        )}
      </div>
    </motion.nav>
  );
};

export default Navbar;
