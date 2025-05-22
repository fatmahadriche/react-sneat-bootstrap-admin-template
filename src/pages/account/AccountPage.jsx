import { AccountWrapper } from "../../components/wrapper/AccountWrapper";
import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import api from "../../api/api";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export const AccountPage = () => {
    const { user, updateUser, logout } = useAuth(); // Ajout de logout
    const [userData, setUserData] = useState(null);
    const [originalData, setOriginalData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [hasChanges, setHasChanges] = useState(false);

    useEffect(() => {
        const loadUserData = async () => {
            try {
                const response = await api.get("/auth/me");
                setUserData(response.data);
                setOriginalData(response.data);
            } catch (error) {
                toast.error("Erreur lors du chargement du profil");
            } finally {
                setIsLoading(false);
            }
        };
        loadUserData();
    }, []);

    const hasRealChanges = (updatedData) => {
        return Object.keys(updatedData).some(key => {
            if (key === 'currentPassword') return false;
            if (key === 'newPassword') return !!updatedData[key];
            return updatedData[key] !== originalData[key];
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const formData = new FormData(e.target);
            const updatedData = Object.fromEntries(formData.entries());

            // Vérifier si des modifications ont été effectuées
            if (!hasRealChanges(updatedData)) {
                throw new Error("Aucune modification détectée");
            }

            // Validation des champs
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            const phoneRegex = /^[0-9]{8}$/;

            if (!emailRegex.test(updatedData.email)) {
                throw new Error("Email invalide");
            }

            if (!phoneRegex.test(updatedData.tel)) {
                throw new Error("Téléphone doit contenir 8 chiffres");
            }

            // Vérification du mot de passe actuel si un nouveau mot de passe est fourni
            if (updatedData.newPassword && !updatedData.currentPassword) {
                throw new Error("Le mot de passe actuel est requis");
            }

            // Vérifier si le mot de passe va être modifié
            const isPasswordChange = updatedData.newPassword && updatedData.newPassword.trim() !== '';

            // Envoi des données mises à jour au backend
            const response = await api.put("/auth/me", updatedData);

            if (response.data.message === "Aucun changement détecté") {
                toast.info("Aucune modification effectuée");
            } else {
                // Si le mot de passe a été changé, déconnecter l'utilisateur
                if (isPasswordChange) {
                    toast.success("Mot de passe modifié avec succès ! Veuillez vous reconnecter.", {
                        autoClose: 3000,
                        onClose: () => {
                            // Déconnecter l'utilisateur après 3 secondes
                            setTimeout(() => {
                                logout();
                            }, 100);
                        }
                    });
                    return; // Sortir de la fonction pour éviter les autres mises à jour
                } else {
                    // Mise à jour normale (sans changement de mot de passe)
                    updateUser(response.data);
                    setUserData(response.data);
                    setOriginalData(response.data);
                    toast.success("Profil mis à jour !");
                }
            }

            setIsEditing(false);
            setHasChanges(false);
        } catch (error) {
            const message = error.response?.data?.message || error.message;
            toast.error(message);
        }
    };

    // Suivre les modifications dans le formulaire
    useEffect(() => {
        const form = document.querySelector("form");
        if (form) {
            const handleFormChange = () => {
                const formData = new FormData(form);
                const updatedData = Object.fromEntries(formData.entries());
                setHasChanges(hasRealChanges(updatedData));
            };

            form.addEventListener("input", handleFormChange);
            return () => {
                form.removeEventListener("input", handleFormChange);
            };
        }
    }, [isEditing]);

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
            <ToastContainer />

            {/* Style personnalisé pour le bouton Annuler */}
            <style>{`
                .btn-cancel-custom {
                    background-color: #dc3545;
                    color: white;
                    border: none;
                    font-weight: 500;
                    padding: 0.5rem 1rem;
                    border-radius: 6px;
                    transition: background-color 0.3s ease;
                }

                .btn-cancel-custom:hover {
                    background-color: #c82333;
                    color: white;
                }

                .btn-cancel-custom:focus {
                    outline: none;
                    box-shadow: 0 0 0 2px rgba(220, 53, 69, 0.5);
                }
            `}</style>

            <div className="card mb-4">
                <h5 className="card-header d-flex align-items-center">
                    <i className="bx bx-user me-2 text-primary"></i> Mon Profil
                </h5>
                <div className="card-body text-center">
                    <div className="d-flex flex-column align-items-center gap-3">
                        <div className="user-icon bg-primary rounded-circle d-flex align-items-center justify-content-center"
                            style={{ width: "80px", height: "80px" }}>
                            <i className="bx bx-user text-white" style={{ fontSize: "2rem" }}></i>
                        </div>
                        <p className="text-muted mb-0">{userData.nom} {userData.prenom}</p>
                    </div>
                </div>
            </div>

            <div className="card mb-4">
                <h5 className="card-header d-flex align-items-center">
                    <i className="bx bx-info-circle me-2 text-secondary"></i> Informations personnelles
                </h5>
                <div className="card-body">
                    <form onSubmit={handleSubmit}>
                        <div className="row g-3">

                            {/* Matricule */}
                            <div className="col-md-6">
                                <label className="form-label">
                                    <i className="bx bx-id-card me-1 text-primary"></i> Matricule
                                </label>
                                <input
                                    className="form-control"
                                    value={userData.matricule}
                                    readOnly
                                    disabled
                                />
                            </div>

                            {/* Rôle */}
                            <div className="col-md-6">
                                <label className="form-label">
                                    <i className="bx bx-shield-quarter me-1 text-danger"></i> Rôle
                                </label>
                                <input
                                    className="form-control"
                                    value={userData.role}
                                    readOnly
                                    disabled
                                />
                            </div>

                            {/* Nom */}
                            <div className="col-md-6">
                                <label className="form-label">
                                    <i className="bx bx-user me-1 text-success"></i> Nom
                                </label>
                                <input
                                    name="nom"
                                    className="form-control"
                                    defaultValue={userData.nom}
                                    disabled={!isEditing}
                                    required
                                />
                            </div>

                            {/* Prénom */}
                            <div className="col-md-6">
                                <label className="form-label">
                                    <i className="bx bx-user-circle me-1 text-warning"></i> Prénom
                                </label>
                                <input
                                    name="prenom"
                                    className="form-control"
                                    defaultValue={userData.prenom}
                                    disabled={!isEditing}
                                    required
                                />
                            </div>

                            {/* Email */}
                            <div className="col-md-6">
                                <label className="form-label">
                                    <i className="bx bx-envelope me-1 text-info"></i> Email
                                </label>
                                <input
                                    type="email"
                                    name="email"
                                    className="form-control"
                                    defaultValue={userData.email}
                                    disabled={!isEditing}
                                    required
                                />
                            </div>

                            {/* Téléphone */}
                            <div className="col-md-6">
                                <label className="form-label">
                                    <i className="bx bx-phone-call me-1 text-danger"></i> Téléphone
                                </label>
                                <div className="input-group">
                                    <span className="input-group-text">+216</span>
                                    <input
                                        type="tel"
                                        name="tel"
                                        className="form-control"
                                        defaultValue={userData.tel}
                                        pattern="[0-9]{8}"
                                        title="Numéro à 8 chiffres"
                                        disabled={!isEditing}
                                        required
                                    />
                                </div>
                            </div>

                            {/* Mot de passe - Conditionnel */}
                            {isEditing && (
                                <>
                                    <div className="col-md-6">
                                        <label className="form-label">
                                            <i className="bx bx-lock-alt me-1 text-dark"></i> Mot de passe actuel
                                        </label>
                                        <input
                                            type="password"
                                            name="currentPassword"
                                            className="form-control"
                                            placeholder="••••••••"
                                        />
                                        <small className="text-muted">
                                            Requis seulement si vous voulez changer votre mot de passe
                                        </small>
                                    </div>
                                    <div className="col-md-6">
                                        <label className="form-label">
                                            <i className="bx bx-lock-open-alt me-1 text-secondary"></i> Nouveau mot de passe
                                        </label>
                                        <input
                                            type="password"
                                            name="newPassword"
                                            className="form-control"
                                            placeholder="••••••••"
                                            minLength="6"
                                        />
                                        <small className="text-muted">
                                            Laissez vide pour conserver le mot de passe actuel
                                        </small>
                                    </div>
                                </>
                            )}
                        </div>

                        <div className="mt-4 d-flex gap-2">
                            {!isEditing ? (
                                <button
                                    type="button"
                                    className="btn btn-primary"
                                    onClick={() => setIsEditing(true)}
                                >
                                    <i className="bx bx-edit me-1"></i> Modifier
                                </button>
                            ) : (
                                <>
                                    <button
                                        type="submit"
                                        className={`btn ${hasChanges ? "btn-primary" : "btn-secondary"}`}
                                        disabled={!hasChanges}
                                    >
                                        <i className="bx bx-save me-1"></i> Enregistrer
                                    </button>
                                    <button
                                        type="button"
                                        className="btn btn-cancel-custom"
                                        onClick={() => {
                                            setIsEditing(false);
                                            setHasChanges(false);
                                        }}
                                    >
                                        <i className="bx bx-x me-1"></i> Annuler
                                    </button>
                                </>
                            )}
                        </div>
                    </form>
                </div>
            </div>
        </AccountWrapper>
    );
};