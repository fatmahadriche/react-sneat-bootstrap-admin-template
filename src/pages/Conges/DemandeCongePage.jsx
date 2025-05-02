import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import moment from "moment";
import "./DemandeCongeModal.css";

const DemandeCongePage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    dateDebut: "",
    dateFin: "",
    type: "Congé annuel",
    duree: 0,
  });
  const [errors, setErrors] = useState({});
  const [showConfirmation, setShowConfirmation] = useState(false);

  useEffect(() => {
    if (formData.dateDebut && formData.dateFin) {
      const start = moment(formData.dateDebut);
      const end = moment(formData.dateFin);
      if (end.isBefore(start)) return;
      setFormData(prev => ({
        ...prev,
        duree: end.diff(start, "days") + 1
      }));
    }
  }, [formData.dateDebut, formData.dateFin]);

  const validate = () => {
    const newErrors = {};
    if (!formData.dateDebut) newErrors.dateDebut = "Date début requise";
    if (!formData.dateFin) newErrors.dateFin = "Date fin requise";
    if (moment(formData.dateFin).isBefore(formData.dateDebut)) {
      newErrors.dateFin = "Date fin invalide";
    }
    if (formData.duree < 1) newErrors.duree = "Durée invalide";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return toast.error("Corrigez les erreurs");

    setShowConfirmation(true);
  };

  const confirmSubmit = async () => {
    try {
      const response = await axios.post(
        `${import.meta.env.VITE_APP_API_URL}/api/conges`,
        {
          dateDebut: formData.dateDebut,
          dateFin: formData.dateFin,
          type: formData.type
        },
        {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        }
      );

      toast.success("Demande envoyée avec succès!");
      setTimeout(() => navigate("/liste-conges"), 2000);
    } catch (error) {
      toast.error(error.response?.data?.error || "Erreur lors de l'envoi");
    } finally {
      setShowConfirmation(false);
    }
  };

  return (
    <div className="card mb-4 custom-form-card">
      <h5 className="card-header d-flex align-items-center">
        <i className="bx bx-calendar-plus me-2" style={{ fontSize: "1.5rem", color: "#2a5c7d" }}></i>
        Nouvelle demande de congés
      </h5>
      <div className="card-body">
        <form onSubmit={handleSubmit}>
          <div className="row">
            <div className="mb-3 col-md-6">
              <label className="form-label">
                <i className="bx bx-id-card me-1 text-primary"></i>
                Matricule
              </label>
              <input
                type="text"
                className="form-control"
                value={user.matricule}
                readOnly
              />
            </div>

            <div className="mb-3 col-md-6">
              <label className="form-label">
                <i className="bx bx-user me-1 text-success"></i>
                Nom complet
              </label>
              <input
                type="text"
                className="form-control"
                value={`${user.nom} ${user.prenom}`}
                readOnly
              />
            </div>

            <div className="mb-3 col-md-6">
              <label className="form-label">
                <i className="bx bx-calendar me-1 text-danger"></i>
                Date début
              </label>
              <input
                type="date"
                className={`form-control ${errors.dateDebut && "is-invalid"}`}
                value={formData.dateDebut}
                onChange={(e) => setFormData({ ...formData, dateDebut: e.target.value })}
              />
              {errors.dateDebut && <div className="invalid-feedback">{errors.dateDebut}</div>}
            </div>

            <div className="mb-3 col-md-6">
              <label className="form-label">
                <i className="bx bx-calendar-event me-1 text-warning"></i>
                Date fin
              </label>
              <input
                type="date"
                className={`form-control ${errors.dateFin && "is-invalid"}`}
                value={formData.dateFin}
                onChange={(e) => setFormData({ ...formData, dateFin: e.target.value })}
              />
              {errors.dateFin && <div className="invalid-feedback">{errors.dateFin}</div>}
            </div>

            <div className="mb-3 col-md-6">
              <label className="form-label">
                <i className="bx bx-time me-1 text-info"></i>
                Durée (jours)
              </label>
              <input
                type="number"
                className="form-control"
                value={formData.duree}
                readOnly
              />
            </div>

            <div className="mb-3 col-md-6">
              <label className="form-label">
                <i className="bx bx-list-check me-1 text-purple"></i>
                Type de congé
              </label>
              <select
                className="form-select"
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              >
                <option value="Congé annuel">Congé annuel</option>
                <option value="Congé maladie">Congé maladie</option>
                <option value="Accident de travail">Accident de travail</option>
                <option value="Repos compensatoire">Repos compensatoire</option>
              </select>
            </div>
          </div>

          <div className="mt-4 d-flex gap-3">
            <button type="submit" className="btn btn-primary">
              <i className="bx bx-send me-2"></i>
              Soumettre
            </button>
            <button type="button" className="btn btn-outline-secondary" onClick={() => navigate(-1)}>
              <i className="bx bx-x me-2"></i>
              Annuler
            </button>
          </div>
        </form>

        {showConfirmation && (
          <div className="modal-overlay global-z-index">
            <div className="modal-content">
              <h2 className="modal-title">
                <i className="bx bx-check-shield me-2"></i>
                Confirmer la demande
              </h2>
              <div className="modal-details">
                <p><strong>Type:</strong> {formData.type}</p>
                <p><strong>Du:</strong> {moment(formData.dateDebut).format("DD/MM/YYYY")}</p>
                <p><strong>Au:</strong> {moment(formData.dateFin).format("DD/MM/YYYY")}</p>
                <p><strong>Durée:</strong> {formData.duree} jour(s)</p>
              </div>
              <div className="modal-buttons">
                <button className="btn btn-success" onClick={confirmSubmit}>
                  <i className="bx bx-check me-2"></i>
                  Confirmer
                </button>
                <button className="btn btn-outline-danger" onClick={() => setShowConfirmation(false)}>
                  <i className="bx bx-x me-2"></i>
                  Annuler
                </button>
              </div>
            </div>
          </div>
        )}

        <ToastContainer />
      </div>
    </div>
  );
};

export default DemandeCongePage;