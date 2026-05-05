"use client";

import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const CheckCircleIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#F5F5F5" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: "1.5rem" }}>
    <circle cx="12" cy="12" r="10" />
    <polyline points="9 12 11 14 15 10" />
  </svg>
);

export default function ResetPassword() {
  const [appState, setAppState] = useState<"loading" | "invalid" | "form" | "success">("loading");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const handleTokenExchange = async () => {
      try {
        const code = new URLSearchParams(window.location.search).get("code");
        const hashParams = new URLSearchParams(window.location.hash.replace("#", ""));
        const accessToken = hashParams.get("access_token");
        const refreshToken = hashParams.get("refresh_token");

        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) throw error;
          setAppState("form");
        } else if (accessToken && refreshToken) {
          const { error } = await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken });
          if (error) throw error;
          setAppState("form");
        } else {
          setAppState("invalid");
        }
      } catch {
        setAppState("invalid");
      }
    };
    handleTokenExchange();
  }, []);

  const validatePassword = (): string | null => {
    if (newPassword.length < 8) return "Password does not meet requirements.";
    if (!/[A-Z]/.test(newPassword)) return "Password does not meet requirements.";
    if (!/\d/.test(newPassword)) return "Password does not meet requirements.";
    if (newPassword !== confirmPassword) return "Passwords do not match.";
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const validationError = validatePassword();
    if (validationError) { setError(validationError); return; }
    setIsSubmitting(true);
    try {
      const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });
      if (updateError) throw updateError;
      await supabase.auth.signOut();
      setAppState("success");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const Logo = () => (
    <div style={{ display: "flex", justifyContent: "center", marginBottom: "3rem" }}>
      <img src="/inknow-logo.png" alt="InkNow" style={{ height: "9rem", width: "auto", objectFit: "contain" }} draggable={false} />
    </div>
  );

  if (appState === "loading") return <div style={s.page}><Logo /><div style={s.pulse} /></div>;
  if (appState === "invalid") return <div style={s.page}><Logo /><p style={s.muted}>Invalid or expired reset link.</p></div>;
  if (appState === "success") return (
    <div style={s.page}>
      <div style={s.card}>
        <Logo />
        <CheckCircleIcon />
        <h2 style={s.title}>Password Updated</h2>
        <p style={{ ...s.muted, marginBottom: "3rem" }}>You can now sign in with your new password.</p>
        <button onClick={() => (window.location.href = "/login")} style={s.button} onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.textDecoration = "underline"; (e.currentTarget as HTMLButtonElement).style.textDecorationColor = "#D4AF37"; }} onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.textDecoration = "none"; }}>Return to Login</button>
      </div>
    </div>
  );

  return (
    <div style={s.page}>
      <div style={s.card}>
        <Logo />
        <div style={{ textAlign: "center", marginBottom: "2.5rem" }}>
          <h2 style={s.title}>Reset Your Password</h2>
          <p style={s.muted}>Create a new password to get back into your account.</p>
        </div>
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            <input type="password" placeholder="New Password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required style={s.input} onFocus={(e) => ((e.currentTarget as HTMLInputElement).style.boxShadow = "0 0 0 1px rgba(212,175,55,0.5)")} onBlur={(e) => ((e.currentTarget as HTMLInputElement).style.boxShadow = "none")} />
            <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem", padding: "0 0.25rem" }}>
              <p style={{ ...s.req, color: newPassword.length >= 8 ? "rgba(245,245,245,0.5)" : "#666" }}>• 8+ characters</p>
              <p style={{ ...s.req, color: /[A-Z]/.test(newPassword) ? "rgba(245,245,245,0.5)" : "#666" }}>• One uppercase letter</p>
              <p style={{ ...s.req, color: /\d/.test(newPassword) ? "rgba(245,245,245,0.5)" : "#666" }}>• One number</p>
            </div>
          </div>
          <input type="password" placeholder="Confirm Password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required style={s.input} onFocus={(e) => ((e.currentTarget as HTMLInputElement).style.boxShadow = "0 0 0 1px rgba(212,175,55,0.5)")} onBlur={(e) => ((e.currentTarget as HTMLInputElement).style.boxShadow = "none")} />
          {error && <p style={s.error}>{error}</p>}
          <button type="submit" disabled={isSubmitting} style={{ ...s.button, opacity: isSubmitting ? 0.5 : 1, marginTop: "0.5rem" }} onMouseEnter={(e) => { if (!isSubmitting) { (e.currentTarget as HTMLButtonElement).style.textDecoration = "underline"; (e.currentTarget as HTMLButtonElement).style.textDecorationColor = "#D4AF37"; } }} onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.textDecoration = "none"; }}>
            {isSubmitting ? "Updating..." : "Update Password"}
          </button>
        </form>
      </div>
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  page: { minHeight: "100vh", backgroundColor: "#000", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "1.5rem", fontFamily: "'Inter', sans-serif" },
  card: { width: "100%", maxWidth: "24rem", display: "flex", flexDirection: "column", alignItems: "center" },
  title: { fontSize: "1.25rem", color: "#F5F5F5", fontWeight: 300, letterSpacing: "0.05em", marginBottom: "0.5rem" },
  muted: { color: "#666", fontSize: "0.875rem", fontWeight: 300, textAlign: "center" },
  input: { width: "100%", backgroundColor: "#111", color: "#F5F5F5", padding: "1rem", fontSize: "0.875rem", outline: "none", border: "none", boxSizing: "border-box", transition: "box-shadow 0.15s ease" },
  button: { width: "100%", backgroundColor: "#F5F5F5", color: "#000", padding: "1rem", fontSize: "0.875rem", textTransform: "uppercase", letterSpacing: "0.15em", fontWeight: 500, border: "none", cursor: "pointer", transition: "all 0.15s ease" },
  error: { color: "#ef4444", fontSize: "0.75rem", fontWeight: 500, textAlign: "center", margin: 0 },
  req: { fontSize: "0.75rem", fontWeight: 300, margin: 0 },
  pulse: { width: "1rem", height: "1rem", borderRadius: "9999px", backgroundColor: "#F5F5F5", opacity: 0.5 },
};