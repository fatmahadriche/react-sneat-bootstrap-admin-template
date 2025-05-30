import { createContext, useContext, useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import Loader from "../components/Loader";
import api from "../api/api";

export const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

const cleanAuthData = () => {
  ["token", "role", "userData"].forEach((key) => {
    const value = localStorage.getItem(key);
    if (value === "undefined" || value === "null") localStorage.removeItem(key);
  });
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const logoutTimer = useRef(null);

  const setLogoutTimer = (exp) => {
    // Annuler le timer existant
    if (logoutTimer.current) {
      clearTimeout(logoutTimer.current);
      logoutTimer.current = null;
    }

    const expirationTime = exp * 1000;
    const currentTime = Date.now();
    const timeout = expirationTime - currentTime;

    if (timeout > 0) {
      logoutTimer.current = setTimeout(() => {
        logout();
        window.location.href = `/auth/login?sessionExpired=true`;
      }, timeout);
    }
  };

  const verifyToken = async () => {
    cleanAuthData();
    const token = localStorage.getItem("token");

    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const decoded = jwtDecode(token);

      // Vérification manuelle de l'expiration
      if (decoded.exp * 1000 < Date.now()) {
        throw new Error("Token expiré");
      }

      await api.get("/auth/verify");
      const response = await api.get("/auth/me");
      const userData = response.data;

      setLogoutTimer(decoded.exp);

      setUser({
        token,
        ...userData,
        role: userData.role.toLowerCase(),
      });

      localStorage.setItem("userData", JSON.stringify(userData));
    } catch (error) {
      logout();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    verifyToken();
  }, []);

  const login = async (token, role, userData) => {
    const normalizedRole = role.toLowerCase();
    const decoded = jwtDecode(token);

    localStorage.setItem("token", token);
    localStorage.setItem("role", normalizedRole);
    localStorage.setItem("userData", JSON.stringify(userData));

    setLogoutTimer(decoded.exp);

    setUser({
      token,
      role: normalizedRole,
      ...userData,
    });
    navigate(`/${normalizedRole}/dashboard`);
  };

  const logout = () => {
    if (logoutTimer.current) {
      clearTimeout(logoutTimer.current);
      logoutTimer.current = null;
    }
    localStorage.clear();
    setUser(null);
    navigate("/auth/login");
  };

  const updateUser = (newUserData) => {
    const updatedUser = { ...user, ...newUserData };
    localStorage.setItem("userData", JSON.stringify(newUserData));
    setUser(updatedUser);
  };

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
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};