import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from './context/authContext';
import AppRoutes from './router/AppRoutes';
import Loader from './components/Loader';

function App() {
  const { user, loading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user && !location.pathname.startsWith('/auth')) {
      navigate('/auth/login');
    }
  }, [user, loading, location, navigate]);

  if (loading) {
    return <Loader />;
  }

  return <AppRoutes />;
}

export default App;