import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Link } from 'react-router-dom';
import moment from 'moment';

const AgentListPage = () => {
    const { user } = useAuth();
    const [agents, setAgents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await fetch('http://localhost:5000/api/pointages', {
                    headers: {
                        'Authorization': `Bearer ${user.token}`
                    }
                });
                
                if (!res.ok) throw new Error(`Erreur HTTP! Statut: ${res.status}`);
                
                const data = await res.json();
                
                // Créer une liste unique d'agents
                const uniqueAgents = data.reduce((acc, current) => {
                    const existing = acc.find(a => a.matricule === current.matricule);
                    if (!existing) {
                        acc.push({
                            _id: current._id,
                            matricule: current.matricule,
                            nom_complet: current.nom_complet,
                            lastUpdate: current.updatedAt
                        });
                    }
                    return acc;
                }, []);
                
                setAgents(uniqueAgents);
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
    }, [user?.token]);

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
            </div>
        );
    }

    return (
        <div className="card">
            <div className="card-header d-flex justify-content-between align-items-center">
                <h5 className="mb-0">Liste des Agents</h5>
            </div>
            <div className="card-body">
                <div className="table-responsive">
                    <table className="table table-hover">
                        <thead>
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
                                            to={`/feuille-pointage/${agent.matricule}`}
                                            className="btn btn-sm btn-primary"
                                        >
                                            <i className="bx bx-time"></i> Feuille de pointage
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default AgentListPage;