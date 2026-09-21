import { createContext, useCallback, useContext, useEffect, useState } from "react";
import {
  exchangeGoogleCredential,
  fetchCurrentUser,
  logout as logoutRequest,
} from "../api/client";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  // "checking" until we've asked the server whether a session already
  // exists (e.g. after a page refresh). This is what lets ProtectedRoute
  // avoid a false "not authenticated" flash before we actually know.
  const [status, setStatus] = useState("checking");

  useEffect(() => {
    let cancelled = false;

    fetchCurrentUser()
      .then((data) => {
        if (!cancelled) {
          setUser(data.user);
          setStatus("authenticated");
        }
      })
      .catch(() => {
        if (!cancelled) {
          setUser(null);
          setStatus("unauthenticated");
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  // Called with the ID token from Google's "Continue with Google" button.
  // Clicking the button only ever gets us here - it does NOT mark the user
  // as signed in. That only happens once the server has verified the token
  // and confirmed a session was created.
  const loginWithGoogleCredential = useCallback(async (credential) => {
    const data = await exchangeGoogleCredential(credential);
    setUser(data.user);
    setStatus("authenticated");
    return data.user;
  }, []);

  const logout = useCallback(async () => {
    try {
      await logoutRequest();
    } finally {
      setUser(null);
      setStatus("unauthenticated");
    }
  }, []);

  const value = {
    user,
    status,
    isAuthenticated: status === "authenticated" && !!user,
    isChecking: status === "checking",
    loginWithGoogleCredential,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}
