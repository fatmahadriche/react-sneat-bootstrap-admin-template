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
      await axios.patch(
        `${import.meta.env.VITE_APP_API_URL}/api/notifications/${id}/mark-read`, 
        {}, 
        { headers: { Authorization: `Bearer ${user.token}` } }
      );
      setNotifications(prev => prev.filter(n => n._id !== id));
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  }, []);

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