"use client";

import { useState } from "react";
import type { User } from "@supabase/supabase-js";
import { Button } from "@/app/shared/ui/button";
import { Input } from "@/app/shared/ui/input";
import { supabase } from "@/app/shared/api/supabase";
import { useStore } from "@/app/store";
import { type SidebarProfileFormValues } from "@/app/widgets/sidebar/model/sidebar.model";

interface SidebarAccountModalProps {
  user: User | null;
  initialProfileValues: SidebarProfileFormValues;
  onClose: () => void;
  onSaveProfile: (values: SidebarProfileFormValues) => void | Promise<void>;
}

export default function SidebarAccountModal({
  user,
  initialProfileValues,
  onClose,
  onSaveProfile,
}: SidebarAccountModalProps) {
  const passwordRecovery = useStore((s) => s.passwordRecovery);
  const setPasswordRecovery = useStore((s) => s.setPasswordRecovery);

  const [tab, setTab] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState(user?.email ?? "");
  const [password, setPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [name, setName] = useState(initialProfileValues.name);
  const [company, setCompany] = useState(initialProfileValues.company);
  const [homebase, setHomebase] = useState(initialProfileValues.homebase);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);

  const inputClassName =
    "h-9 border-border bg-bg-input text-text-primary placeholder:text-text-muted";

  async function handleSignIn() {
    if (!email || !password) {
      setError("Enter email and password.");
      return;
    }
    setLoading(true);
    setError("");
    setMessage("");
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (signInError) {
      setError(signInError.message);
      return;
    }
    onClose();
  }

  async function handleSignUp() {
    if (!name.trim()) {
      setError("Enter your name.");
      return;
    }
    if (!email || !password) {
      setError("Enter email and password.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);
    setError("");
    setMessage("");
    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name, company } },
    });
    setLoading(false);

    if (signUpError) {
      setError(signUpError.message);
      return;
    }
    setMessage("Check your email to confirm your account.");
  }

  async function handleForgotPassword() {
    if (!email) {
      setError("Enter your email first.");
      return;
    }
    setLoading(true);
    setError("");
    setMessage("");
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email);
    setLoading(false);
    if (resetError) {
      setError(resetError.message);
      return;
    }
    setMessage("Password reset email sent. Check your inbox.");
  }

  async function handleSetNewPassword() {
    if (!newPassword) {
      setError("Enter a new password.");
      return;
    }
    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords don't match.");
      return;
    }
    setLoading(true);
    setError("");
    setMessage("");
    const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });
    setLoading(false);
    if (updateError) {
      setError(updateError.message);
      return;
    }
    setPasswordRecovery(false);
    setShowChangePassword(false);
    setNewPassword("");
    setConfirmPassword("");
    setMessage("Password updated successfully.");
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    setPasswordRecovery(false);
    onClose();
  }

  async function handleProfileSave() {
    await onSaveProfile({ name, company, homebase });
    setMessage("Profile saved.");
    setError("");
  }

  // Password recovery flow — user clicked reset link in email
  if (passwordRecovery) {
    return (
      <>
        <div className="fixed inset-0 z-[70] bg-black/40" />
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 pointer-events-none">
          <div
            className="pointer-events-auto w-full max-w-sm rounded-2xl border border-border bg-bg-card p-0 text-text-primary shadow-gw-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-2 border-b border-border px-5 py-4">
              <h2 className="text-base font-bold text-text-primary">Set New Password</h2>
            </div>
            <div className="flex flex-col gap-3 px-5 py-5">
              <p className="text-sm text-text-secondary">
                Enter your new password below.
              </p>
              <Input
                aria-label="New password"
                placeholder="New password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className={inputClassName}
              />
              <Input
                aria-label="Confirm password"
                placeholder="Confirm password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") void handleSetNewPassword();
                }}
                className={inputClassName}
              />
              {error && <div className="text-xs font-medium text-gw-red">{error}</div>}
              {message && <div className="text-xs font-medium text-gw-green">{message}</div>}
              <Button
                type="button"
                disabled={loading}
                onClick={() => void handleSetNewPassword()}
                className="w-full bg-orange text-white hover:bg-orange-hover disabled:bg-orange/60"
              >
                {loading ? "Updating..." : "Update Password"}
              </Button>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[70] bg-black/40"
        onClick={onClose}
      />
      {/* Modal card */}
      <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 pointer-events-none">
        <div
          className="pointer-events-auto w-full max-w-sm rounded-2xl border border-border bg-bg-card p-0 text-text-primary shadow-gw-lg"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between gap-2 border-b border-border px-5 py-4">
            <h2 className="text-base font-bold text-text-primary">
              {user ? "Account" : "Welcome"}
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-md text-text-secondary transition-colors hover:text-text-primary"
              aria-label="Close account modal"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          {/* Body */}
          <div className="flex flex-col gap-3 px-5 py-5">
            {user ? (
              showChangePassword ? (
                <>
                  <p className="text-sm text-text-secondary">Enter your new password.</p>
                  <Input
                    aria-label="New password"
                    placeholder="New password"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className={inputClassName}
                  />
                  <Input
                    aria-label="Confirm password"
                    placeholder="Confirm password"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") void handleSetNewPassword();
                    }}
                    className={inputClassName}
                  />
                  {error && <div className="text-xs font-medium text-gw-red">{error}</div>}
                  {message && <div className="text-xs font-medium text-gw-green">{message}</div>}
                  <div className="mt-1 flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setShowChangePassword(false);
                        setNewPassword("");
                        setConfirmPassword("");
                        setError("");
                        setMessage("");
                      }}
                      className="flex-1 border-border text-text-secondary"
                    >
                      Back
                    </Button>
                    <Button
                      type="button"
                      disabled={loading}
                      onClick={() => void handleSetNewPassword()}
                      className="flex-1 bg-orange text-white hover:bg-orange-hover disabled:bg-orange/60"
                    >
                      {loading ? "Updating..." : "Update Password"}
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <Input
                    aria-label="Your name"
                    placeholder="Your name"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    className={inputClassName}
                  />
                  <Input
                    aria-label="Company"
                    placeholder="Company"
                    value={company}
                    onChange={(event) => setCompany(event.target.value)}
                    className={inputClassName}
                  />
                  <Input
                    aria-label="Home base address"
                    placeholder="Home base address"
                    value={homebase}
                    onChange={(event) => setHomebase(event.target.value)}
                    className={inputClassName}
                  />
                  {message && <div className="text-xs font-medium text-gw-green">{message}</div>}
                  <div className="mt-1 flex gap-2">
                    <Button
                      type="button"
                      onClick={() => void handleProfileSave()}
                      className="flex-1 bg-orange text-white hover:bg-orange-hover"
                    >
                      Save Profile
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowChangePassword(true)}
                      className="flex-1 border-border text-text-secondary"
                    >
                      Change Password
                    </Button>
                  </div>
                  <Button type="button" variant="destructive" onClick={() => void handleSignOut()} className="w-full">
                    Sign Out
                  </Button>
                </>
              )
            ) : (
              <>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    type="button"
                    variant={tab === "signin" ? "default" : "outline"}
                    onClick={() => {
                      setTab("signin");
                      setError("");
                      setMessage("");
                    }}
                    className={
                      tab === "signin"
                        ? "bg-orange text-white hover:bg-orange-hover"
                        : "border-border bg-bg-input text-text-secondary hover:bg-bg-card hover:text-text-primary"
                    }
                  >
                    Sign In
                  </Button>
                  <Button
                    type="button"
                    variant={tab === "signup" ? "default" : "outline"}
                    onClick={() => {
                      setTab("signup");
                      setError("");
                      setMessage("");
                    }}
                    className={
                      tab === "signup"
                        ? "bg-orange text-white hover:bg-orange-hover"
                        : "border-border bg-bg-input text-text-secondary hover:bg-bg-card hover:text-text-primary"
                    }
                  >
                    Create Account
                  </Button>
                </div>

                {tab === "signup" && (
                  <>
                    <Input
                      aria-label="Your name"
                      placeholder="Your name"
                      value={name}
                      onChange={(event) => setName(event.target.value)}
                      className={inputClassName}
                    />
                    <Input
                      aria-label="Company optional"
                      placeholder="Company (optional)"
                      value={company}
                      onChange={(event) => setCompany(event.target.value)}
                      className={inputClassName}
                    />
                  </>
                )}

                <Input
                  aria-label="Email"
                  placeholder="Email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className={inputClassName}
                />
                <Input
                  aria-label="Password"
                  placeholder="Password"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      if (tab === "signin") {
                        void handleSignIn();
                      } else {
                        void handleSignUp();
                      }
                    }
                  }}
                  className={inputClassName}
                />

                {error && <div className="text-xs font-medium text-gw-red">{error}</div>}
                {message && <div className="text-xs font-medium text-gw-green">{message}</div>}

                <Button
                  type="button"
                  disabled={loading}
                  onClick={() => {
                    if (tab === "signin") {
                      void handleSignIn();
                    } else {
                      void handleSignUp();
                    }
                  }}
                  className="w-full bg-orange text-white hover:bg-orange-hover disabled:bg-orange/60"
                >
                  {loading ? "Working..." : tab === "signin" ? "Sign In" : "Create Account"}
                </Button>

                {tab === "signin" && (
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => void handleForgotPassword()}
                    className="text-sm text-text-secondary hover:text-orange"
                  >
                    Forgot password?
                  </Button>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
