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
        limit: 10,
        total: 0,
        pages: 1
    });

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await fetch(`http://localhost:5000/api/presences?page=${pagination.page}&limit=${pagination.limit}`, {
                    headers: {
                        'Authorization': `Bearer ${user.token}`,
                        'Content-Type': 'application/json'
                    }
                });
                
                if (!res.ok) {
                    const errorData = await res.json().catch(() => ({}));
                    throw new Error(
                        errorData.message || `Erreur HTTP! Statut: ${res.status}`
                    );
                }
                
                const { data, pagination: paginationData } = await res.json();
                
                // Créer une liste unique d'agents
                const uniqueAgents = data.reduce((acc, current) => {
                    if (!acc.some(agent => agent.matricule === current.matricule)) {
                        acc.push({
                            _id: current._id,
                            matricule: current.matricule,
                            nom_complet: current.nom_complet,
                            lastUpdate: current.updatedAt || current.createdAt
                        });
                    }
                    return acc;
                }, []);
                
                setAgents(uniqueAgents);
                setPagination(paginationData);
                setError(null);
            } catch (err) {
                console.error('Erreur:', err);
                setError(err.message);
                setAgents([]);
            } finally {
                setLoading(false);
            }
        };
        
        if (user?.token) fetchData();
    }, [user?.token, pagination.page, pagination.limit]);

    const handlePageClick = ({ selected }) => {
        setPagination(prev => ({
            ...prev,
            page: selected + 1
        }));
    };

    if (loading) {
        return (
            <div className="d-flex justify-content-center p-3">
                <div className="spinner-border" role="status">
                    <span className="visually-hidden">Chargement...</span>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="alert alert-danger m-3">
                Erreur lors du chargement des données: {error}
                <div className="mt-2">
                    <button onClick={() => navigate(-1)} className="btn btn-sm btn-secondary">
                        <i className="bx bx-arrow-back"></i> Retour
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="card">
            <div className="card-header d-flex justify-content-between align-items-center">
                <h5 className="mb-0">Liste des Agents</h5>
                <button onClick={() => navigate(-1)} className="btn btn-sm btn-outline-secondary">
                    <i className="bx bx-arrow-back"></i> Retour
                </button>
            </div>
            <div className="card-body">
                <div className="table-responsive">
                    <table className="table table-hover">
                        <thead className="table-light">
                            <tr>
                                <th>Matricule</th>
                                <th>Nom Complet</th>
                                <th>Dernière Mise à Jour</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {agents.map(agent => (
                                <tr key={agent._id}>
                                    <td>{agent.matricule}</td>
                                    <td>{agent.nom_complet}</td>
                                    <td>{moment(agent.lastUpdate).format('DD/MM/YYYY HH:mm')}</td>
                                    <td>
                                        <Link 
                                            to={`/feuille-presence/${agent.matricule}`}
                                            className="btn btn-sm btn-primary"
                                        >
                                            <i className="bx bx-calendar-check"></i> Consulter
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {pagination.pages > 1 && (
                    <div className="d-flex justify-content-center mt-3">
                        <ReactPaginate
                            previousLabel={<i className="bx bx-chevron-left"></i>}
                            nextLabel={<i className="bx bx-chevron-right"></i>}
                            pageCount={pagination.pages}
                            onPageChange={handlePageClick}
                            forcePage={pagination.page - 1}
                            containerClassName="pagination"
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
                    <div className="alert alert-info mt-3">
                        Aucun agent trouvé dans la base de données
                    </div>
                )}
            </div>
        </div>
    );
};

export default FeuillePresencePage;