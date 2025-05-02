import { AccountWrapper } from "../../components/wrapper/AccountWrapper";
import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import api from "../../api/api";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export const AccountPage = () => {
    const { user, updateUser } = useAuth();
    const [userData, setUserData] = useState(null);
    const [originalData, setOriginalData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);

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

            if (!hasRealChanges(updatedData)) {
                throw new Error("Aucune modification détectée");
            }

            if (updatedData.newPassword && !updatedData.currentPassword) {
                throw new Error("Le mot de passe actuel est requis");
            }

            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            const phoneRegex = /^[0-9]{8}$/;

            if (!emailRegex.test(updatedData.email)) {
                throw new Error("Email invalide");
            }
            if (!phoneRegex.test(updatedData.tel)) {
                throw new Error("Téléphone doit contenir 8 chiffres");
            }

            const response = await api.put("/auth/me", updatedData);
            
            if (response.data.message === "Aucun changement détecté") {
                toast.info("Aucune modification effectuée");
            } else {
                updateUser(response.data);
                setUserData(response.data);
                setOriginalData(response.data);
                toast.success("Profil mis à jour !");
            }
            
            setIsEditing(false);
        } catch (error) {
            const message = error.response?.data?.message || error.message;
            toast.error(message);
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
            <ToastContainer />

            <div className="card mb-4">
                <h5 className="card-header">Profil</h5>
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
                                <label className="form-label">Nom</label>
                                <input
                                    name="nom"
                                    className="form-control"
                                    defaultValue={userData.nom}
                                    disabled={!isEditing}
                                    required
                                />
                            </div>
                            <div className="col-md-6">
                                <label className="form-label">Prénom</label>
                                <input
                                    name="prenom"
                                    className="form-control"
                                    defaultValue={userData.prenom}
                                    disabled={!isEditing}
                                    required
                                />
                            </div>
                            <div className="col-md-6">
                                <label className="form-label">Email</label>
                                <input
                                    type="email"
                                    name="email"
                                    className="form-control"
                                    defaultValue={userData.email}
                                    disabled={!isEditing}
                                    required
                                />
                            </div>
                            <div className="col-md-6">
                                <label className="form-label">Téléphone</label>
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

                            {isEditing && (
                                <>
                                    <div className="col-md-6">
                                        <label className="form-label">Mot de passe actuel</label>
                                        <input
                                            type="password"
                                            name="currentPassword"
                                            className="form-control"
                                            placeholder="••••••••"
                                            required={!!userData.newPassword}
                                        />
                                    </div>
                                    <div className="col-md-6">
                                        <label className="form-label">Nouveau mot de passe</label>
                                        <input
                                            type="password"
                                            name="newPassword"
                                            className="form-control"
                                            placeholder="••••••••"
                                            minLength="6"
                                        />
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
                                    <button type="submit" className="btn btn-primary">
                                        <i className="bx bx-save me-1"></i> Enregistrer
                                    </button>
                                    <button
                                        type="button"
                                        className="btn btn-outline-secondary"
                                        onClick={() => setIsEditing(false)}
                                    >
                                        <i className="bx bx-reset me-1"></i> Annuler
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