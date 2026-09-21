# Google Auth App

Google Sign-In demo with a React (Vite) client and an Express server that
verifies Google ID tokens and manages server-side sessions.

```
google-auth-app/
├── client/   React + Vite frontend (@react-oauth/google)
└── server/   Express backend (google-auth-library, express-session)
```

## 1. Google OAuth credentials

1. Open the [Google Cloud Console](https://console.cloud.google.com/apis/credentials).
2. Create an **OAuth client ID** of type **Web application**.
3. Add `http://localhost:5173` under **Authorized JavaScript origins**.
4. Copy the client ID.

## 2. Environment variables

```bash
cp server/.env.example server/.env
cp client/.env.example client/.env
```

Fill in your Google client ID in both files (it must be the same value) and set
`SESSION_SECRET` in `server/.env` to a long random string.

## 3. Run

Server (port 4000):

```bash
cd server
npm install
npm run dev
```

Client (port 5173):

```bash
cd client
npm install
npm run dev
```

Open http://localhost:5173.

## Notes

- `.env` files are git-ignored. Never commit secrets.
- For production, serve over HTTPS and set `cookie.secure: true` in
  `server/index.js`.
