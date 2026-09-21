import { useState } from "react";
import { GoogleLogin } from "@react-oauth/google";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const { isAuthenticated, isChecking, loginWithGoogleCredential } = useAuth();
  const location = useLocation();
  const [error, setError] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);

  if (isChecking) {
    return <p className="status-message">Checking your session…</p>;
  }

  // Already signed in? Don't show the login page again.
  if (isAuthenticated) {
    return <Navigate to="/home" replace />;
  }

  const cameFromProtectedRoute = Boolean(location.state?.from);

  // credentialResponse.credential is a Google-issued ID token (a JWT).
  // Clicking "Continue with Google" only gets us this token - it does not
  // sign the user in by itself. We still have to hand it to the server,
  // which verifies it with Google before any session is created.
  async function handleSuccess(credentialResponse) {
    setError("");
    setIsVerifying(true);
    try {
      if (!credentialResponse?.credential) {
        throw new Error("Google did not return a credential.");
      }
      await loginWithGoogleCredential(credentialResponse.credential);
      // AuthContext state flips to "authenticated" -> Login re-renders
      // above and redirects to /home.
    } catch (err) {
      setError(err.message || "Sign-in failed. Please try again.");
    } finally {
      setIsVerifying(false);
    }
  }

  function handleError() {
    setError("Google sign-in was cancelled or failed. Please try again.");
  }

  return (
    <main className="auth-page">
      <div className="auth-card">
        <h1>My Auth App</h1>
        <p className="auth-subtitle">Sign in to continue</p>

        {cameFromProtectedRoute && !error && (
          <p className="notice">Please sign in to view that page.</p>
        )}

        {error && <p className="notice notice-error">{error}</p>}

        <div className="google-button-wrapper">
          <GoogleLogin
            onSuccess={handleSuccess}
            onError={handleError}
            useOneTap={false}
          />
        </div>

        {isVerifying && <p className="status-message">Verifying…</p>}
      </div>
    </main>
  );
}
