import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

/**
 * Wrap any route that should require a signed-in user.
 * - While we're still confirming the session with the server, render nothing
 *   (avoids a flash of the protected page or an incorrect redirect).
 * - If there's no valid session, bounce to /login instead of rendering.
 */
export default function ProtectedRoute({ children }) {
  const { isAuthenticated, isChecking } = useAuth();
  const location = useLocation();

  if (isChecking) {
    return <p className="status-message">Checking your session…</p>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return children;
}
