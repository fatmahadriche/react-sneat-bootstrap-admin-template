// src/components/ProtectedRoute.jsx
import { useEffect } from "react";
import { useAuth } from "./context/authContext";
import { useNavigate } from "react-router-dom";


const ProtectedRoute = ({ children, requiredRole }) => {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user || user.role.toLowerCase() !== requiredRole.toLowerCase()) {
      navigate('/auth/login', { replace: true });
    }
  }, [user, requiredRole, navigate]);

  if (!user || user.role.toLowerCase() !== requiredRole.toLowerCase()) {
    return null;
  }

  return children;
};

export default ProtectedRoute;