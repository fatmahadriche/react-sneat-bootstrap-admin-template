import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/authContext";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

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
        role: "agent",
    });

    const [loading, setLoading] = useState(true); // État de chargement
    const [errors, setErrors] = useState({});
    const [showConfirmation, setShowConfirmation] = useState(false);

    // Récupérer les données de l'utilisateur
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
                setLoading(false); // Désactiver l'état de chargement
            }
        };

        fetchUser();
    }, [id, user.token, navigate]);

    // Afficher un indicateur de chargement
    if (loading) {
        return <div>Chargement en cours...</div>;
    }

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

        setErrors(tempErrors);
        return Object.keys(tempErrors).length === 0;
    };

    // Gestion de la soumission du formulaire
    const handleSubmit = (e) => {
        e.preventDefault();
        if (validate()) {
            setShowConfirmation(true);
        } else {
            toast.error("Veuillez corriger les erreurs avant de continuer.");
        }
    };

    // Confirmation de la modification
    const handleConfirm = async () => {
        setShowConfirmation(false);
        try {
            const response = await axios.put(
                `${import.meta.env.VITE_APP_API_URL}/auth/admin/update-user/${id}`,
                userData,
                {
                    headers: {
                        Authorization: `Bearer ${user.token}`,
                    },
                }
            );

            toast.success(response.data.message || "Utilisateur modifié avec succès !");
            setTimeout(() => {
                navigate("/utilisateurs");
            }, 2000);
        } catch (error) {
            console.error("Erreur :", error.response?.data || error.message);
            toast.error(error.response?.data?.message || "Erreur lors de la modification de l'utilisateur.");
        }
    };

    return (
        <div className="card mb-4">
            <h5 className="card-header">Modifier un utilisateur</h5>
            <div className="card-body">
                <form onSubmit={handleSubmit}>
                    <div className="row">
                        {/* Matricule */}
                        <div className="mb-3 col-md-6">
                            <label htmlFor="matricule" className="form-label">Matricule</label>
                            <input
                                type="text"
                                className="form-control"
                                id="matricule"
                                value={userData.matricule || ""} // Valeur par défaut
                                onChange={(e) => setUserData({ ...userData, matricule: e.target.value })}
                                disabled
                            />
                        </div>

                        {/* Nom */}
                        <div className="mb-3 col-md-6">
                            <label htmlFor="nom" className="form-label">Nom</label>
                            <input
                                type="text"
                                className="form-control"
                                id="nom"
                                value={userData.nom || ""} // Valeur par défaut
                                onChange={(e) => setUserData({ ...userData, nom: e.target.value })}
                            />
                            {errors.nom && <span className="text-danger">{errors.nom}</span>}
                        </div>

                        {/* Prénom */}
                        <div className="mb-3 col-md-6">
                            <label htmlFor="prenom" className="form-label">Prénom</label>
                            <input
                                type="text"
                                className="form-control"
                                id="prenom"
                                value={userData.prenom || ""} // Valeur par défaut
                                onChange={(e) => setUserData({ ...userData, prenom: e.target.value })}
                            />
                            {errors.prenom && <span className="text-danger">{errors.prenom}</span>}
                        </div>

                        {/* Email */}
                        <div className="mb-3 col-md-6">
                            <label htmlFor="email" className="form-label">Email</label>
                            <input
                                type="email"
                                className="form-control"
                                id="email"
                                value={userData.email || ""} // Valeur par défaut
                                onChange={(e) => setUserData({ ...userData, email: e.target.value })}
                            />
                            {errors.email && <span className="text-danger">{errors.email}</span>}
                        </div>

                        {/* Téléphone */}
                        <div className="mb-3 col-md-6">
                            <label htmlFor="tel" className="form-label">Téléphone</label>
                            <input
                                type="text"
                                className="form-control"
                                id="tel"
                                value={userData.tel || ""} // Valeur par défaut
                                onChange={(e) => setUserData({ ...userData, tel: e.target.value })}
                            />
                            {errors.tel && <span className="text-danger">{errors.tel}</span>}
                        </div>

                        {/* Rôle */}
                        <div className="mb-3 col-md-6">
                            <label htmlFor="role" className="form-label">Rôle</label>
                            <select
                                className="form-select"
                                id="role"
                                value={userData.role || "agent"} // Valeur par défaut
                                onChange={(e) => setUserData({ ...userData, role: e.target.value })}
                            >
                                <option value="admin">Admin</option>
                                <option value="agent">Agent</option>
                                <option value="gestionnaire">Gestionnaire</option>
                            </select>
                        </div>
                    </div>

                    <div className="mt-2">
                        <button type="submit" className="btn btn-primary me-2">Modifier</button>
                        <button type="button" className="btn btn-outline-secondary" onClick={() => navigate("/utilisateurs")}>Annuler</button>
                    </div>
                </form>
            </div>

            {/* Modal de confirmation */}
            {showConfirmation && (
                <div className="modal">
                    <div className="modal-content">
                        <h2>Confirmer la modification</h2>
                        <p>Êtes-vous sûr de vouloir modifier cet utilisateur ?</p>
                        <div className="modal-buttons">
                            <button className="btn btn-primary me-2" onClick={handleConfirm}>
                                Confirmer
                            </button>
                            <button className="btn btn-outline-secondary" onClick={() => setShowConfirmation(false)}>
                                Annuler
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <ToastContainer position="top-right" autoClose={5000} />
        </div>
    );
};

export default ModifierUtilisateurPage;