import React, { useState, useEffect } from "react";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import ReactPaginate from "react-paginate";
import { useAuth } from "../context/authContext";
import { useNavigate } from "react-router-dom";


const ListeUtilisateursPage = () => {
    const [users, setUsers] = useState([]);
    const [currentPage, setCurrentPage] = useState(0);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [totalPages, setTotalPages] = useState(1);
    const [loading, setLoading] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [userToDelete, setUserToDelete] = useState(null);
    const { user } = useAuth();
    const navigate = useNavigate();

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const res = await axios.get(`${import.meta.env.VITE_APP_API_URL}/auth/admin/users`, {
                params: {
                    page: currentPage + 1,
                    limit: itemsPerPage,
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

    const confirmDelete = (userId) => {
        setUserToDelete(userId);
        setShowDeleteModal(true);
    };

    const handleDelete = async () => {
        try {
            await axios.delete(`${import.meta.env.VITE_APP_API_URL}/auth/admin/delete-user/${userToDelete}`, {
                headers: {
                    Authorization: `Bearer ${user.token}`,
                },
            });
            toast.success("Utilisateur supprimé avec succès !");
            fetchUsers();
        } catch (err) {
            console.error("Erreur:", err.response?.data || err);
            toast.error(err.response?.data?.message || "Erreur lors de la suppression");
        } finally {
            setShowDeleteModal(false);
            setUserToDelete(null);
        }
    };

    const handleItemsPerPageChange = (e) => {
        const newValue = Number(e.target.value);
        setItemsPerPage(newValue);
        setCurrentPage(0);
    };

    const handlePageClick = (event) => {
    const selectedPage = event.selected;
    // Ensure the selected page is within the bounds of totalPages
    if (selectedPage < totalPages) {
        setCurrentPage(selectedPage);
    } else {
        setCurrentPage(totalPages - 1);
    }
};

useEffect(() => {
    // Reset currentPage if it exceeds totalPages when itemsPerPage changes
    if (currentPage >= totalPages) {
        setCurrentPage(totalPages - 1);
    }
}, [totalPages]);

useEffect(() => {
    fetchUsers();
}, [currentPage, itemsPerPage]);

    return (
        <>
            <style>{`
                .delete-modal-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background-color: rgba(0, 0, 0, 0.5);
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    z-index: 1050;
                }
                
                .delete-modal-content {
                    background: white;
                    border-radius: 8px;
                    width: 100%;
                    max-width: 500px;
                    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
                    animation: modalFadeIn 0.3s ease;
                }
                
                @keyframes modalFadeIn {
                    from { opacity: 0; transform: translateY(-20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                
                .delete-modal-header {
                    padding: 1.25rem;
                    border-bottom: 1px solid #e9ecef;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }
                
                .delete-modal-title {
                    margin: 0;
                    font-size: 1.25rem;
                    color: #2a5c7d;
                    font-weight: 600;
                }
                
                .delete-modal-close {
                    background: none;
                    border: none;
                    font-size: 1.5rem;
                    cursor: pointer;
                    color: #6c757d;
                }
                
                .delete-modal-body {
                    padding: 1.5rem;
                    font-size: 1.05rem;
                    color: #495057;
                }
                
                .delete-modal-footer {
                    padding: 1rem;
                    border-top: 1px solid #e9ecef;
                    display: flex;
                    justify-content: flex-end;
                    gap: 0.75rem;
                }
                
                .delete-modal-cancel {
                    padding: 0.5rem 1rem;
                    background: #6c757d;
                    color: white;
                    border: none;
                    border-radius: 4px;
                    cursor: pointer;
                    transition: all 0.2s;
                }
                
                .delete-modal-cancel:hover {
                    background: #5a6268;
                }
                
                .delete-modal-confirm {
                    padding: 0.5rem 1rem;
                    background: #dc3545;
                    color: white;
                    border: none;
                    border-radius: 4px;
                    cursor: pointer;
                    transition: all 0.2s;
                }
                
                .delete-modal-confirm:hover {
                    background: #bb2d3b;
                }
            `}</style>

            <div className="card shadow-sm">
                <h5 className="card-header d-flex align-items-center justify-content-between">
                    <div>
                        <i className="bx bx-list-ul me-2" style={{ fontSize: "1.5rem", color: "#0d6efd" }}></i>
                        Liste des utilisateurs
                    </div>
                    <div className="d-flex align-items-center gap-2">
                        <span className="text-muted small">Afficher :</span>
                        <select
                            className="form-select form-select-sm"
                            value={itemsPerPage}
                            onChange={handleItemsPerPageChange}
                            style={{ width: 'auto' }}
                        >
                            <option value="5">5</option>
                            <option value="10">10</option>
                            <option value="20">20</option>
                            <option value="50">50</option>
                        </select>
                    </div>
                </h5>
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
                                <table className="table table-hover table-striped">
                                    <caption className="ms-4">Liste complète des utilisateurs</caption>
                                    <thead className="table-light">
                                        <tr>
                                            <th style={{ backgroundColor: "#f8f9fa", color: "#0d6efd" }}>
                                                <i className="bx bx-hash me-1"></i> Matricule
                                            </th>
                                            <th style={{ backgroundColor: "#f8f9fa", color: "#198754" }}>
                                                <i className="bx bx-user me-1"></i> Nom
                                            </th>
                                            <th style={{ backgroundColor: "#f8f9fa", color: "#fd7e14" }}>
                                                <i className="bx bx-user-pin me-1"></i> Prénom
                                            </th>
                                            <th style={{ backgroundColor: "#f8f9fa", color: "#6f42c1" }}>
                                                <i className="bx bx-envelope me-1"></i> Email
                                            </th>
                                            <th style={{ backgroundColor: "#f8f9fa", color: "#d63384" }}>
                                                <i className="bx bx-phone me-1"></i> Téléphone
                                            </th>
                                            <th style={{ backgroundColor: "#f8f9fa", color: "#ffc107" }}>
                                                <i className="bx bx-lock-alt me-1"></i> Rôle
                                            </th>
                                            <th style={{ backgroundColor: "#f8f9fa", color: "#dc3545" }}>
                                                <i className="bx bx-cog me-1"></i> Actions
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {users.length > 0 ? (
                                            users.map((user) => (
                                                <tr key={user._id}>
                                                    <td>{user.matricule}</td>
                                                    <td>{user.nom || <span className="text-danger">NON_DEFINI</span>}</td>
                                                    <td>{user.prenom || <span className="text-danger">NON_DEFINI</span>}</td>
                                                    <td>{user.email}</td>
                                                    <td>{user.tel}</td>
                                                    <td>
                                                        <span
                                                            className={`badge bg-label-${user.role === "admin" ? "danger" : "primary"
                                                                } me-1`}
                                                        >
                                                            {user.role.toUpperCase()}
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
                                                                    className="dropdown-item text-primary"
                                                                    onClick={() => navigate(`/utilisateurs/${user._id}`)}
                                                                >
                                                                    <i className="bx bx-edit-alt me-1"></i> Modifier
                                                                </button>
                                                                <button
                                                                    className="dropdown-item text-danger"
                                                                    onClick={() => confirmDelete(user._id)}
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

                            <div className="d-flex justify-content-between align-items-center mt-3">
                                <div className="text-muted small">
                                    Page {currentPage + 1} sur {totalPages}
                                </div>
                                
                                <ReactPaginate
                                    previousLabel={<i className="bx bx-chevron-left"></i>}
                                    nextLabel={<i className="bx bx-chevron-right"></i>}
                                    pageCount={totalPages}
                                    onPageChange={handlePageClick}
                                    forcePage={currentPage}
                                    containerClassName="pagination mb-0"
                                    activeClassName="active"
                                    pageClassName="page-item"
                                    pageLinkClassName="page-link"
                                    previousClassName="page-item"
                                    previousLinkClassName="page-link"
                                    nextClassName="page-item"
                                    nextLinkClassName="page-link"
                                    breakLabel="..."
                                    breakClassName="page-item"
                                    breakLinkClassName="page-link"
                                    marginPagesDisplayed={2}
                                    pageRangeDisplayed={5}
                                />
                            </div>
                        </>
                    )}
                </div>

                {showDeleteModal && (
                    <div className="delete-modal-overlay">
                        <div className="delete-modal-content">
                            <div className="delete-modal-header">
                                <h5 className="delete-modal-title">Confirmer la suppression</h5>
                                <button 
                                    className="delete-modal-close"
                                    onClick={() => setShowDeleteModal(false)}
                                >
                                    &times;
                                </button>
                            </div>
                            <div className="delete-modal-body">
                                <p>Êtes-vous sûr de vouloir supprimer cet utilisateur ? Cette action est irréversible.</p>
                            </div>
                            <div className="delete-modal-footer">
                                <button
                                    className="delete-modal-cancel"
                                    onClick={() => setShowDeleteModal(false)}
                                >
                                    Annuler
                                </button>
                                <button
                                    className="delete-modal-confirm"
                                    onClick={handleDelete}
                                >
                                    Confirmer la suppression
                                </button>
                            </div>
                        </div>
                    </div>
                )}

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
        </>
    );
};

export default ListeUtilisateursPage;