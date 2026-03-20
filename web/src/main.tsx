// Build v2.1.0
if (typeof window !== 'undefined') (window as any).__BUILD_VERSION__ = '2.1.0-20260227T0514';
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { ConfigProvider } from "./context/ConfigContext";
import { AuthProvider } from "./context/AuthContext";
import { NotificationProvider } from "./context/NotificationContext";
import App from "./App.tsx";
import "./index.css";
import FaviconThemeSync from "./components/FaviconThemeSync";

// Ideally from env variable. Using a generic dev client ID or placeholder.
// The user will need to provide their own for production.
const GOOGLE_CLIENT_ID =
  "423245291834-p3os54gt8ldiut466pq01os2q1goc732.apps.googleusercontent.com";

document.title = "Family Finance";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
        <ConfigProvider>
          <FaviconThemeSync />
          <AuthProvider>
            <NotificationProvider>
              <App />
            </NotificationProvider>
          </AuthProvider>
        </ConfigProvider>
      </GoogleOAuthProvider>
    </BrowserRouter>
  </StrictMode>,
);
