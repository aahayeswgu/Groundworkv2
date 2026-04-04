"use client";

import { useState } from "react";
import type { User } from "@supabase/supabase-js";
import { Button, Input, Surface } from "@heroui/react";
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
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4"
      onClick={onClose}
    >
      <Surface
        variant="default"
        className="w-full max-w-sm rounded-2xl border border-border bg-bg-card shadow-gw-lg"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div className="text-base font-bold text-text-primary">
            {user ? "Account" : "Welcome"}
          </div>
          <Button
            isIconOnly
            size="sm"
            variant="ghost"
            aria-label="Close account modal"
            onPress={onClose}
            className="text-text-secondary hover:text-text-primary"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </Button>
        </div>

        <div className="flex flex-col gap-3 px-5 py-5">
          {user ? (
            <>
              <Input
                aria-label="Your name"
                placeholder="Your name"
                variant="secondary"
                value={name}
                onChange={(event) => setName(event.target.value)}
                fullWidth
              />
              <Input
                aria-label="Company"
                placeholder="Company"
                variant="secondary"
                value={company}
                onChange={(event) => setCompany(event.target.value)}
                fullWidth
              />
              <Input
                aria-label="Home base address"
                placeholder="Home base address"
                variant="secondary"
                value={homebase}
                onChange={(event) => setHomebase(event.target.value)}
                fullWidth
              />
              {message && <div className="text-xs font-medium text-gw-green">{message}</div>}
              <div className="mt-1 flex gap-2">
                <Button onPress={handleProfileSave} className="flex-1">
                  Save Profile
                </Button>
                <Button variant="danger-soft" onPress={handleSignOut} className="flex-1">
                  Sign Out
                </Button>
              </div>
            </>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant={tab === "signin" ? "primary" : "secondary"}
                  onPress={() => {
                    setTab("signin");
                    setError("");
                    setMessage("");
                  }}
                >
                  Sign In
                </Button>
                <Button
                  variant={tab === "signup" ? "primary" : "secondary"}
                  onPress={() => {
                    setTab("signup");
                    setError("");
                    setMessage("");
                  }}
                >
                  Create Account
                </Button>
              </div>

              {tab === "signup" && (
                <>
                  <Input
                    aria-label="Your name"
                    placeholder="Your name"
                    variant="secondary"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    fullWidth
                  />
                  <Input
                    aria-label="Company optional"
                    placeholder="Company (optional)"
                    variant="secondary"
                    value={company}
                    onChange={(event) => setCompany(event.target.value)}
                    fullWidth
                  />
                </>
              )}

              <Input
                aria-label="Email"
                placeholder="Email"
                type="email"
                variant="secondary"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                fullWidth
              />
              <Input
                aria-label="Password"
                placeholder="Password"
                type="password"
                variant="secondary"
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
                fullWidth
              />

              {error && <div className="text-xs font-medium text-gw-red">{error}</div>}
              {message && <div className="text-xs font-medium text-gw-green">{message}</div>}

              <Button
                isPending={loading}
                onPress={tab === "signin" ? handleSignIn : handleSignUp}
                fullWidth
              >
                {tab === "signin" ? "Sign In" : "Create Account"}
              </Button>

              {tab === "signin" && (
                <Button
                  variant="ghost"
                  onPress={handleForgotPassword}
                  className="text-sm text-text-secondary hover:text-orange"
                >
                  Forgot password?
                </Button>
              )}
            </>
          )}
        </div>
      </Surface>
    </div>
  );
}

