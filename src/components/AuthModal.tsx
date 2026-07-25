import React, { useState } from "react";
import {
  Shield,
  UserCheck,
  Mail,
  Lock,
  User as UserIcon,
  ArrowRight,
  Sparkles,
  AlertCircle,
  X,
  CheckCircle2
} from "lucide-react";
import {
  loginWithGoogle,
  loginWithEmail,
  registerWithEmail,
  loginAsGuest
} from "../lib/firebase";

interface AuthModalProps {
  isOpen: boolean;
  onClose?: () => void;
  canDismiss?: boolean;
}

export function AuthModal({ isOpen, onClose, canDismiss = true }: AuthModalProps) {
  const [mode, setMode] = useState<"signin" | "signup" | "guest">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleGoogleSubmit = async () => {
    setLoading(true);
    setError(null);
    try {
      await loginWithGoogle();
      if (onClose) onClose();
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Google sign-in failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (mode === "signin") {
        if (!email || !password) {
          throw new Error("Please fill in all fields.");
        }
        await loginWithEmail(email, password);
      } else if (mode === "signup") {
        if (!email || !password || !displayName) {
          throw new Error("Please fill in all fields.");
        }
        if (password.length < 6) {
          throw new Error("Password must be at least 6 characters.");
        }
        await registerWithEmail(email, password, displayName);
      }
      if (onClose) onClose();
    } catch (err: any) {
      console.error(err);
      let msg = err.message || "Authentication failed.";
      if (err.code === "auth/invalid-credential" || err.code === "auth/user-not-found") {
        msg = "Invalid email or password.";
      } else if (err.code === "auth/email-already-in-use") {
        msg = "An account with this email already exists.";
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleGuestSubmit = async () => {
    setLoading(true);
    setError(null);
    try {
      await loginAsGuest();
      if (onClose) onClose();
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to enter as guest.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden relative">
        
        {/* Dismiss Button if allowed */}
        {canDismiss && onClose && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        {/* Modal Header */}
        <div className="p-6 bg-slate-50 border-b border-slate-100 text-center relative">
          <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center mx-auto mb-3 shadow-md shadow-indigo-600/20 text-white">
            <Shield className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            ShieldLance Security
          </h2>
          <p className="text-xs font-semibold text-indigo-600 uppercase tracking-wider mt-0.5">
            AI-Powered Freelance Scam Protection
          </p>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-100 bg-slate-50/50 p-1">
          <button
            onClick={() => { setMode("signin"); setError(null); }}
            className={`flex-1 py-2.5 text-xs font-bold rounded-lg transition-all ${
              mode === "signin"
                ? "bg-white text-indigo-600 shadow-sm border border-slate-200"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            Sign In
          </button>
          <button
            onClick={() => { setMode("signup"); setError(null); }}
            className={`flex-1 py-2.5 text-xs font-bold rounded-lg transition-all ${
              mode === "signup"
                ? "bg-white text-indigo-600 shadow-sm border border-slate-200"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            Create Account
          </button>
          <button
            onClick={() => { setMode("guest"); setError(null); }}
            className={`flex-1 py-2.5 text-xs font-bold rounded-lg transition-all ${
              mode === "guest"
                ? "bg-white text-indigo-600 shadow-sm border border-slate-200"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            Guest Access
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {mode === "guest" ? (
            <div className="space-y-4 text-center">
              <div className="p-4 bg-indigo-50/80 border border-indigo-100 rounded-xl text-left space-y-2">
                <div className="flex items-center space-x-2 text-indigo-900 font-bold text-sm">
                  <UserCheck className="w-4 h-4 text-indigo-600" />
                  <span>Instant Guest Session</span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Start scanning job posts, messages, and contracts right away without creating an account.
                </p>
                <div className="text-[11px] text-slate-500 flex items-center space-x-1 pt-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Full access to AI scam analyzer & safety quiz</span>
                </div>
              </div>

              <button
                onClick={handleGuestSubmit}
                disabled={loading}
                className="w-full py-3 px-4 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-sm transition-all shadow-md flex items-center justify-center space-x-2 disabled:opacity-50"
              >
                <span>{loading ? "Entering..." : "Continue as Guest"}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <form onSubmit={handleEmailSubmit} className="space-y-4">
              
              {/* Google OAuth Option */}
              <button
                type="button"
                onClick={handleGoogleSubmit}
                disabled={loading}
                className="w-full py-2.5 px-4 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold rounded-xl text-xs transition-all shadow-sm flex items-center justify-center space-x-2"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                <span>Continue with Google</span>
              </button>

              <div className="relative flex items-center justify-center my-2">
                <div className="border-t border-slate-200 w-full" />
                <span className="bg-white px-3 text-[10px] uppercase font-bold text-slate-400 tracking-wider absolute">
                  or email
                </span>
              </div>

              {mode === "signup" && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Full Name
                  </label>
                  <div className="relative">
                    <UserIcon className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      required
                      placeholder="Jane Doe"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      className="w-full pl-9 pr-4 py-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:border-indigo-600 focus:bg-white text-slate-900"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="email"
                    required
                    placeholder="freelancer@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:border-indigo-600 focus:bg-white text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:border-indigo-600 focus:bg-white text-slate-900"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs transition-all shadow-md shadow-indigo-600/20 flex items-center justify-center space-x-2 disabled:opacity-50"
              >
                <span>
                  {loading
                    ? "Processing..."
                    : mode === "signin"
                    ? "Sign In"
                    : "Create Account"}
                </span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}
        </div>

        {/* Footer info */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 text-center text-[11px] text-slate-500">
          Firebase Auth Protected • End-to-End Encrypted Verification
        </div>
      </div>
    </div>
  );
}
