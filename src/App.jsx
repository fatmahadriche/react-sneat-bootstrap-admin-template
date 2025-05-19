import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from './context/authContext';
import AppRoutes from './router/AppRoutes';
import Loader from './components/Loader';

function App() {
  const { user, loading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  // Ajouter dans App.js :
useEffect(() => {
  const handleConnectionChange = () => {
    if (navigator.onLine) {
      api.get('/health').catch(() => {
        showToast('Connexion rétablie mais serveur inaccessible');
      });
    } else {
      showToast('Connexion Internet perdue');
    }
  };

  window.addEventListener('online', handleConnectionChange);
  window.addEventListener('offline', handleConnectionChange);

  return () => {
    window.removeEventListener('online', handleConnectionChange);
    window.removeEventListener('offline', handleConnectionChange);
  };
}, []);

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