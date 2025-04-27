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

                // Correction clé ici : Vérifier la structure de la réponse
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
                Load error: {error}
                <div className="mt-2">
                    <button onClick={() => navigate(-1)} className="btn btn-sm btn-outline-secondary">
                        <i className="bx bx-arrow-back me-1"></i> Back
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="card border-0 shadow-sm">
            <div className="card-header d-flex justify-content-between align-items-center bg-white border-bottom">
                <h5 className="mb-0 fw-bold text-dark">
                    <i className="bx bx-list-ul me-2 text-primary"></i>
                    AGENT LIST
                </h5>
                <button onClick={() => navigate(-1)} className="btn btn-outline-secondary">
                    <i className="bx bx-arrow-back me-1"></i> Back
                </button>
            </div>
            
            <div className="card-body">
                <div className="table-responsive">
                    <table className="table table-hover mb-0">
                        <thead className="table-light">
                            <tr>
                                <th>ID</th>
                                <th>Full Name</th>
                                <th>Last Update</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {agents.map(agent => (
                                <tr key={agent._id}>
                                    <td className="fw-bold">{agent.matricule}</td>
                                    <td>{agent.nom_complet}</td>
                                    <td>{moment(agent.lastUpdate).format('DD/MM/YYYY HH:mm')}</td>
                                    <td>
                                        <Link 
                                            to={`/feuille-presence/${agent.matricule}`}
                                            className="btn btn-sm btn-primary"
                                        >
                                            <i className="bx bx-calendar-check me-1"></i>
                                            View
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
                        No agents found in database
                    </div>
                )}
            </div>
        </div>
    );
};

export default FeuillePresencePage;