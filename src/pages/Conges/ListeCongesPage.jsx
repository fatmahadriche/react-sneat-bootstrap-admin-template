    import React, { useState, useEffect } from "react";
    import { useAuth } from "../../context/AuthContext";
    import axios from "axios";
    import { ToastContainer, toast } from "react-toastify";
    import "react-toastify/dist/ReactToastify.css";
    import moment from "moment";
    import Modal from 'react-modal';

    const ListeCongesPage = () => {
      const { user } = useAuth();
      const [conges, setConges] = useState([]);
      const [loading, setLoading] = useState(true);
      const [selectedConge, setSelectedConge] = useState(null);
      const [showModal, setShowModal] = useState(false);
      const [status, setStatus] = useState('');

      console.log('[INIT] User data:', user);

      const ROLES_MAPPING = {
        'CHEFCENTRE': 'admin',
        'GESTIONNAIRE': 'gestionnaire',
        'AGENT': 'agent'
      };

      const getFrontendRole = (backendRole) => {
        const role = ROLES_MAPPING[backendRole] || backendRole;
        console.log('[ROLE] Backend role:', backendRole, '-> Frontend role:', role);
        return role;
      };

      const getStatusBadge = (statut) => {
        console.log('[STATUS] Rendering badge for status:', statut);
        const styles = {
          "en attente": {
            class: "bg-warning text-dark",
            icon: "bx bx-time-five"
          },
          "approuvé": {
            class: "bg-success text-white",
            icon: "bx bx-check-circle"
          },
          "rejeté": {
            class: "bg-danger text-white",
            icon: "bx bx-x-circle"
          }
        };
        return (
          <span
            className={`badge ${styles[statut].class} d-inline-flex align-items-center gap-1 px-2 py-1 rounded`}
          >
            <i className={styles[statut].icon}></i>
            {statut}
          </span>
        );
      };

      const fetchConges = async () => {
        console.log('[FETCH] Starting to fetch conges...');
        try {
          let response;
          const frontendRole = getFrontendRole(user.role);

          const endpoint = frontendRole === 'agent'
            ? `${import.meta.env.VITE_APP_API_URL}/api/conges/mes-demandes`
            : `${import.meta.env.VITE_APP_API_URL}/api/conges/pending`;

          console.log('[FETCH] Making request to:', endpoint);
          console.log('[FETCH] Auth token:', user.token ? 'Present' : 'Missing');

          response = await axios.get(endpoint, {
            headers: { Authorization: `Bearer ${user.token}` }
          });

          console.log('[FETCH] Response received:', {
            status: response.status,
            data: response.data,
            isArray: Array.isArray(response.data),
            firstItem: response.data[0]
          });

          if (!Array.isArray(response.data)) {
            console.error('[ERROR] Response data is not an array:', response.data);
            toast.error("Format de données invalide");
            return;
          }

          let filteredConges = response.data;

          if (['admin', 'gestionnaire'].includes(getFrontendRole(user.role))) {
            filteredConges = response.data.filter(conge => conge.statut === "en attente");
          } else {
            filteredConges = response.data.filter(conge => !conge.readByAgent);
          }

          setConges(filteredConges);
          console.log('[FETCH] Conges state updated:', filteredConges.length, 'items');
        } catch (error) {
          console.error('[FETCH ERROR] Details:', {
            error: error,
            response: error.response,
            message: error.message,
            config: error.config
          });
          toast.error(error.response?.data?.error || "Erreur de chargement");
        } finally {
          setLoading(false);
          console.log('[FETCH] Loading set to false');
        }
      };

      useEffect(() => {
        console.log('[EFFECT] Component mounted, fetching conges...');
        fetchConges();
      }, []);

      const handleStatusUpdate = async (id, statut) => {
        console.log('[UPDATE] Handling status update:', { id, statut });
        try {
          const response = await axios.put(
            `${import.meta.env.VITE_APP_API_URL}/api/conges/${id}`,
            { statut },
            { headers: { Authorization: `Bearer ${user.token}` } }
          );

          console.log('[UPDATE] Success:', response.data);
          toast.success("Demande mise à jour ✓");

          setConges(prevConges => {
            if (getFrontendRole(user.role) === 'agent') {
              return prevConges.map(conge =>
                conge._id === id ? { ...conge, statut } : conge
              );
            }
            return prevConges.filter(conge => conge._id !== id);
          });

          setShowModal(false);
        } catch (error) {
          console.error('[UPDATE ERROR] Details:', error.response || error);
          toast.error(error.response?.data?.error || "Échec de la mise à jour ✗");
        }
      };

      const markAsRead = async (id) => {
        try {
          const response = await axios.patch(
            `${import.meta.env.VITE_APP_API_URL}/api/conges/${id}/mark-read`,
            {},
            { headers: { Authorization: `Bearer ${user.token}` } }
          );

          console.log('[MARK AS READ] Success:', response.data);
          toast.success("Demande marquée comme lue ✓");

          setConges(prevConges => prevConges.filter(conge => conge._id !== id));
        } catch (error) {
          console.error('[MARK AS READ ERROR] Details:', error.response || error);
          toast.error(error.response?.data?.error || "Échec de la mise à jour ✗");
        }
      };

      const backendRole = user.role;
      const isManagement = ['CHEFCENTRE', 'GESTIONNAIRE', 'ADMIN']
  .map(role => role.toUpperCase())
  .includes(backendRole?.toUpperCase());

      console.log('[RENDER] Current state:', {
        loading,
        conges: conges.length,
        isManagement,
        backendRole,
        firstConge: conges[0]
      });
      const hasAgentActions = conges.some(c => c.statut === "approuvé" || c.statut === "rejeté");

      return (
        <div className="card border">
          <ToastContainer />
          <div className="card-header bg-light">
            <h5 className="mb-0 d-flex align-items-center">
              <i className="bx bx-calendar-event me-2 fs-4 text-dark"></i>
              {getFrontendRole(backendRole) === 'agent'
                ? "Mes demandes de congés"
                : "Gestion des demandes de congés"}
            </h5>
          </div>

          <div className="card-body">
            {loading ? (
              <div className="text-center py-5">
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Chargement...</span>
                </div>
                <p className="mt-2">Chargement en cours...</p>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table table-hover align-middle">
                  <thead className="table-light">
                    <tr>
                      {isManagement && (
                        <>
                          <th className="text-primary">
                            <i className="bx bx-id-card me-1"></i>
                            Matricule
                          </th>
                          <th>Nom</th>
                          <th>Prénom</th>
                        </>
                      )}
                      <th className="text-success">Date Début</th>
                      <th className="text-danger">Date Fin</th>
                      <th className="text-info">Durée</th>
                      <th className="text-warning">Type</th>
                      <th className="text-secondary">Statut</th>
                     {getFrontendRole(user.role) === 'agent' && hasAgentActions && (
      <th className="text-dark">Actions</th>
    )}
                      {isManagement && <th className="text-dark">Actions</th>}
                    </tr>
                  </thead>

                  <tbody>
                    {console.log('[RENDER TABLE] Rendering table with', conges.length, 'items')}
                    {conges.map((conge, index) => {
                      console.log(`[RENDER ITEM ${index}]`, conge);
                      return (
                        <tr key={conge._id || index}>
                          {isManagement && (
                            <>
                              <td>{conge.matricule || 'N/A'}</td>
                              <td>{conge.nom || 'N/A'}</td>
                              <td>{conge.prenom || 'N/A'}</td>
                            </>
                          )}
                          <td>
                            {conge.dateDebut
                              ? moment(conge.dateDebut).format("DD/MM/YYYY")
                              : 'Date invalide'}
                          </td>
                          <td>
                            {conge.dateFin
                              ? moment(conge.dateFin).format("DD/MM/YYYY")
                              : 'Date invalide'}
                          </td>
                          <td>{conge.duree || '0'} jours</td>
                          <td>{conge.type || 'Non spécifié'}</td>
                          <td>{getStatusBadge(conge.statut || 'en attente')}</td>
                         {getFrontendRole(user.role) === 'agent' && hasAgentActions && (
  <td>
    {(conge.statut === "approuvé" || conge.statut === "rejeté") && (
      <button
        className="btn btn-sm btn-outline-secondary"
        onClick={() => { 
          markAsRead(conge._id);
        }}
      >
        <i className="bx bx-check"></i>
      </button>
    )}
  </td>
)}

                          {isManagement && (
                            <td>
                              {conge.statut === "en attente" && (
                                <button
                                  className="btn btn-primary btn-sm"
                                  onClick={() => {
                                    console.log('[CLICK] Selected conge:', conge);
                                    setSelectedConge(conge);
                                    setShowModal(true);
                                  }}
                                >
                                  <i className="bx bx-edit me-1"></i>
                                  Traiter
                                </button>
                              )}
                            </td>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>

                {conges.length === 0 && (
                  <div className="text-center py-5 bg-light rounded-3">
                    <i className="bx bx-folder-open fs-1 text-muted mb-3"></i>
                    <h5 className="text-muted">
                      {getFrontendRole(backendRole) === 'agent'
                        ? "Aucune demande de congé trouvée"
                        : "Aucune demande en attente"}
                    </h5>
                  </div>
                )}
              </div>
            )}
          </div>

          <Modal
            isOpen={showModal}
            onRequestClose={() => setShowModal(false)}
            contentLabel="Traiter la demande de congé"
            className="modal-content"
            overlayClassName="modal-overlay"
          >
            <h2 className="text-center mb-4">Traiter la demande de congé</h2>
            {selectedConge && (
              <div className="conge-details">
                <div className="mb-3 d-flex align-items-center">
                  <i className="bx bx-id-card me-2 text-primary"></i>
                  <strong>Matricule:</strong> {selectedConge.matricule}
                </div>
                <div className="mb-3 d-flex align-items-center">
                  <i className="bx bx-user me-2 text-secondary"></i>
                  <strong>Nom:</strong> {selectedConge.nom}
                </div>
                <div className="mb-3 d-flex align-items-center">
                  <i className="bx bx-user me-2 text-secondary"></i>
                  <strong>Prénom:</strong> {selectedConge.prenom}
                </div>
                <div className="mb-3 d-flex align-items-center">
                  <i className="bx bx-calendar me-2 text-success"></i>
                  <strong>Date Début:</strong> {moment(selectedConge.dateDebut).format("DD/MM/YYYY")}
                </div>
                <div className="mb-3 d-flex align-items-center">
                  <i className="bx bx-calendar me-2 text-danger"></i>
                  <strong>Date Fin:</strong> {moment(selectedConge.dateFin).format("DD/MM/YYYY")}
                </div>
                <div className="mb-3 d-flex align-items-center">
                  <i className="bx bx-time me-2 text-info"></i>
                  <strong>Durée:</strong> {selectedConge.duree} jours
                </div>
                <div className="mb-3 d-flex align-items-center">
                  <i className="bx bx-category me-2 text-warning"></i>
                  <strong>Type:</strong> {selectedConge.type}
                </div>
                <div className="mb-3 d-flex align-items-center">
                  <i className="bx bx-info-circle me-2 text-secondary"></i>
                  <strong>Statut actuel:</strong> {getStatusBadge(selectedConge.statut)}
                </div>
              </div>
            )}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleStatusUpdate(selectedConge._id, status);
              }}
            >
              <div className="form-group mb-3">
                <label>Nouveau Statut</label>
                <select
                  className="form-control"
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  required
                >
                  <option value="">Sélectionnez un statut</option>
                  <option value="approuvé">Approuvé</option>
                  <option value="rejeté">Rejeté</option>
                </select>
              </div>
              <div className="d-flex justify-content-end">
                <button type="submit" className="btn btn-primary me-2">
                  Valider
                </button>
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                  Annuler
                </button>
              </div>
            </form>
          </Modal>
        </div>
      );
    };

    export default ListeCongesPage;
