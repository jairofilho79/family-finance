import React, { createContext, useContext, useState, useEffect } from "react";
import { useConfig } from "./ConfigContext";

interface User {
  id: string;
  name: string;
  email: string;
  picture: string;
  theme: "light" | "dark";
  font_size: "normal" | "large";
  group_recurring?: boolean;
  pix_key?: string;
}

interface AuthContextType {
  token: string | null;
  user: User | null;
  login: (token: string, inviteToken?: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
  authError: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// API base URL - in production this would be env var
export const API_URL = "https://api.jairofilho79.workers.dev";

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [token, setToken] = useState<string | null>(
    localStorage.getItem("token"),
  );
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const { setPreferences } = useConfig();

  const logout = () => {
    localStorage.removeItem("token");
    setToken(null);
    setUser(null);
    setAuthError(null);
  };

  // Global fetch interceptor to detect 401 Unauthorized globally
  useEffect(() => {
    const originalFetch = window.fetch;

    window.fetch = async (...args) => {
      const response = await originalFetch(...args);
      if (response.status === 401) {
        logout();
      }
      return response;
    };

    return () => {
      window.fetch = originalFetch;
    };
  }, []);

  const fetchUser = async (authToken: string, inviteToken?: string) => {
    try {
      setAuthError(null);

      const headers: Record<string, string> = {
        Authorization: `Bearer ${authToken}`,
      };

      if (inviteToken) {
        headers["X-Invite-Token"] = inviteToken;
      }

      const res = await fetch(`${API_URL}/users/me`, { headers });

      if (res.ok) {
        const data = await res.json();
        setUser(data.user);

        // Sync preferences from DB
        if (data.user?.theme || data.user?.font_size) {
          setPreferences(
            data.user.theme || "dark",
            data.user.font_size || "normal",
            data.user.group_recurring !== undefined ? !!data.user.group_recurring : true
          );
        }
        return true;
      } else {
        const errorData = await res.json().catch(() => null);
        setAuthError(errorData?.error || "Falha na autenticação");
        logout();
        return false;
      }
    } catch (e) {
      console.error(e);
      setAuthError("Erro na conexão com o servidor");
      logout();
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (token && !user) {
      fetchUser(token);
    } else if (!token) {
      setIsLoading(false);
    }
  }, [token, user]);

  const login = async (newToken: string, inviteToken?: string) => {
    setIsLoading(true);
    const success = await fetchUser(newToken, inviteToken);
    if (success) {
      localStorage.setItem("token", newToken);
      setToken(newToken);
    }
  };

  return (
    <AuthContext.Provider
      value={{ token, user, login, logout, isLoading, authError }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
