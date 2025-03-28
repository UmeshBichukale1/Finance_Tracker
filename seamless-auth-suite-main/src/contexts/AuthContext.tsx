
import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useNavigate } from "react-router-dom";

type User = {
  id: string,
  username: string;
  token: string;
};

type AuthContextType = {
  user: User | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  signup: (username: string, password: string) => Promise<void>;
  logout: () => void;
  error: string | null;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is already logged in
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const login = async (username: string, password: string) => {
    setError(null);
    setLoading(true);
    try {
      // First request to check if username exists
      const checkUserResponse = await fetch("https://touching-man-22.hasura.app/api/rest/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-hasura-admin-secret": "dnm8M2e0iTYEmL6CmvDemDLr9E92gAI19Is3cXmqgtGK4CaMacP4sH8Sp9zVRmOb"
        },
        body: JSON.stringify({ username })
      });

      const userData = await checkUserResponse.json();

      if (!checkUserResponse.ok) {
        throw new Error(userData.message || "Login failed. Please check your credentials.");
      }

      // Check if username exists
      if (userData.users.length === 0) {
        throw new Error("Username or password is incorrect");
      }

      // Get the first user (assuming usernames are unique)
      const user = userData.users[0];

      // Compare passwords
      if (user.password !== password) {
        throw new Error("Username or password is incorrect");
      }

      // If we get here, login is successful
      const authData = {
        username: user.username,
        id: user.id,
        token: "placeholder-token" // or use actual token if available
      };

      setUser(authData);
      localStorage.setItem("user", JSON.stringify(authData));
      navigate("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred during login");
      console.error("Login error:", err);
    } finally {
      setLoading(false);
    }
  };

  const signup = async (username: string, password: string) => {
    setError(null);
    setLoading(true);
    try {
      const response = await fetch("https://touching-man-22.hasura.app/api/rest/createuser", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-hasura-admin-secret": "dnm8M2e0iTYEmL6CmvDemDLr9E92gAI19Is3cXmqgtGK4CaMacP4sH8Sp9zVRmOb"
        },
        body: JSON.stringify({ username, password })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Signup failed. Please try again.");
      }

      // Automatically log in after successful signup
      await login(username, password);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred during signup");
      console.error("Signup error:", err);
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("user");
    navigate("/login");
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout, error }}>
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
