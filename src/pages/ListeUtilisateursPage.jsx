import React, { useState, useEffect } from "react";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useAuth } from "../context/authContext";
import { useNavigate } from "react-router-dom";
import Pagination from "../components/Pagination/Pagination";

const ListeUtilisateursPage = () => {
    const [users, setUsers] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(20);
    const [totalPages, setTotalPages] = useState(1);
    const [loading, setLoading] = useState(false);
    const { user } = useAuth();
    const navigate = useNavigate();

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const res = await axios.get(`${import.meta.env.VITE_APP_API_URL}/auth/admin/users`, {
                params: {
                    page: currentPage,
                    limit: itemsPerPage
                },
                headers: {
                    Authorization: `Bearer ${user.token}`,
                },
            });

            setUsers(res.data.users);
            setTotalPages(res.data.totalPages);
        } catch (err) {
            console.error("Erreur:", err.response?.data || err);
            toast.error(err.response?.data?.message || "Erreur serveur");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (userId) => {
        try {
            await axios.delete(`${import.meta.env.VITE_APP_API_URL}/auth/admin/delete-user/${userId}`, {
                headers: {
                    Authorization: `Bearer ${user.token}`,
                },
            });
            toast.success("Utilisateur supprimé !");
            fetchUsers();
        } catch (err) {
            console.error("Erreur:", err.response?.data || err);
            toast.error(err.response?.data?.message || "Erreur lors de la suppression");
        }
    };

    const handleItemsPerPageChange = (newValue) => {
        setItemsPerPage(Number(newValue));
        setCurrentPage(1);
    };

    useEffect(() => {
        fetchUsers();
    }, [currentPage, itemsPerPage]);

    return (
        <div className="card">
            <h5 className="card-header">Liste des utilisateurs</h5>
            <div className="card-body">
                {loading ? (
                    <div className="text-center py-5">
                        <div className="spinner-border text-primary" role="status">
                            <span className="visually-hidden">Chargement...</span>
                        </div>
                    </div>
                ) : (
                    <>
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
                                    {users.length > 0 ? (
                                        users.map((user) => (
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
                                                                className="dropdown-item"
                                                                onClick={() => navigate(`/utilisateurs/${user._id}`)}
                                                            >
                                                                <i className="bx bx-edit-alt me-1"></i> Modifier
                                                            </button>
                                                            <button
                                                                className="dropdown-item"
                                                                onClick={() => handleDelete(user._id)}
                                                            >
                                                                <i className="bx bx-trash me-1"></i> Supprimer
                                                            </button>
                                                        </div>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="7" className="text-center py-4">
                                                Aucun utilisateur trouvé
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        <Pagination
                            currentPage={currentPage}
                            totalPages={totalPages}
                            onPageChange={setCurrentPage}
                            itemsPerPage={itemsPerPage}
                            onItemsPerPageChange={handleItemsPerPageChange}
                        />
                    </>
                )}
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