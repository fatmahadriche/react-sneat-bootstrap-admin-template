import { createContext, useContext, useState, useCallback } from 'react';
import axios from 'axios';

const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);

  const fetchNotifications = useCallback(async (user) => {
    if (!user?.token) return;
    
    const controller = new AbortController();
    
    try {
      const response = await axios.get(`${import.meta.env.VITE_APP_API_URL}/api/notifications`, {
        headers: { Authorization: `Bearer ${user.token}` },
        signal: controller.signal
      });
      setNotifications(response.data);
    } catch (error) {
      if (!axios.isCancel(error)) {
        console.error('Error fetching notifications:', error);
      }
    }
    
    return () => controller.abort();
  }, []);

const markAsRead = useCallback(async (id, user) => {
  if (!user?.token) return;
  
  try {
    // Mise à jour optimiste : retirer la notification de la liste
    setNotifications(prev => prev.filter(n => n._id !== id));
    
    await axios.patch(
      `${import.meta.env.VITE_APP_API_URL}/api/notifications/${id}/mark-read`, 
      {}, 
      { headers: { Authorization: `Bearer ${user.token}` } }
    );

    // Ne pas appeler fetchNotifications ici
  } catch (error) {
    console.error('Error marking notification as read:', error);
    // En cas d'erreur, rafraîchir pour récupérer l'état correct
    await fetchNotifications(user);
    throw error;
  }
}, [fetchNotifications]);

  return (
    <NotificationContext.Provider value={{ 
      notifications,
      fetchNotifications,
      markAsRead
    }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => useContext(NotificationContext);