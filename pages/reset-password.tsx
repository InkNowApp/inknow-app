import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";

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
          const { error } = await supabase.auth.setSession({
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
  }, []);

  const validatePassword = () => {
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
    if (validationError) return setError(validationError);

    setIsSubmitting(true);

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateError) throw updateError;

      await supabase.auth.signOut();
      setAppState("success");
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#000", display: "flex", justifyContent: "center", alignItems: "center", padding: "2rem" }}>
      <div style={{ width: "100%", maxWidth: "24rem", color: "#F5F5F5", fontFamily: "Inter, sans-serif" }}>
        {appState === "loading" && <p>Loading…</p>}
        {appState === "invalid" && <p>Invalid or expired reset link.</p>}
        {appState === "success" && (
          <>
            <h2>Password Updated</h2>
            <p>You can now sign in with your new password.</p>
            <button onClick={() => (window.location.href = "/login")}>Return to Login</button>
          </>
        )}
        {appState === "form" && (
          <form onSubmit={handleSubmit}>
            <input type="password" placeholder="New Password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
            <input type="password" placeholder="Confirm Password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
            {error && <p style={{ color: "red" }}>{error}</p>}
            <button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Updating…" : "Update Password"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
