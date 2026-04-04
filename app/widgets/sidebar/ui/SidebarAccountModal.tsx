"use client";

import { useState } from "react";
import type { User } from "@supabase/supabase-js";
import { Button } from "@/app/shared/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/app/shared/ui/dialog";
import { Input } from "@/app/shared/ui/input";
import { supabase } from "@/app/lib/supabase";
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
  const [tab, setTab] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState(user?.email ?? "");
  const [password, setPassword] = useState("");
  const [name, setName] = useState(initialProfileValues.name);
  const [company, setCompany] = useState(initialProfileValues.company);
  const [homebase, setHomebase] = useState(initialProfileValues.homebase);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

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
    setMessage("Password reset email sent.");
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    onClose();
  }

  async function handleProfileSave() {
    await onSaveProfile({ name, company, homebase });
    setMessage("Profile saved.");
    setError("");
  }

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) {
          onClose();
        }
      }}
    >
      <DialogContent
        showCloseButton={false}
        className="max-w-sm rounded-2xl border border-border bg-bg-card p-0 text-text-primary shadow-gw-lg"
      >
        <DialogHeader className="flex-row items-center justify-between gap-2 border-b border-border px-5 py-4">
          <DialogTitle className="text-base font-bold text-text-primary">
            {user ? "Account" : "Welcome"}
          </DialogTitle>
          <Button
            type="button"
            size="icon-sm"
            variant="ghost"
            aria-label="Close account modal"
            onClick={onClose}
            className="text-text-secondary hover:text-text-primary"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </Button>
        </DialogHeader>

        <div className="flex flex-col gap-3 px-5 py-5">
          {user ? (
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
                <Button type="button" variant="destructive" onClick={() => void handleSignOut()} className="flex-1">
                  Sign Out
                </Button>
              </div>
            </>
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
      </DialogContent>
    </Dialog>
  );
}
