import { useEffect } from "react";
import { useConfig } from "../context/ConfigContext";
import logoGreen from "../../../logo-final.svg";
import logoWhite from "../../../logo-final-branca.svg";

function updateFavicon(href: string) {
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
}

export default function FaviconThemeSync() {
  const { theme } = useConfig();

  useEffect(() => {
    updateFavicon(theme === "dark" ? logoWhite : logoGreen);
  }, [theme]);

  return null;
}

