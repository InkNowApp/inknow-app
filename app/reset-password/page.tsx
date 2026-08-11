"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let _supabase: SupabaseClient | null = null;
function getSupabase(): SupabaseClient {
  if (!_supabase) {
    _supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
  }
  return _supabase;
}

const CheckCircleIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="48"
    height="48"
    viewBox="0 0 24 24"
    fill="none"
    stroke="#F5F5F5"
    strokeWidth="1"
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{ marginBottom: "1.5rem" }}
  >
    <circle cx="12" cy="12" r="10" />
    <polyline points="9 12 11 14 15 10" />
  </svg>
);

function ResetPasswordInner() {
  const searchParams = useSearchParams();
  const [appState, setAppState] = useState<"loading" | "invalid" | "form" | "success">("loading");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const handleTokenExchange = async () => {
      try {
        const code = searchParams.get("code");

        const hashParams = new URLSearchParams(
          window.location.hash.replace("#", "")
        );
        const accessToken = hashParams.get("access_token");
        const refreshToken = hashParams.get("refresh_token");

        if (code) {
          const { error } = await getSupabase().auth.exchangeCodeForSession(code);
          if (error) throw error;
          setAppState("form");
        } else if (accessToken && refreshToken) {
          const { error } = await getSupabase().auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
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
  }, [searchParams]);

  const validatePassword = (): string | null => {
    if (newPassword.length < 8) return "Password does not meet requirements.";
    if (!/[A-Z]/.test(newPassword)) return "Password does not meet requirements.";
    if (!/[a-z]/.test(newPassword)) return "Password does not meet requirements.";
    if (!/\d/.test(newPassword)) return "Password does not meet requirements.";
    if (!/[^A-Za-z0-9]/.test(newPassword)) return "Password does not meet requirements.";
    if (newPassword !== confirmPassword) return "Passwords do not match.";
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const validationError = validatePassword();
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsSubmitting(true);
    try {
      const { error: updateError } = await getSupabase().auth.updateUser({
        password: newPassword,
      });
      if (updateError) throw updateError;
      await getSupabase().auth.signOut();
      setAppState("success");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "An unexpected error occurred.";
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const Logo = () => (
    <div style={{ display: "flex", justifyContent: "center", marginBottom: "3rem" }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/inknow-logo.png"
        alt="InkNow"
        style={{ height: "9rem", width: "auto", objectFit: "contain" }}
        draggable={false}
      />
    </div>
  );

  if (appState === "loading") {
    return (
      <div style={styles.page}>
        <Logo />
        <div style={styles.pulse} />
      </div>
    );
  }

  if (appState === "invalid") {
    return (
      <div style={styles.page}>
        <Logo />
        <p style={styles.mutedText}>Invalid or expired reset link.</p>
      </div>
    );
  }

  if (appState === "success") {
    return (
      <div style={styles.page} data-testid="success-screen">
        <div style={styles.card}>
          <Logo />
          <CheckCircleIcon />
          <h2 style={styles.title}>Password Updated</h2>
          <p style={{ ...styles.mutedText, marginBottom: "2.5rem" }}>
            You can now sign in with your new password.
          </p>
          <button
            onClick={() => (window.location.href = "https://getinknow.com")}
            data-testid="button-go-to-inknow"
            style={styles.button}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.textDecoration = "underline";
              (e.currentTarget as HTMLButtonElement).style.textDecorationColor = "#D4AF37";
              (e.currentTarget as HTMLButtonElement).style.textDecorationThickness = "2px";
              (e.currentTarget as HTMLButtonElement).style.textUnderlineOffset = "6px";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.textDecoration = "none";
            }}
          >
            Go to InkNow
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <Logo />

        <div style={{ textAlign: "center", marginBottom: "2.5rem" }}>
          <h2 style={styles.title}>Reset Your Password</h2>
          <p style={styles.mutedText}>
            Create a new password to get back into your account.
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            <input
              type="password"
              placeholder="New Password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              data-testid="input-new-password"
              required
              style={styles.input}
              onFocus={(e) => ((e.currentTarget as HTMLInputElement).style.boxShadow = "0 0 0 1px rgba(212,175,55,0.5)")}
              onBlur={(e) => ((e.currentTarget as HTMLInputElement).style.boxShadow = "none")}
            />
            <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem", padding: "0 0.25rem" }}>
              <p style={{ ...styles.requirement, color: newPassword.length >= 8 ? "rgba(245,245,245,0.5)" : "#666" }}>
                • 8+ characters
              </p>
              <p style={{ ...styles.requirement, color: (/[A-Z]/.test(newPassword) && /[a-z]/.test(newPassword)) ? "rgba(245,245,245,0.5)" : "#666" }}>
                • One uppercase letter, lowercase letters
              </p>
              <p style={{ ...styles.requirement, color: (/\d/.test(newPassword) && /[^A-Za-z0-9]/.test(newPassword)) ? "rgba(245,245,245,0.5)" : "#666" }}>
                • One number and one symbol
              </p>
            </div>
          </div>

          <input
            type="password"
            placeholder="Confirm Password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            data-testid="input-confirm-password"
            required
            style={styles.input}
            onFocus={(e) => ((e.currentTarget as HTMLInputElement).style.boxShadow = "0 0 0 1px rgba(212,175,55,0.5)")}
            onBlur={(e) => ((e.currentTarget as HTMLInputElement).style.boxShadow = "none")}
          />

          {error && (
            <p data-testid="error-message" style={styles.errorText}>
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            data-testid="button-submit"
            style={{ ...styles.button, opacity: isSubmitting ? 0.5 : 1, marginTop: "0.5rem" }}
            onMouseEnter={(e) => {
              if (!isSubmitting) {
                (e.currentTarget as HTMLButtonElement).style.textDecoration = "underline";
                (e.currentTarget as HTMLButtonElement).style.textDecorationColor = "#D4AF37";
                (e.currentTarget as HTMLButtonElement).style.textDecorationThickness = "2px";
                (e.currentTarget as HTMLButtonElement).style.textUnderlineOffset = "6px";
              }
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.textDecoration = "none";
            }}
          >
            {isSubmitting ? "Updating..." : "Update Password"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div style={styles.page}>
        <div style={styles.pulse} />
      </div>
    }>
      <ResetPasswordInner />
    </Suspense>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    backgroundColor: "#000000",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "1.5rem",
    fontFamily: "'Inter', sans-serif",
  },
  card: {
    width: "100%",
    maxWidth: "24rem",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  },
  title: {
    fontSize: "1.25rem",
    color: "#F5F5F5",
    fontWeight: 300,
    letterSpacing: "0.05em",
    marginBottom: "0.5rem",
  },
  mutedText: {
    color: "#666666",
    fontSize: "0.875rem",
    fontWeight: 300,
    textAlign: "center",
  },
  input: {
    width: "100%",
    backgroundColor: "#111111",
    color: "#F5F5F5",
    padding: "1rem",
    fontSize: "0.875rem",
    outline: "none",
    border: "none",
    boxSizing: "border-box",
    transition: "box-shadow 0.15s ease",
  },
  button: {
    width: "100%",
    backgroundColor: "#F5F5F5",
    color: "#000000",
    padding: "1rem",
    fontSize: "0.875rem",
    textTransform: "uppercase",
    letterSpacing: "0.15em",
    fontWeight: 500,
    border: "none",
    cursor: "pointer",
    transition: "all 0.15s ease",
  },
  errorText: {
    color: "#ef4444",
    fontSize: "0.75rem",
    fontWeight: 500,
    letterSpacing: "0.025em",
    textAlign: "center",
    margin: 0,
  },
  requirement: {
    fontSize: "0.75rem",
    fontWeight: 300,
    letterSpacing: "0.025em",
    transition: "color 0.2s ease",
    margin: 0,
  },
  pulse: {
    width: "1rem",
    height: "1rem",
    borderRadius: "9999px",
    backgroundColor: "#F5F5F5",
    opacity: 0.5,
    animation: "pulse 1.5s ease-in-out infinite",
  },
};
