// src/components/ProtectedRoute.jsx
import { useEffect } from "react";
import { useAuth } from "./context/authContext";
import { useNavigate } from "react-router-dom";

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user || !allowedRoles.map(r => r.toLowerCase()).includes(user.role)) {
      navigate('/unauthorized', { replace: true });
    }
  }, [user, allowedRoles, navigate]);

  if (!user || !allowedRoles.includes(user.role.toLowerCase())) {
    return null;
  }

  return children;
};

export default ProtectedRoute;