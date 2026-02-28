import { useState } from "react";
import { motion } from "framer-motion";
import Navbar from "@/components/Navbar";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const Register = () => {
  const { signInWithEmail, signUpWithEmail } = useAuth();
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    try {
      setLoading(true);
      setMessage(null);
      if (isSignUp) {
        await signUpWithEmail(email, password);
        setMessage({ type: "success", text: "Check your email to confirm your account." });
      } else {
        await signInWithEmail(email, password);
      }
    } catch (error: unknown) {
      const err = error as { message?: string };
      setMessage({ type: "error", text: err.message || "Authentication failed." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen gradient-hero relative">
      <div className="pointer-events-none absolute inset-0 grid-bg opacity-20" />
      <Navbar />

      <main className="relative z-10 flex min-h-screen items-center justify-center px-6 pt-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-md"
        >
          <div className="text-center mb-8">
            <h1 className="text-2xl font-semibold text-foreground">Get started with Signal</h1>
            <p className="text-sm text-muted-foreground mt-2">Start monitoring your competitive landscape</p>
          </div>

          <div className="rounded-xl border border-border/50 bg-card p-6 glow-primary">
            <form onSubmit={handleEmailAuth} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
                  className="bg-background"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  disabled={loading}
                  className="bg-background"
                />
              </div>
              {message && (
                <p className={`text-sm ${message.type === "error" ? "text-destructive" : "text-green-600"}`}>
                  {message.text}
                </p>
              )}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Loading..." : isSignUp ? "Create account" : "Sign in"}
              </Button>
            </form>

            <button
              type="button"
              onClick={() => { setIsSignUp(!isSignUp); setMessage(null); }}
              className="w-full mt-3 text-sm text-muted-foreground hover:text-foreground"
            >
              {isSignUp ? "Already have an account? Sign in" : "Don't have an account? Sign up"}
            </button>

            <p className="text-xs text-muted-foreground text-center mt-4">
              By continuing, you agree to our Terms of Service.
            </p>
          </div>
        </motion.div>
      </main>
    </div>
  );
};

export default Register;
