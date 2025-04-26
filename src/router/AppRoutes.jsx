import { Route, Routes, Navigate } from "react-router-dom";
import { LoginPage } from "../pages/authentication/LoginPage";
import { AccountPage } from "../pages/account/AccountPage";
import { NotificationPage } from "../pages/account/NotificationPage";
import ListeUtilisateursPage from "../pages/ListeUtilisateursPage";
import DashboardPage from "../pages/DashboardPage";
import { useAuth } from "../context/AuthContext";
import ProtectedRoute from "../ProtectedRoute";
import AjouterUtilisateurPage from "../pages/new/AjouterUtilisateurPage";
import ModifierUtilisateurPage from "../pages/modification/ModifierUtilisateurPage";
import AgentListPage from '../pages/feuille-pointage/AgentListPage';
import AgentFeuilleDetail from '../pages/feuille-pointage/AgentFeuilleDetail';
import FeuillePresencePage from '../pages/feuille-presence/FeuillePresencePage';
import AgentPresenceDetail from '../pages/feuille-presence/AgentPresenceDetail';

const AppRoutes = () => {
  const { user } = useAuth();

  return (
    <Routes>
      <Route path="/" element={<Navigate to="/auth/login" replace />} />

      {/* Route de login */}
      <Route
        path="/auth/login"
        element={<LoginPage apiUrl="http://localhost:5000/auth/login" />}
      />

      {/* Tableau de bord dynamique */}
      <Route 
        path="/:role/dashboard" 
        element={
          <ProtectedRoute allowedRoles={["admin", "gestionnaire", "agent"]}>
            <DashboardPage />
          </ProtectedRoute>
        }
      />

      {/* Routes non autorisées */}
      <Route path="/unauthorized" element={<div>Accès non autorisé!</div>} />

      {/* Configuration du compte */}
      <Route
        path="/account/settings"
        element={
          <ProtectedRoute allowedRoles={["admin", "gestionnaire", "agent"]}>
            <AccountPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/account/notifications"
        element={
          <ProtectedRoute allowedRoles={["admin", "gestionnaire"]}>
            <NotificationPage />
          </ProtectedRoute>
        }
      />

      {/* Gestion des utilisateurs */}
      <Route
        path="/utilisateurs"
        element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <ListeUtilisateursPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/utilisateurs/ajouter"
        element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <AjouterUtilisateurPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/utilisateurs/:id"
        element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <ModifierUtilisateurPage />
          </ProtectedRoute>
        }
      />

      {/* Feuilles de pointage */}
      <Route
        path="/feuille-pointage"
        element={
          <ProtectedRoute allowedRoles={["admin", "gestionnaire"]}>
            <AgentListPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/feuille-pointage/:matricule"
        element={
          <ProtectedRoute allowedRoles={["admin", "gestionnaire"]}>
            <AgentFeuilleDetail />
          </ProtectedRoute>
        }
      />

      {/* Feuilles de présence */}
      <Route
        path="/feuille-presence"
        element={
          <ProtectedRoute allowedRoles={["admin", "gestionnaire"]}>
            <FeuillePresencePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/feuille-presence/:matricule"
        element={
          <ProtectedRoute allowedRoles={["admin", "gestionnaire"]}>
            <AgentPresenceDetail />
          </ProtectedRoute>
        }
      />

      {/* Routes agent */}
      <Route
        path="/mes-feuilles-pointage/:matricule"
        element={
          <ProtectedRoute allowedRoles={["agent"]}>
            <AgentFeuilleDetail />
          </ProtectedRoute>
        }
      />
      <Route
        path="/mes-feuilles-presence/:matricule"
        element={
          <ProtectedRoute allowedRoles={["agent"]}>
            <AgentPresenceDetail />
          </ProtectedRoute>
        }
      />

      {/* Redirection pour les routes inconnues */}
      <Route path="*" element={<Navigate to="/auth/login" replace />} />
    </Routes>
  );
};

export default AppRoutes;