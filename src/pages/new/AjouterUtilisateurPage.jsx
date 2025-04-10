import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/authContext"; // Assurez-vous que le chemin est correct
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./AjouterUtilisateurModal.css";

const AjouterUtilisateurPage = () => {
    const [userData, setUserData] = useState({
        matricule: "",
        nom: "",
        prenom: "",
        email: "",
        tel: "",
        password: "",
        role: "agent", // Rôle par défaut
    });

    const [errors, setErrors] = useState({});
    const [showConfirmation, setShowConfirmation] = useState(false);

    const { user } = useAuth(); // Récupérer l'utilisateur connecté
    const navigate = useNavigate();

    // Validation des champs
    const validate = () => {
        let tempErrors = {};
        if (!userData.matricule.match(/^\d{5}$/)) {
            tempErrors.matricule = "Le matricule doit contenir exactement 5 chiffres.";
        }
        if (!userData.nom.trim()) {
            tempErrors.nom = "Le nom est requis.";
        }
        if (!userData.prenom.trim()) {
            tempErrors.prenom = "Le prénom est requis.";
        }
        if (!userData.email.match(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/)) {
            tempErrors.email = "Veuillez entrer un email valide.";
        }
        if (!userData.tel.match(/^\d{8}$/)) {
            tempErrors.tel = "Le numéro de téléphone doit contenir 8 chiffres.";
        }
        if (userData.password.length < 6) {
            tempErrors.password = "Le mot de passe doit contenir au moins 6 caractères.";
        }

        setErrors(tempErrors);
        return Object.keys(tempErrors).length === 0;
    };

    // Gestion de la soumission du formulaire
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (validate()) {
            setShowConfirmation(true);
            console.log("Validation réussie, confirmation affichée");
        } else {
            toast.error("Veuillez corriger les erreurs avant de continuer.");
            console.log("Erreurs de validation", errors);
        }
    };


    const handleConfirm = async () => {
        setShowConfirmation(false);
        try {
            const res = await axios.post(
                `${import.meta.env.VITE_APP_API_URL}/auth/admin/create-user`,
                userData,
                {
                    headers: {
                        Authorization: `Bearer ${user.token}`, // Enlevez la vérification inutile
                        'Content-Type': 'application/json', // Ajoutez explicitement le Content-Type
                    },
                }
            );

            toast.success("Utilisateur créé avec succès !");
            setTimeout(() => {
                navigate("/utilisateurs");
            }, 2000);
        } catch (err) {
            console.error("Erreur :", err.response?.data || err);
            toast.error(err.response?.data?.message || "Erreur lors de la création");
        }
    };

    return (
        <div className="card mb-4 custom-form-card">
            <h5 className="card-header d-flex align-items-center">
                <i className="bx bx-user-plus me-2" style={{ fontSize: "1.5rem", color: "#2a5c7d" }}></i>
                Ajouter un utilisateur
            </h5>
            <div className="card-body">
                <form onSubmit={handleSubmit}>
                    <div className="row">
                        {/* Matricule */}
                        <div className="mb-3 col-md-6">
                            <label htmlFor="matricule" className="form-label">
                                <i className="bx bx-id-card me-1 text-primary"></i>
                                Matricule
                            </label>
                            <input
                                type="text"
                                className="form-control input-style"
                                id="matricule"
                                name="matricule"
                                value={userData.matricule}
                                onChange={(e) => setUserData({ ...userData, matricule: e.target.value })}
                            />
                            {errors.matricule && <span className="text-danger small">{errors.matricule}</span>}
                        </div>

                        {/* Nom */}
                        <div className="mb-3 col-md-6">
                            <label htmlFor="nom" className="form-label">
                                <i className="bx bx-user me-1 text-success"></i>
                                Nom
                            </label>
                            <input
                                type="text"
                                className="form-control input-style"
                                id="nom"
                                name="nom"
                                value={userData.nom}
                                onChange={(e) => setUserData({ ...userData, nom: e.target.value })}
                            />
                            {errors.nom && <span className="text-danger small">{errors.nom}</span>}
                        </div>

                        {/* Prénom */}
                        <div className="mb-3 col-md-6">
                            <label htmlFor="prenom" className="form-label">
                                <i className="bx bx-user-pin me-1 text-warning"></i>
                                Prénom
                            </label>
                            <input
                                type="text"
                                className="form-control input-style"
                                id="prenom"
                                name="prenom"
                                value={userData.prenom}
                                onChange={(e) => setUserData({ ...userData, prenom: e.target.value })}
                            />
                            {errors.prenom && <span className="text-danger small">{errors.prenom}</span>}
                        </div>

                        {/* Email */}
                        <div className="mb-3 col-md-6">
                            <label htmlFor="email" className="form-label">
                                <i className="bx bx-envelope me-1 text-danger"></i>
                                Email
                            </label>
                            <input
                                type="email"
                                className="form-control input-style"
                                id="email"
                                name="email"
                                value={userData.email}
                                onChange={(e) => setUserData({ ...userData, email: e.target.value })}
                            />
                            {errors.email && <span className="text-danger small">{errors.email}</span>}
                        </div>

                        {/* Téléphone */}
                        <div className="mb-3 col-md-6">
                            <label htmlFor="tel" className="form-label">
                                <i className="bx bx-phone me-1 text-info"></i>
                                Téléphone
                            </label>
                            <input
                                type="text"
                                className="form-control input-style"
                                id="tel"
                                name="tel"
                                value={userData.tel}
                                onChange={(e) => setUserData({ ...userData, tel: e.target.value })}
                            />
                            {errors.tel && <span className="text-danger small">{errors.tel}</span>}
                        </div>

                        {/* Mot de passe */}
                        <div className="mb-3 col-md-6">
                            <label htmlFor="password" className="form-label">
                                <i className="bx bx-lock-alt me-1 text-secondary"></i>
                                Mot de passe
                            </label>
                            <input
                                type="password"
                                className="form-control input-style"
                                id="password"
                                name="password"
                                value={userData.password}
                                onChange={(e) => setUserData({ ...userData, password: e.target.value })}
                            />
                            {errors.password && <span className="text-danger small">{errors.password}</span>}
                        </div>

                        {/* Rôle */}
                        <div className="mb-3 col-md-6">
                            <label htmlFor="role" className="form-label">
                                <i className="bx bx-shield me-1 text-purple"></i>
                                Rôle
                            </label>
                            <select
                                className="form-select input-style"
                                id="role"
                                name="role"
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
                        <button type="submit" className="btn btn-primary btn-add">
                            <i className="bx bx-plus-circle me-2"></i>
                            Ajouter
                        </button>
                        <button type="reset" className="btn btn-outline-secondary btn-cancel">
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
                                Confirmer l'ajout
                            </h2>
                            {Object.keys(userData).map(
                                (key) =>
                                    key !== "password" && (
                                        <p key={key} className="modal-detail">
                                            <i className={`bx bx-${getFieldIcon(key)} me-2`}></i>
                                            <strong>{getFieldLabel(key)} :</strong> {userData[key]}
                                        </p>
                                    )
                            )}
                            <div className="modal-buttons">
                                <button className="btn btn-success btn-confirm" onClick={handleConfirm}>
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

// Fonction utilitaire pour les icônes de la modal
const getFieldIcon = (field) => {
    const icons = {
        matricule: 'id-card',
        nom: 'user',
        prenom: 'user-voice',
        email: 'envelope',
        tel: 'phone',
        role: 'shield'
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
        role: 'Rôle'
    };
    return labels[field] || field;
};

export default AjouterUtilisateurPage;