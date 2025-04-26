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

  const safeJsonParse = (str) => {
    // Gestion spécifique de la chaîne "undefined"
    if (str === "undefined") return null;
    
    try {
      return str ? JSON.parse(str) : null;
    } catch (error) {
      console.error("JSON parse error:", error);
      return null;
    }
  };

  const cleanAuthData = () => {
    ["token", "role", "userData", "tokenExpiration"].forEach(key => {
      const value = localStorage.getItem(key);
      if (value === "undefined") localStorage.removeItem(key);
    });
  };

  useEffect(() => {
    const checkAuth = () => {
      cleanAuthData(); // Nettoyage initial

      const token = localStorage.getItem("token");
      const role = localStorage.getItem("role");
      const userData = safeJsonParse(localStorage.getItem("userData"));
      const tokenExpiration = localStorage.getItem("tokenExpiration");

      if (token && role && tokenExpiration) {
        const isTokenExpired = Date.now() > parseInt(tokenExpiration, 10);
        if (!isTokenExpired) {
          setUser({ 
            token, 
            role,
            ...(userData || {}) // Garantit un objet vide
          });
        } else {
          logout();
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, []);

  const login = (token, role, userData = {}) => {
    const normalizedRole = role.toLowerCase(); 
    const expiresIn = 3600 * 1000;
    const expirationTime = Date.now() + expiresIn;

    localStorage.setItem("token", token);
    localStorage.setItem("role", normalizedRole);
    localStorage.setItem("userData", JSON.stringify(userData));
    localStorage.setItem("tokenExpiration", expirationTime.toString());

    setUser({ token, role: normalizedRole, ...userData });
    navigate(`/${normalizedRole}/dashboard`);
  };

  const logout = () => {
    localStorage.clear();
    setUser(null);
    navigate("/auth/login");
    window.location.reload();
  };

  const updateUser = (newUserData) => {
    const updatedUser = { ...user, ...newUserData };
    setUser(updatedUser);
    localStorage.setItem("userData", JSON.stringify(newUserData));
  };

  if (loading) {
    return <div>Chargement...</div>;
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}