import { createContext, useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

export const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem("token");
      const role = localStorage.getItem("role");
      const tokenExpiration = localStorage.getItem("tokenExpiration");

      if (token && role && tokenExpiration) {
        const isTokenExpired = Date.now() > parseInt(tokenExpiration, 10);
        if (!isTokenExpired) {
          setUser({ token, role });
        } else {
          logout();
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, []);

  const login = (token, role) => {
    const expiresIn = 3600;
    localStorage.setItem("token", token);
    localStorage.setItem("role", role);
    localStorage.setItem("tokenExpiration", Date.now() + expiresIn * 1000);
    setUser({ token, role });
    navigate("/admin/dashboard");
  };

  const logout = () => {
    localStorage.clear();
    setUser(null);
    window.location.href = '/auth/login';
    
    // Empêcher la navigation arrière après la déconnexion
    setTimeout(() => {
      window.location.reload();
    }, 100);
  };

  if (loading) {
    return <div>Chargement...</div>;
  }

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
