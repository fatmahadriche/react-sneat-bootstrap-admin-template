import React, { useState, useEffect } from "react";
 // Assurez-vous que le chemin est correct
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useAuth } from "../context/authContext";
import { useNavigate } from "react-router-dom";

const ListeUtilisateursPage = () => {
    const [users, setUsers] = useState([]); // État pour stocker les utilisateurs
    const { user } = useAuth(); 
    const navigate = useNavigate();// Récupérer l'utilisateur connecté

    // Fonction pour récupérer les utilisateurs depuis l'API
    const fetchUsers = async () => {
        try {
            const res = await axios.get(`${import.meta.env.VITE_APP_API_URL}/auth/admin/users`, {
                headers: {
                    Authorization: `Bearer ${user.token}`,
                },
            });
            setUsers(res.data); // Mettre à jour l'état avec les utilisateurs récupérés
        } catch (err) {
            console.error("Erreur lors de la récupération des utilisateurs :", err);
            toast.error("Erreur lors de la récupération des utilisateurs");
        }
    };

    // Fonction pour supprimer un utilisateur
    const handleDelete = async (userId) => {
        try {
            await axios.delete(`${import.meta.env.VITE_APP_API_URL}/auth/admin/delete-user/${userId}`, {
                headers: {
                    Authorization: `Bearer ${user.token}`,
                },
            });
            toast.success("Utilisateur supprimé avec succès !");
            fetchUsers(); // Recharger la liste des utilisateurs après suppression
        } catch (err) {
            console.error("Erreur lors de la suppression de l'utilisateur :", err);
            toast.error("Erreur lors de la suppression de l'utilisateur");
        }
    };

    // Charger les utilisateurs au montage du composant
    useEffect(() => {
        fetchUsers();
    }, []);

    return (
        <div className="card">
            <h5 className="card-header">Liste des utilisateurs</h5>
            <div className="table-responsive text-nowrap">
                <table className="table">
                    <caption className="ms-4">Liste des utilisateurs</caption>
                    <thead>
                        <tr>
                            <th>Matricule</th>
                            <th>Nom</th>
                            <th>Prénom</th>
                            <th>Email</th>
                            <th>Téléphone</th>
                            <th>Rôle</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map((user) => (
                            <tr key={user._id}>
                                <td>{user.matricule}</td>
                                <td>{user.nom}</td>
                                <td>{user.prenom}</td>
                                <td>{user.email}</td>
                                <td>{user.tel}</td>
                                <td>
                                    <span className={`badge bg-label-${user.role === "admin" ? "danger" : "primary"} me-1`}>
                                        {user.role}
                                    </span>
                                </td>
                                <td>
                                    <div className="dropdown">
                                        <button
                                            aria-label="Actions"
                                            type="button"
                                            className="btn p-0 dropdown-toggle hide-arrow"
                                            data-bs-toggle="dropdown"
                                        >
                                            <i className="bx bx-dots-vertical-rounded"></i>
                                        </button>
                                        <div className="dropdown-menu">
                                            <button
                                                aria-label="Modifier"
                                                className="dropdown-item"
                                                onClick={() => {
                                                    // Utilisez navigate pour rediriger
                                                    navigate(`/utilisateurs/${user._id}`);
                                                }}
                                            >
                                                <i className="bx bx-edit-alt me-1"></i> Modifier
                                            </button>
                                            <button
                                                aria-label="Supprimer"
                                                className="dropdown-item"
                                                onClick={() => handleDelete(user._id)}
                                            >
                                                <i className="bx bx-trash me-1"></i> Supprimer
                                            </button>
                                        </div>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <ToastContainer
                position="top-right"
                autoClose={5000}
                hideProgressBar={false}
                newestOnTop={false}
                closeOnClick
                rtl={false}
                pauseOnFocusLoss
                draggable
                pauseOnHover
            />
        </div>
    );
};

export default ListeUtilisateursPage;