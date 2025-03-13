import { Route, Routes, Navigate } from "react-router-dom";
import { LoginPage } from "../pages/authentication/LoginPage";
import { AccountPage } from "../pages/account/AccountPage";
import { NotificationPage } from "../pages/account/NotificationPage";
import ListeUtilisateursPage from "../pages/ListeUtilisateursPage";
import { DashboardPage } from "../pages/DashboardPage";
import { useAuth } from "../context/authContext";
import ProtectedRoute from "../ProtectedRoute";
import AjouterUtilisateurPage from "../pages/new/AjouterUtilisateurPage";
import ModifierUtilisateurPage from "../pages/modification/ModifierUtilisateurPage"; // Importez le composant de modification

const AppRoutes = () => {
  const { user } = useAuth();

  return (
    <Routes>
      <Route path="/" element={<Navigate to="/auth/login" replace />} />

      {/* Login avec la bonne URL backend */}
      <Route
        path="/auth/login"
        element={<LoginPage apiUrl="http://localhost:5000/auth/login" />}
      />

      {/* Routes protégées */}
      <Route path="/admin/dashboard" element={
        <ProtectedRoute requiredRole="admin">
          <DashboardPage />
        </ProtectedRoute>
      } />

      {/* Ajoutez une route pour les non-autorisés */}
      <Route path="/unauthorized" element={<div>Accès non autorisé!</div>} />

      {/* Routes protégées */}
      <Route
        path="/account/settings"
        element={
          <ProtectedRoute requiredRole="admin">
            <AccountPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/account/notifications"
        element={
          <ProtectedRoute requiredRole="admin">
            <NotificationPage />
          </ProtectedRoute>
        }
      />

      {/* Route pour la page Liste des utilisateurs */}
      <Route
        path="/utilisateurs"
        element={
          <ProtectedRoute requiredRole="admin">
            <ListeUtilisateursPage />
          </ProtectedRoute>
        }
      />

      {/* Route pour la page Ajouter un utilisateur */}
      <Route
        path="/utilisateurs/ajouter"
        element={
          <ProtectedRoute requiredRole="admin">
            <AjouterUtilisateurPage />
          </ProtectedRoute>
        }
      />

      {/* Route pour la page Modifier un utilisateur */}
      <Route
        path="/utilisateurs/:id" // Route dynamique avec un paramètre `id`
        element={
          <ProtectedRoute requiredRole="admin">
            <ModifierUtilisateurPage />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
};

export default AppRoutes;