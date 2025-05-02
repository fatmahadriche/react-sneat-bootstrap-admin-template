import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import moment from 'moment';
import ReactPaginate from 'react-paginate';

const FeuillePresencePage = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [agents, setAgents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [pagination, setPagination] = useState({
        page: 1,
        limit: 100,
        total: 0,
        pages: 1
    });

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await fetch(
                    `http://localhost:5000/api/presences?page=${pagination.page}&limit=${pagination.limit}`,
                    {
                        headers: {
                            'Authorization': `Bearer ${user.token}`,
                            'Content-Type': 'application/json'
                        }
                    }
                );
                
                const response = await res.json();
                
                if (!res.ok) {
                    throw new Error(response.error?.message || 'Erreur de chargement des données');
                }

                const rawData = Array.isArray(response) ? response : response.data || [];
                const paginationData = response.pagination || {
                    page: 1,
                    limit: pagination.limit,
                    total: rawData.length,
                    pages: 1
                };

                const agentsList = rawData.map(feuille => ({
                    _id: feuille._id,
                    matricule: feuille.matricule,
                    nom_complet: feuille.nom_complet,
                    lastUpdate: feuille.updatedAt || feuille.createdAt
                }));

                setAgents(agentsList);
                setPagination(paginationData);
                
            } catch (err) {
                console.error('Erreur de récupération:', err);
                setError(err.message);
                setAgents([]);
            } finally {
                setLoading(false);
            }
        };
        
        if (user?.token) fetchData();
    }, [user?.token, pagination.page]);

    const handlePageClick = ({ selected }) => {
        setPagination(prev => ({
            ...prev,
            page: selected + 1
        }));
    };

    if (loading) {
        return (
            <div className="d-flex justify-content-center p-3">
                <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="alert alert-danger m-3">
                <i className="bx bx-error-circle me-2"></i>
                Erreur de chargement : {error}
            </div>
        );
    }

    return (
        <div className="card border-0 shadow-sm">
            <div className="card-header d-flex justify-content-between align-items-center bg-white border-bottom">
                <h5 className="mb-0 fw-bold text-dark">
                    <i className="bx bx-list-check me-2 text-primary"></i>
                    LISTE DES MOUVEMENTS
                </h5>
            </div>
            
            <div className="card-body">
                <div className="table-responsive">
                    <table className="table table-hover mb-0">
                        <thead className="table-light">
                            <tr>
                                <th style={{ backgroundColor: "#f8f9fa", color: "#0d6efd" }}>
                                    <i className="bx bx-id-card me-1"></i>
                                    Matricule
                                </th>
                                <th style={{ backgroundColor: "#f8f9fa"}}>
                                    <i className="bx bx-user me-1"></i>
                                    Nom Complet
                                </th>
                                <th style={{ backgroundColor: "#f8f9fa", color: "#6f42c1" }}>
                                    <i className="bx bx-detail me-1"></i>
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {agents.map(agent => (
                                <tr key={agent._id}>
                                    <td className="fw-bold text-primary">{agent.matricule}</td>
                                    <td>{agent.nom_complet}</td>
                                    <td>
                                        <Link 
                                            to={`/feuille-presence/${agent.matricule}`}
                                            className="btn btn-sm btn-outline-primary"
                                        >
                                            <i className="bx bx-show me-1"></i>
                                            Détails
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {pagination.pages > 1 && (
                    <div className="d-flex justify-content-center mt-4">
                        <ReactPaginate
                            previousLabel={<i className="bx bx-chevron-left"></i>}
                            nextLabel={<i className="bx bx-chevron-right"></i>}
                            pageCount={pagination.pages}
                            onPageChange={handlePageClick}
                            forcePage={pagination.page - 1}
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
                )}

                {agents.length === 0 && !loading && (
                    <div className="alert alert-info mt-3 mb-0">
                        <i className="bx bx-info-circle me-2"></i>
                        Aucun mouvement trouvé dans la base de données
                    </div>
                )}
            </div>
        </div>
    );
};

export default FeuillePresencePage;