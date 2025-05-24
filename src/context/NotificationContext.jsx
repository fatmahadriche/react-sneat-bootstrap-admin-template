// context/NotificationContext.js - VERSION CORRIGÉE
import { createContext, useContext, useState, useCallback, useRef } from 'react';
import axios from 'axios';

const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const lastFetchRef = useRef(0);
  const abortControllerRef = useRef(null);

  const fetchNotifications = useCallback(async (user, forceRefresh = false) => {
    if (!user?.token) return;
    
    // Éviter les appels trop fréquents
    const now = Date.now();
    if (!forceRefresh && now - lastFetchRef.current < 2000) {
      return;
    }
    lastFetchRef.current = now;

    // Annuler la requête précédente si elle existe
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    abortControllerRef.current = new AbortController();
    
    try {
      setIsLoading(true);
      const response = await axios.get(
        `${import.meta.env.VITE_APP_API_URL}/api/notifications`,
        {
          headers: { Authorization: `Bearer ${user.token}` },
          signal: abortControllerRef.current.signal,
          timeout: 10000 // Timeout de 10 secondes
        }
      );
      
      setNotifications(response.data || []);
    } catch (error) {
      if (!axios.isCancel(error)) {
        console.error('Error fetching notifications:', error);
        // En cas d'erreur, garder les notifications actuelles plutôt que de vider
        if (error.response?.status !== 401) {
          // Ne vider que si ce n'est pas une erreur d'authentification
          // setNotifications([]);
        }
      }
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  }, []);

  const markAsRead = useCallback(async (id, user) => {
    if (!user?.token || !id) return;
    
    try {
      // Mise à jour optimiste SEULEMENT pour l'UI
      const originalNotifications = notifications;
      const optimisticNotifications = notifications.filter(n => n._id !== id);
      setNotifications(optimisticNotifications);
      
      // Appel API
      const response = await axios.patch(
        `${import.meta.env.VITE_APP_API_URL}/api/notifications/${id}/mark-read`, 
        {}, 
        { 
          headers: { Authorization: `Bearer ${user.token}` },
          timeout: 5000 // Timeout de 5 secondes
        }
      );

      if (!response.data.success) {
        throw new Error('Échec du marquage comme lu');
      }

      // Succès : la mise à jour optimiste reste
      console.log('Notification marquée comme lue avec succès');
      
    } catch (error) {
      console.error('Error marking notification as read:', error);
      
      // Rollback en cas d'erreur
      setNotifications(originalNotifications);
      
      // Après un délai, refetch pour synchroniser
      setTimeout(() => {
        fetchNotifications(user, true);
      }, 1000);
      
      throw error;
    }
  }, [notifications, fetchNotifications]);

  // Méthode pour forcer le refresh
  const refreshNotifications = useCallback((user) => {
    return fetchNotifications(user, true);
  }, [fetchNotifications]);

  // Méthode pour obtenir le nombre de notifications non lues
  const getUnreadCount = useCallback(async (user) => {
    if (!user?.token) return 0;
    
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_APP_API_URL}/api/notifications/unread-count`,
        {
          headers: { Authorization: `Bearer ${user.token}` },
          timeout: 5000
        }
      );
      return response.data.count || 0;
    } catch (error) {
      console.error('Error getting unread count:', error);
      return notifications.length; // Fallback
    }
  }, [notifications.length]);

  // Cleanup à la déconnexion
  const clearNotifications = useCallback(() => {
    setNotifications([]);
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  }, []);

  return (
    <NotificationContext.Provider value={{ 
      notifications,
      isLoading,
      fetchNotifications,
      markAsRead,
      refreshNotifications,
      getUnreadCount,
      clearNotifications
    }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};