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
import logo from "../../logo-final.svg";

// Ideally from env variable. Using a generic dev client ID or placeholder.
// The user will need to provide their own for production.
const GOOGLE_CLIENT_ID =
  "423245291834-p3os54gt8ldiut466pq01os2q1goc732.apps.googleusercontent.com";

// Atualiza o favicon do browser para usar a marca da aplicação.
// Alguns navegadores podem cachear favicon; um reload hard pode ser necessário.
const updateFavicon = (href: string) => {
  const existing = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
  if (existing) {
    existing.href = href;
    return;
  }

  const link = document.createElement("link");
  link.rel = "icon";
  link.type = "image/svg+xml";
  link.href = href;
  document.head.appendChild(link);
};

updateFavicon(logo);
document.title = "Family Finance";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
        <ConfigProvider>
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
