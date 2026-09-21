import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { fetchHomeData } from "../api/client";

export default function Home() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [homeMessage, setHomeMessage] = useState("");
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Ask the server for protected data too, not just trusting local state.
  // This proves the Home page's content is actually gated server-side.
  useEffect(() => {
    let cancelled = false;
    fetchHomeData()
      .then((data) => {
        if (!cancelled) setHomeMessage(data.message);
      })
      .catch(() => {
        if (!cancelled) setHomeMessage("");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleLogout() {
    setIsLoggingOut(true);
    try {
      await logout();
      navigate("/login", { replace: true });
    } finally {
      setIsLoggingOut(false);
    }
  }

  return (
    <main className="home-page">
      <div className="home-card">
        <h1>{homeMessage || `Welcome, ${user?.name}!`}</h1>
        <p className="home-subtitle">You're signed in as:</p>
        <p className="user-email">{user?.email}</p>

        <button
          type="button"
          className="logout-button"
          onClick={handleLogout}
          disabled={isLoggingOut}
        >
          {isLoggingOut ? "Logging out…" : "Logout"}
        </button>
      </div>
    </main>
  );
}
