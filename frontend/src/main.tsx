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

// --- Handle chunk/module loading errors after new deployments ---
window.addEventListener("error", (event) => {
  const msg = event.message || "";
  const target = event.target as HTMLElement;
  const isScriptError = target && target.tagName === "SCRIPT";
  
  if (
    msg.includes("Failed to fetch dynamically imported module") ||
    msg.includes("MIME type") ||
    isScriptError
  ) {
    const RELOAD_KEY = "ktmbites_reload_chunk_fail";
    const lastReload = sessionStorage.getItem(RELOAD_KEY);
    const now = Date.now();

    // Prevent infinite reload loops (only reload if last was > 10 seconds ago)
    if (!lastReload || now - parseInt(lastReload, 10) > 10000) {
      sessionStorage.setItem(RELOAD_KEY, now.toString());
      window.location.reload();
    }
  }
}, true);

window.addEventListener("unhandledrejection", (event) => {
  const reason = event.reason || {};
  const msg = reason.message || "";
  const stack = reason.stack || "";

  if (
    msg.includes("Failed to fetch dynamically imported module") ||
    stack.includes("Failed to fetch dynamically imported module")
  ) {
    const RELOAD_KEY = "ktmbites_reload_chunk_fail";
    const lastReload = sessionStorage.getItem(RELOAD_KEY);
    const now = Date.now();

    if (!lastReload || now - parseInt(lastReload, 10) > 10000) {
      sessionStorage.setItem(RELOAD_KEY, now.toString());
      window.location.reload();
    }
  }
});

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
