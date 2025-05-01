import { useEffect } from 'react';
import { useAuth } from './context/authContext';
import { useNavigate, useLocation } from 'react-router-dom';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth/login', { state: { from: location }, replace: true });
    } else if (user && !allowedRoles.includes(user.role?.toLowerCase())) {
      navigate('/unauthorized', { replace: true });
    }
  }, [user, loading, allowedRoles, navigate, location]);

  if (loading || !user || !allowedRoles.includes(user.role?.toLowerCase())) {
    return <Loader />;
  }

  return children;
};

export default ProtectedRoute;