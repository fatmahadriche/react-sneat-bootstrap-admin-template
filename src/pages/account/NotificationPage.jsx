import React, { useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { toast } from 'react-toastify';
import moment from 'moment';
import { AccountWrapper } from "../../components/wrapper/AccountWrapper";


const NotificationPage = () => {
  const { user } = useAuth();
  const { notifications, markAsRead, fetchNotifications } = useNotifications();

  useEffect(() => {
    if (!user?.token) return;

    const loadNotifications = async () => {
      try {
        await fetchNotifications(user);
      } catch (error) {
        toast.error('Erreur lors de la récupération des notifications');
      }
    };

    loadNotifications();

    // Refresh every 30 seconds
    const interval = setInterval(loadNotifications, 30000);

    return () => clearInterval(interval);
  }, [user?.token, fetchNotifications]);

  const handleMarkAsRead = async (id) => {
    try {
      await markAsRead(id, user);
      toast.success('Notification marquée comme lue');
    } catch (error) {
      toast.error('Erreur lors du marquage comme lu');
    }
  };
  const getNotificationType = (type) => {
    const types = {
      'absence_jour': 'Absence',
      'conge': 'Congé',
      'conflit': 'Conflit de planning'
    };
    return types[type] || type;
  };

  return (
    <AccountWrapper title="Notifications">
      <div className="card">
        <div className="card-header">
          <h5 className="card-title">Notifications</h5>
        </div>
        <div className="card-body">
          <table className="table table-hover">
            <thead>
              <tr>
                <th>Date</th> {/* ◄◄◄ Colonne Date en premier */}
                <th>Type</th>
                <th>Détails</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
  {notifications.map(notification => (
    <tr key={notification._id}><td>
        {moment(notification.createdAt).format('DD/MM/YYYY HH:mm')}
      </td><td>
        <span className="badge bg-primary">
          {getNotificationType(notification.type)}
        </span>
      </td><td>{notification.message}</td><td>
        <button
          className="btn btn-primary btn-sm"
          onClick={() => handleMarkAsRead(notification._id)}
        >
          Marquer comme lu
        </button>
      </td></tr>
  ))}
</tbody>

          </table>
        </div>
      </div>
    </AccountWrapper>
  );
};

export default NotificationPage;
