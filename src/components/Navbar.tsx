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
      className={`fixed top-0 left-0 right-0 z-50 border-b transition-colors duration-300 ${
        isLanding
          ? "border-white/5 bg-transparent"
          : "border-border/50 bg-background/80 backdrop-blur-xl"
      }`}
    >
      <div className="mx-auto flex h-14 sm:h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link to="/" className="flex items-center gap-2 -ml-1 p-1" aria-label="Signal home">
          <div className="h-6 w-6 sm:h-7 sm:w-7 rounded-md bg-primary/20 flex items-center justify-center">
            <div className="h-2.5 w-2.5 sm:h-3 sm:w-3 rounded-sm bg-primary" />
          </div>
          <span className={`text-base sm:text-lg font-semibold tracking-tight transition-colors ${isLanding ? "text-white/90" : "text-foreground"}`}>
            Signal
          </span>
        </Link>

        {isLanding && (
          <Link
            to="/register"
            className="rounded-full bg-white/10 hover:bg-white/20 active:bg-white/25 border border-white/15 px-4 sm:px-5 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-white/90 transition-all hover:scale-105 backdrop-blur-sm"
          >
            Start Monitoring
          </Link>
        )}
      </div>
    </motion.nav>
  );
};

export default Navbar;
