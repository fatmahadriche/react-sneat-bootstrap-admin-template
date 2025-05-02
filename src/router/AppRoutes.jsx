import { Outlet, Route, Routes, Navigate } from "react-router-dom";
import { LoginPage } from "../pages/authentication/LoginPage";
import { AccountPage } from "../pages/account/AccountPage";
import NotificationPage from "../pages/account/NotificationPage";
import ListeUtilisateursPage from "../pages/ListeUtilisateursPage";
import DashboardPage from "../pages/DashboardPage";
import { useAuth } from "../context/AuthContext";
import ProtectedRoute from "../ProtectedRoute";
import AjouterUtilisateurPage from "../pages/new/AjouterUtilisateurPage";
import ModifierUtilisateurPage from "../pages/modification/ModifierUtilisateurPage";
import AgentListPage from '../pages/feuille-pointage/AgentListPage';
import AgentFeuilleDetail from '../pages/feuille-pointage/AgentFeuilleDetail';
import AgentFeuillePointage from '../pages/feuille-pointage/AgentFeuillePointage';
import FeuillePresencePage from '../pages/feuille-presence/FeuillePresencePage';
import AgentPresenceDetail from '../pages/feuille-presence/AgentPresenceDetail';
import Layout from "../layouts/Layout";
import Blank from '../layouts/Blank';
import DemandeCongePage from '../pages/Conges/DemandeCongePage';
import ListeCongesPage from '../pages/Conges/ListeCongesPage';
import HeuresSupplementairesPage from '../pages/heures-supplementaires/HeuresSupplementairesPage';
import HeuresSupplementairesDetailPage from '../pages/heures-supplementaires/HeuresSupplementairesDetailPage';

const AppRoutes = () => {
  const { user } = useAuth();

  return (
    <Routes>
      <Route element={<Blank><Outlet /></Blank>}>
        <Route path="/auth/login" element={<LoginPage />} />
        <Route path="/unauthorized" element={<div>Accès non autorisé!</div>} />
      </Route>

      <Route path="/" element={<Navigate to="/auth/login" replace />} />
      <Route path="*" element={<Navigate to="/auth/login" replace />} />

      <Route element={<ProtectedLayout />}>
        {/* Tableau de bord */}
        <Route
          path="/:role/dashboard"
          element={
            <ProtectedRoute allowedRoles={["admin", "gestionnaire", "agent"]}>
              <DashboardPage />
            </ProtectedRoute>
          }
        />

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
            <ProtectedRoute allowedRoles={["admin", "gestionnaire", "agent"]}>
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
              <AgentFeuillePointage />
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
        <Route
          path="/demande-conge"
          element={
            <ProtectedRoute allowedRoles={["agent"]}>
              <DemandeCongePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/liste-conges"
          element={
            <ProtectedRoute allowedRoles={["admin", "gestionnaire", "agent"]}>
              <ListeCongesPage />
            </ProtectedRoute>
          }
        />
        <Route
  path="/heures-supplementaires"
  element={
    <ProtectedRoute allowedRoles={["admin", "gestionnaire"]}>
      <HeuresSupplementairesPage />
    </ProtectedRoute>
  }
/>
<Route
  path="/heures-supplementaires/:userId"
  element={
    <ProtectedRoute allowedRoles={["admin", "gestionnaire"]}>
      <HeuresSupplementairesDetailPage />
    </ProtectedRoute>
  }
/>
        

      </Route>


    </Routes>
  );
};

const ProtectedLayout = () => {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/auth/login" replace />;
  }

  return (
    <Layout>
      <Outlet />
    </Layout>
  );
};

export default AppRoutes;