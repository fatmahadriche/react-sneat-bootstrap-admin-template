import { createContext, useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Loader from "../components/Loader";
import api from "../api/api"; // Importez votre instance axios configurée

export const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

const safeJsonParse = (str) => {
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
    if (value === "undefined" || value === "null") localStorage.removeItem(key);
  });
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const verifyToken = async () => {
      cleanAuthData();
      const token = localStorage.getItem("token");
      
      if (!token) {
        setLoading(false);
        return;
      }
    
      try {
        // Vérification du token ET récupération des données complètes
        await api.get("/auth/verify");
        const response = await api.get("/auth/me");
        const userData = response.data;
    
        setUser({
          token,
          ...userData,
          role: userData.role.toLowerCase()
        });
        
        localStorage.setItem("userData", JSON.stringify(userData));
        resetLogoutTimer();
        
      } catch (error) {
        logout();
      } finally {
        setLoading(false);
      }
    };

    verifyToken();
  }, []);

  const resetLogoutTimer = () => {
    const expiresIn = 3600 * 1000; // 1 heure
    const expirationTime = Date.now() + expiresIn;
    localStorage.setItem("tokenExpiration", expirationTime.toString());
  };

  const login = async (token, role, userData) => {
    const normalizedRole = role.toLowerCase();
    
    localStorage.setItem("token", token);
    localStorage.setItem("role", normalizedRole);
    localStorage.setItem("userData", JSON.stringify(userData));
    resetLogoutTimer();
  
    setUser({ 
      token, 
      role: normalizedRole,
      ...userData 
    });
    navigate(`/${normalizedRole}/dashboard`);
  };

  const logout = () => {
    localStorage.clear();
    setUser(null);
    navigate("/auth/login");
    window.location.reload(); // Nettoyage complet du state
  };

  const updateUser = (newUserData) => {
    const updatedUser = { ...user, ...newUserData };
    localStorage.setItem("userData", JSON.stringify(newUserData));
    setUser(updatedUser);
  };

  // Bloque le rendu pendant la vérification initiale
  if (loading) {
    return <Loader />;
  }

  return (
    <AuthContext.Provider 
      value={{ 
        user,
        loading,
        login,
        logout,
        updateUser
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};