import { AccountWrapper } from "../../components/wrapper/AccountWrapper";
import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import api from "../../api/api";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Swal from "sweetalert2";

export const AccountPage = () => {
    const { user, updateUser, logout } = useAuth();
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [userData, setUserData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    // Chargement des données utilisateur
    useEffect(() => {
        const loadUserData = async () => {
            try {
                const response = await api.get("/auth/me");
                setUserData(response.data);
            } catch (error) {
                toast.error("Erreur lors du chargement du profil");
            } finally {
                setIsLoading(false);
            }
        };
        loadUserData();
    }, []);

    // Validation et soumission du formulaire
    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const formData = new FormData(e.target);
            const updatedData = Object.fromEntries(formData.entries());

            // Validation robuste des champs
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            const phoneRegex = /^[0-9]{8}$/;

            if (!emailRegex.test(updatedData.email)) {
                throw new Error("L'email n'est pas valide");
            }
            if (!phoneRegex.test(updatedData.tel)) {
                throw new Error("Le numéro de téléphone doit contenir exactement 8 chiffres");
            }

            // Envoi des modifications au backend
            const response = await api.put("/auth/me", updatedData);
            updateUser(response.data);
            setUserData(response.data);

            // Notification de succès
            toast.success("Profil mis à jour avec succès !");
        } catch (error) {
            // Notification d'erreur
            toast.error(error.message || "Erreur lors de la mise à jour");
        }
    };

    if (isLoading) {
        return (
            <AccountWrapper title="Chargement...">
                <div className="d-flex justify-content-center mt-5">
                    <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Chargement...</span>
                    </div>
                </div>
            </AccountWrapper>
        );
    }

    if (!userData) {
        return (
            <AccountWrapper title="Erreur">
                <div className="alert alert-danger">
                    Impossible de charger les données du profil
                </div>
            </AccountWrapper>
        );
    }

    return (
        <AccountWrapper title="Mon Profil">
            {/* Conteneur pour les notifications */}
            <ToastContainer />

            {/* Section Icône Utilisateur */}
            <div className="card mb-4">
                <h5 className="card-header">Profil</h5>
                <div className="card-body text-center">
                    <div className="d-flex flex-column align-items-center gap-3">
                        {/* Icône utilisateur stylisée */}
                        <div className="user-icon bg-primary rounded-circle d-flex align-items-center justify-content-center" style={{ width: "80px", height: "80px" }}>
                            <i className="bx bx-user text-white" style={{ fontSize: "2rem" }}></i>
                        </div>
                        <p className="text-muted mb-0">{userData.nom} {userData.prenom}</p>
                    </div>
                </div>
            </div>

            {/* Formulaire d'informations personnelles */}
            <div className="card mb-4">
                <h5 className="card-header">Informations personnelles</h5>
                <div className="card-body">
                    <form onSubmit={handleSubmit}>
                        <div className="row g-3">
                            <div className="col-md-6">
                                <label className="form-label">Matricule</label>
                                <input
                                    className="form-control"
                                    value={userData.matricule}
                                    readOnly
                                    disabled
                                />
                            </div>
                            <div className="col-md-6">
                                <label className="form-label">Rôle</label>
                                <input
                                    className="form-control"
                                    value={userData.role}
                                    readOnly
                                    disabled
                                />
                            </div>
                            <div className="col-md-6">
                                <label className="form-label">Nom <span className="text-danger">*</span></label>
                                <input
                                    name="nom"
                                    className="form-control"
                                    defaultValue={userData.nom}
                                    required
                                />
                            </div>
                            <div className="col-md-6">
                                <label className="form-label">Prénom <span className="text-danger">*</span></label>
                                <input
                                    name="prenom"
                                    className="form-control"
                                    defaultValue={userData.prenom}
                                    required
                                />
                            </div>
                            <div className="col-md-6">
                                <label className="form-label">Email <span className="text-danger">*</span></label>
                                <input
                                    type="email"
                                    name="email"
                                    className="form-control"
                                    defaultValue={userData.email}
                                    required
                                />
                            </div>
                            <div className="col-md-6">
                                <label className="form-label">Téléphone <span className="text-danger">*</span></label>
                                <div className="input-group">
                                    <span className="input-group-text">+216</span>
                                    <input
                                        type="tel"
                                        name="tel"
                                        className="form-control"
                                        defaultValue={userData.tel}
                                        pattern="[0-9]{8}"
                                        title="Numéro à 8 chiffres"
                                        required
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="mt-4 d-flex gap-2">
                            <button type="submit" className="btn btn-primary">
                                <i className="bx bx-save me-1"></i> Enregistrer
                            </button>
                            <button type="reset" className="btn btn-outline-secondary">
                                <i className="bx bx-reset me-1"></i> Annuler
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </AccountWrapper>
    );
};