import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/authContext";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./ModifierUtilisateurModal.css";

const ModifierUtilisateurPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();

    const [userData, setUserData] = useState({
        matricule: "",
        nom: "",
        prenom: "",
        email: "",
        tel: "",
        password: "", // Ajout du champ mot de passe
        role: "agent",
    });

    const [loading, setLoading] = useState(true);
    const [errors, setErrors] = useState({});
    const [showConfirmation, setShowConfirmation] = useState(false);

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const response = await axios.get(
                    `${import.meta.env.VITE_APP_API_URL}/auth/admin/users/${id}`,
                    {
                        headers: {
                            Authorization: `Bearer ${user.token}`,
                        },
                    }
                );
                setUserData(response.data);
            } catch (error) {
                console.error("Erreur :", error.response?.data || error.message);
                toast.error(error.response?.data?.message || "Impossible de récupérer l'utilisateur.");
                navigate("/utilisateurs");
            } finally {
                setLoading(false);
            }
        };

        fetchUser();
    }, [id, user.token, navigate]);

    const validate = () => {
        let tempErrors = {};
        if (!userData.matricule.match(/^\d{5}$/)) tempErrors.matricule = "Matricule invalide (5 chiffres)";
        if (!userData.nom.trim()) tempErrors.nom = "Nom requis";
        if (!userData.prenom.trim()) tempErrors.prenom = "Prénom requis";
        if (!userData.email.match(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/)) tempErrors.email = "Email invalide";
        if (!userData.tel.match(/^\d{8}$/)) tempErrors.tel = "Téléphone invalide (8 chiffres)";
        // Modification de la validation du mot de passe
        if (userData.password && !/^(?=.*[a-zA-Z])(?=.*\d).{8,}$/.test(userData.password)) {
            tempErrors.password = "Le mot de passe doit contenir 8 caractères avec lettre+chiffre";
        }


        setErrors(tempErrors);
        return Object.keys(tempErrors).length === 0;
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        validate() ? setShowConfirmation(true) : toast.error("Veuillez corriger les erreurs");
    };

    const handleConfirm = async () => {
        setShowConfirmation(false);
        try {
            const dataToSend = { ...userData };
            if (!dataToSend.password) delete dataToSend.password;
            await axios.put(
                `${import.meta.env.VITE_APP_API_URL}/auth/admin/update-user/${id}`,
                userData,
                {
                    headers: {
                        Authorization: `Bearer ${user.token}`,
                        'Content-Type': 'application/json'
                    }
                }
            );
            toast.success("Modification réussie !");
            setTimeout(() => navigate("/utilisateurs"), 1500);
        } catch (error) {
            console.error("Erreur :", error);
            toast.error(error.response?.data?.message || "Erreur lors de la modification");
        }
    };

    if (loading) {
        return (
            <div className="loading-overlay">
                <div className="loading-spinner"></div>
            </div>
        );
    }

    return (
        <div className="card mb-4 custom-form-card">
            <h5 className="card-header d-flex align-items-center">
                <i className="bx bx-edit me-2" style={{ fontSize: "1.5rem", color: "#2a5c7d" }}></i>
                Modifier l'utilisateur
            </h5>

            <div className="card-body">
                <form onSubmit={handleSubmit}>
                    <div className="row">
                        {/* Champs du formulaire avec ajout du mot de passe */}
                        {['matricule', 'nom', 'prenom', 'email', 'tel', 'password'].map((field) => (
                            <div className="mb-3 col-md-6" key={field}>
                                <label htmlFor={field} className="form-label">
                                    <i className={`bx bx-${getFieldIcon(field)} me-1 ${getFieldColor(field)}`}></i>
                                    {getFieldLabel(field)}
                                </label>
                                <input
                                    type={field === 'email' ? 'email' : field === 'password' ? 'password' : 'text'}
                                    className={`form-control input-style ${errors[field] ? 'is-invalid' : ''}`}
                                    id={field}
                                    value={userData[field] || ""}
                                    onChange={(e) => setUserData({ ...userData, [field]: e.target.value })}
                                    disabled={field === 'matricule'}
                                />
                                {errors[field] && <div className="invalid-feedback">{errors[field]}</div>}
                            </div>
                        ))}

                        {/* Sélecteur de rôle */}
                        <div className="mb-3 col-md-6">
                            <label htmlFor="role" className="form-label">
                                <i className="bx bx-shield me-1 text-purple"></i>
                                Rôle
                            </label>
                            <select
                                className="form-select input-style"
                                id="role"
                                value={userData.role}
                                onChange={(e) => setUserData({ ...userData, role: e.target.value })}
                            >
                                <option value="admin">Admin</option>
                                <option value="agent">Agent</option>
                                <option value="gestionnaire">Gestionnaire</option>
                            </select>
                        </div>
                    </div>

                    <div className="mt-4 d-flex gap-3">
                        <button type="submit" className="btn btn-primary btn-save">
                            <i className="bx bx-save me-2"></i>
                            Enregistrer
                        </button>
                        <button
                            type="button"
                            className="btn btn-outline-secondary btn-cancel"
                            onClick={() => navigate("/utilisateurs")}
                        >
                            <i className="bx bx-x-circle me-2"></i>
                            Annuler
                        </button>
                    </div>
                </form>

                {/* Modal de confirmation */}
                {showConfirmation && (
                    <div className="modal-overlay global-z-index">
                        <div className="modal-content">
                            <h2 className="modal-title">
                                <i className="bx bx-check-shield me-2"></i>
                                Confirmer la modification
                            </h2>

                            <div className="changes-preview">
                                {['matricule', 'nom', 'prenom', 'email', 'tel', 'role'].map((key) => (
                                    <p key={key} className="modal-detail">
                                        <i className={`bx bx-${getFieldIcon(key)} me-2`}></i>
                                        <strong>{getFieldLabel(key)} :</strong>
                                        {key === 'role'
                                            ? userData[key].charAt(0).toUpperCase() + userData[key].slice(1).toLowerCase()
                                            : userData[key]}
                                    </p>
                                ))}
                            </div>

                            <div className="modal-buttons">
                                <button className="btn btn-success btn-confirm" onClick={handleConfirm}>
                                    <i className="bx bx-check me-2"></i>
                                    Confirmer
                                </button>
                                <button
                                    className="btn btn-outline-danger"
                                    onClick={() => setShowConfirmation(false)}
                                >
                                    <i className="bx bx-x me-2"></i>
                                    Annuler
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                <ToastContainer position="top-right" autoClose={5000} />
            </div>
        </div>
    );
};

// Fonctions utilitaires mises à jour
const getFieldIcon = (field) => {
    const icons = {
        matricule: 'id-card',
        nom: 'user',
        prenom: 'user-voice',
        email: 'envelope',
        tel: 'phone',
        role: 'shield',
        password: 'lock-alt' // Ajout de l'icône pour le mot de passe
    };
    return icons[field] || 'info-circle';
};

const getFieldLabel = (field) => {
    const labels = {
        matricule: 'Matricule',
        nom: 'Nom',
        prenom: 'Prénom',
        email: 'Email',
        tel: 'Téléphone',
        role: 'Rôle',
        password: 'Mot de passe' // Ajout du label pour le mot de passe
    };
    return labels[field] || field;
};

const getFieldColor = (field) => {
    const colors = {
        matricule: 'text-primary',
        nom: 'text-success',
        prenom: 'text-warning',
        email: 'text-danger',
        tel: 'text-info',
        role: 'text-purple',
        password: 'text-secondary' // Ajout de la couleur pour le mot de passe
    };
    return colors[field] || 'text-secondary';
};

export default ModifierUtilisateurPage;