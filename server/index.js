import "dotenv/config";
import express from "express";
import cors from "cors";
import session from "express-session";
import { OAuth2Client } from "google-auth-library";

const {
  GOOGLE_CLIENT_ID,
  CLIENT_URL = "http://localhost:5173",
  SESSION_SECRET = "dev-secret-change-me",
  PORT = 4000,
} = process.env;

if (!GOOGLE_CLIENT_ID) {
  console.warn(
    "[server] WARNING: GOOGLE_CLIENT_ID is not set. Set it in server/.env " +
      "(it must match the client ID used by the React app)."
  );
}

const oauthClient = new OAuth2Client(GOOGLE_CLIENT_ID);

const app = express();

app.use(cors({ origin: CLIENT_URL, credentials: true }));
app.use(express.json());

app.use(
  session({
    name: "sid",
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true, // not readable by client JS -> can't be faked via devtools/localStorage
      sameSite: "lax",
      secure: false, // set to true when served over HTTPS in production
      maxAge: 1000 * 60 * 60 * 8, // 8 hours
    },
  })
);

// Small helper: only lets the request through if a verified session exists.
function requireAuth(req, res, next) {
  if (req.session && req.session.user) {
    return next();
  }
  return res.status(401).json({ error: "Not authenticated" });
}

/**
 * The client sends the Google ID token it received from the "Continue with
 * Google" button here. We verify that token's signature/issuer/audience
 * directly with Google before trusting anything in it. This is the step
 * that makes the login "real": clicking the button alone never creates a
 * session, only a token that Google itself validates.
 */
app.post("/api/auth/google", async (req, res) => {
  const { credential } = req.body || {};

  if (!credential) {
    return res.status(400).json({ error: "Missing Google credential" });
  }

  try {
    const ticket = await oauthClient.verifyIdToken({
      idToken: credential,
      audience: GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();

    if (!payload || !payload.email) {
      return res.status(401).json({ error: "Invalid Google token payload" });
    }

    // Regenerate the session on login to avoid session fixation.
    req.session.regenerate((err) => {
      if (err) {
        return res.status(500).json({ error: "Could not start session" });
      }

      req.session.user = {
        id: payload.sub,
        name: payload.name || payload.email,
        email: payload.email,
        picture: payload.picture || null,
      };

      req.session.save((saveErr) => {
        if (saveErr) {
          return res.status(500).json({ error: "Could not save session" });
        }
        return res.status(200).json({ user: req.session.user });
      });
    });
  } catch (err) {
    console.error("[server] Google token verification failed:", err.message);
    return res.status(401).json({ error: "Google authentication failed" });
  }
});

// The client calls this on load/refresh to find out whether it already has
// a valid, server-verified session. Nothing about auth state is trusted
// from the client itself.
app.get("/api/auth/me", requireAuth, (req, res) => {
  res.status(200).json({ user: req.session.user });
});

app.post("/api/auth/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ error: "Could not log out" });
    }
    res.clearCookie("sid");
    return res.status(200).json({ ok: true });
  });
});

// Example protected resource for the Home page. Guarded server-side too,
// not just by hiding a route on the frontend.
app.get("/api/home", requireAuth, (req, res) => {
  res.status(200).json({
    message: `Welcome, ${req.session.user.name}!`,
    user: req.session.user,
  });
});

app.get("/api/health", (_req, res) => res.json({ ok: true }));

app.listen(PORT, () => {
  console.log(`[server] listening on http://localhost:${PORT}`);
});
