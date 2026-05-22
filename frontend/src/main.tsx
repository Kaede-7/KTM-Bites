// ============================================================
// main.tsx — The very first file that runs when the app starts
// ============================================================
// This file does 3 things:
// 1. Finds the <div id="root"> in index.html
// 2. Wraps the app with required providers (Router, Google Auth)
// 3. Renders the <App /> component into the page
//
// You rarely need to edit this file.
// ============================================================

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { restoreSessionFromRedirect } from "./api/auth";
import App from "./App";
import "./index.css";

// Restore redirect-persisted session if any exists
restoreSessionFromRedirect();

// Google OAuth client ID (from .env file or fallback)
const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || "YOUR_GOOGLE_CLIENT_ID";

// Render the React app into the browser
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    {/* GoogleOAuthProvider: enables "Sign in with Google" */}
    <GoogleOAuthProvider clientId={googleClientId}>
      {/* BrowserRouter: enables page navigation (URL changes) */}
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </GoogleOAuthProvider>
  </StrictMode>,
);
