"use client";

import { useState } from "react";
import { supabase } from "@/app/lib/supabase";

interface AuthModalProps {
  onClose: () => void;
}

export default function AuthModal({ onClose }: AuthModalProps) {
  const [tab, setTab] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function handleSignIn() {
    if (!email || !password) { setError("Enter email and password."); return; }
    setLoading(true);
    setError("");
    const { error: err } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (err) { setError(err.message); return; }
    onClose();
  }

  async function handleSignUp() {
    if (!name.trim()) { setError("Enter your name."); return; }
    if (!email || !password) { setError("Enter email and password."); return; }
    if (password.length < 6) { setError("Password must be at least 6 characters."); return; }
    setLoading(true);
    setError("");
    const { error: err } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name, company } },
    });
    setLoading(false);
    if (err) { setError(err.message); return; }
    setMessage("Check your email to confirm your account.");
  }

  async function handleForgotPassword() {
    if (!email) { setError("Enter your email first."); return; }
    setLoading(true);
    setError("");
    const { error: err } = await supabase.auth.resetPasswordForEmail(email);
    setLoading(false);
    if (err) { setError(err.message); return; }
    setMessage("Password reset email sent.");
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div
        className="w-full max-w-sm mx-4 bg-bg-card border border-border rounded-2xl shadow-gw-lg overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-orange rounded-[7px] flex items-center justify-center font-extrabold text-white text-[15px]">
              G
            </div>
            <span className="text-lg font-bold text-text-primary">Groundwork</span>
          </div>
          <button onClick={onClose} className="text-text-muted hover:text-text-primary transition-colors">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border">
          <button
            onClick={() => { setTab("signin"); setError(""); setMessage(""); }}
            className={`flex-1 py-3 text-[11px] font-bold uppercase tracking-wider text-center transition-all duration-200 ${tab === "signin" ? "text-orange border-b-2 border-orange" : "text-text-muted border-b-2 border-transparent"}`}
          >
            Sign In
          </button>
          <button
            onClick={() => { setTab("signup"); setError(""); setMessage(""); }}
            className={`flex-1 py-3 text-[11px] font-bold uppercase tracking-wider text-center transition-all duration-200 ${tab === "signup" ? "text-orange border-b-2 border-orange" : "text-text-muted border-b-2 border-transparent"}`}
          >
            Create Account
          </button>
        </div>

        {/* Form */}
        <div className="px-5 py-5 flex flex-col gap-3">
          {tab === "signup" && (
            <>
              <input
                type="text"
                placeholder="Your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2.5 text-sm rounded-lg border border-border bg-bg-input text-text-primary placeholder:text-text-muted focus:outline-none focus:border-orange"
              />
              <input
                type="text"
                placeholder="Company (optional)"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                className="w-full px-3 py-2.5 text-sm rounded-lg border border-border bg-bg-input text-text-primary placeholder:text-text-muted focus:outline-none focus:border-orange"
              />
            </>
          )}
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2.5 text-sm rounded-lg border border-border bg-bg-input text-text-primary placeholder:text-text-muted focus:outline-none focus:border-orange"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && (tab === "signin" ? handleSignIn() : handleSignUp())}
            className="w-full px-3 py-2.5 text-sm rounded-lg border border-border bg-bg-input text-text-primary placeholder:text-text-muted focus:outline-none focus:border-orange"
          />

          {error && <div className="text-xs text-gw-red font-medium">{error}</div>}
          {message && <div className="text-xs text-gw-green font-medium">{message}</div>}

          <button
            onClick={tab === "signin" ? handleSignIn : handleSignUp}
            disabled={loading}
            className="w-full py-2.5 rounded-lg bg-orange text-white font-bold text-sm transition-all duration-200 hover:bg-orange-hover disabled:opacity-50"
          >
            {loading ? "..." : tab === "signin" ? "Sign In" : "Create Account"}
          </button>

          {tab === "signin" && (
            <button
              onClick={handleForgotPassword}
              className="text-xs text-text-muted hover:text-orange transition-colors text-center"
            >
              Forgot password?
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
