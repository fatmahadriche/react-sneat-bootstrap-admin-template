import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import CalendarDashboard from "../components/dashboard/CalendarDashboard ";

const DashboardPage = () => {
    const { user, isLoading } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (!isLoading && !user) {
            navigate('/auth/login', { replace: true });
        }
    }, [user, isLoading, navigate]);

    if (isLoading) {
        return (
            <div className="calendar-loading">
                <div className="loading-spinner"></div>
                <p>Chargement du calendrier...</p>
            </div>
        );
    }

    return (
        <div className="dashboard-container">
            <div className="dashboard-header">
                <div>
                    <h1>Calendrier</h1>
                    <p>Gestion des événements et rendez-vous</p>
                </div>
            </div>
            <CalendarDashboard />
        </div>
    );
};

export default DashboardPage;