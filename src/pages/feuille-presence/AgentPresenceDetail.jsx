import React, { useEffect, useState, useRef, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import moment from 'moment';
import { useReactToPrint } from 'react-to-print';
import Swal from 'sweetalert2';
import ReactPaginate from 'react-paginate';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

const AgentPresenceDetail = () => {
    const { matricule } = useParams();
    const { user } = useAuth();
    const navigate = useNavigate();
    const [feuilles, setFeuilles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [currentPage, setCurrentPage] = useState(0);
    const [filters, setFilters] = useState({
        periodType: 'none',
        selectedDate: null,
        periode_debut: null,
        periode_fin: null,
        sessionType: 'all'
    });
    const componentRef = useRef(null);

    const PER_PAGE = 4;

    const allPresences = useMemo(() => {
        return feuilles.flatMap(feuille => feuille.presences || []);
    }, [feuilles]);

    const filteredPresences = useMemo(() => {
        return allPresences.filter(presence => {
            const datePresence = moment(presence.date);
            let periodMatch = true;
            
            // Filtre par période
            if (filters.periodType === 'day' && filters.selectedDate) {
                periodMatch = datePresence.isSame(filters.selectedDate, 'day');
            } else if (filters.periodType === 'month' && filters.selectedDate) {
                periodMatch = datePresence.isSame(filters.selectedDate, 'month');
            } else if (filters.periodType === 'custom' && filters.periode_debut && filters.periode_fin) {
                periodMatch = datePresence.isBetween(
                    moment(filters.periode_debut),
                    moment(filters.periode_fin),
                    'day',
                    '[]'
                );
            }
            
            // Filtre par type de séance
            let sessionMatch = true;
            if (filters.sessionType !== 'all') {
                const presenceTime = moment(presence.date);
                const hour = presenceTime.hours();
                
                if (filters.sessionType === 'normal') {
                    sessionMatch = hour >= 8 && hour <= 17;
                } else if (filters.sessionType === 'unique') {
                    sessionMatch = hour >= 6 && hour <= 13;
                }
            }
            
            return periodMatch && sessionMatch;
        });
    }, [allPresences, filters]);

    const pageCount = Math.ceil(filteredPresences.length / PER_PAGE);
    const offset = currentPage * PER_PAGE;
    const currentPresences = filteredPresences.slice(offset, offset + PER_PAGE);

    useEffect(() => {
        const fetchData = async () => {
            try {
                let url = `http://localhost:5000/api/presences/${matricule}`;
                
                if (filters.periode_debut && filters.periode_fin) {
                    url += `?periode_debut=${moment(filters.periode_debut).format('YYYY-MM-DD')}&periode_fin=${moment(filters.periode_fin).format('YYYY-MM-DD')}`;
                }

                const res = await fetch(url, {
                    headers: {
                        'Authorization': `Bearer ${user.token}`,
                        'Content-Type': 'application/json'
                    }
                });
                
                if (!res.ok) throw new Error(`Erreur HTTP! Statut: ${res.status}`);
                
                const data = await res.json();
                setFeuilles(data);
                setError(null);
            } catch (err) {
                console.error('Erreur:', err);
                setError(err.message);
                setFeuilles([]);
            } finally {
                setLoading(false);
            }
        };
        
        if (user?.token) fetchData();
    }, [user?.token, matricule, filters.periode_debut, filters.periode_fin]);

    const handlePageClick = ({ selected }) => {
        setCurrentPage(selected);
    };

    const handlePrint = useReactToPrint({
        content: () => componentRef.current,
        documentTitle: `Feuille_presence_${matricule}_${moment().format('YYYY-MM-DD')}`,
        pageStyle: `
          @page { size: A4 landscape; margin: 10mm; }
          @media print {
            body { -webkit-print-color-adjust: exact; }
            .no-print { display: none !important; }
            table { width: 100%; border-collapse: collapse; }
            th, td { border: 1px solid #ddd; padding: 8px; }
            .section-title { background-color: #f2f2f2; }
          }
        `,
        onPrintError: () => {
          Swal.fire('Erreur', 'Échec de l\'impression', 'error');
        }
      });

    const handleFilterChange = (name, value) => {
        setFilters(prev => ({
            ...prev,
            [name]: value,
            ...(name === 'periodType' && { 
                selectedDate: null,
                periode_debut: null,
                periode_fin: null 
            })
        }));
        setCurrentPage(0);
    };

    const resetFilters = () => {
        setFilters({
            periodType: 'none',
            selectedDate: null,
            periode_debut: null,
            periode_fin: null,
            sessionType: 'all'
        });
        setCurrentPage(0);
    };

    const getTypePresence = (type) => {
        switch(type) {
            case 'ENTREEMATIN': return 'Entrée matin';
            case 'ENTREEMIDI': return 'Entrée midi';
            case 'SORTIEMATIN': return 'Sortie matin';
            case 'SORTIEMIDI': return 'Sortie midi';
            default: return type;
        }
    };

    const handleDeletePresence = async (presenceId) => {
        try {
            const result = await Swal.fire({
                title: 'Êtes-vous sûr?',
                text: "Vous ne pourrez pas annuler cette suppression!",
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#d33',
                cancelButtonColor: '#3085d6',
                confirmButtonText: 'Oui, supprimer!',
                cancelButtonText: 'Annuler'
            });
            
            if (result.isConfirmed) {
                const response = await fetch(`http://localhost:5000/api/presences/${matricule}/${presenceId}`, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${user.token}`
                    }
                });
                
                if (!response.ok) throw new Error('Échec de la suppression');
                
                setFeuilles(prev => prev.map(feuille => ({
                    ...feuille,
                    presences: feuille.presences.filter(p => p._id !== presenceId)
                })));
                
                Swal.fire('Supprimé!', 'La présence a été supprimée.', 'success');
            }
        } catch (error) {
            Swal.fire('Erreur!', error.message, 'error');
        }
    };

    if (loading) {
        return (
            <div className="d-flex justify-content-center p-3">
                <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Chargement...</span>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="alert alert-danger m-3">
                <i className="bx bx-error-circle me-2"></i>
                Erreur lors du chargement des données: {error}
                <div className="mt-2">
                    <button onClick={() => navigate(-1)} className="btn btn-sm btn-outline-secondary">
                        <i className="bx bx-arrow-back me-1"></i> Retour
                    </button>
                </div>
            </div>
        );
    }

    if (feuilles.length === 0) {
        return (
            <div className="alert alert-warning m-3">
                <i className="bx bx-info-circle me-2"></i>
                Aucune donnée trouvée pour le matricule {matricule}
                <div className="mt-2">
                    <button onClick={() => navigate(-1)} className="btn btn-sm btn-outline-secondary">
                        <i className="bx bx-arrow-back me-1"></i> Retour
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="card border-0 shadow-sm">
            <div className="card-header d-flex justify-content-between align-items-center bg-white border-bottom">
                <div>
                    <h5 className="mb-0 fw-bold text-dark">
                        <i className="bx bx-calendar-check me-2 text-primary"></i>
                        FICHE DE PRESENCES
                    </h5>
                    <div className="d-flex align-items-center mt-2">
                        <span className="badge bg-light text-dark me-2 border">
                            <i className="bx bx-user me-1 text-muted"></i> 
                            {feuilles[0]?.nom_complet}
                        </span>
                        <span className="badge bg-light text-dark border">
                            <i className="bx bx-id-card me-1 text-muted"></i>
                            Matricule: {matricule}
                        </span>
                    </div>
                </div>
                <div>
                    <button onClick={handlePrint} className="btn btn-outline-primary me-2">
                        <i className="bx bx-printer me-1"></i> Imprimer
                    </button>
                    <button onClick={() => navigate(-1)} className="btn btn-outline-secondary">
                        <i className="bx bx-arrow-back me-1"></i> Retour
                    </button>
                </div>
            </div>
            
            <div className="card-body">
                <div ref={componentRef}>
                    <div className="card mb-4 border-primary">
                        <div className="card-header bg-light">
                            <h6 className="mb-0 text-primary">
                                <i className="bx bx-filter-alt me-2"></i>
                                FILTRES
                            </h6>
                        </div>
                        <div className="card-body">
                            <div className="row g-3">
                                <div className="col-md-3">
                                    <label className="form-label fw-bold">Période</label>
                                    <select 
                                        className="form-select"
                                        value={filters.periodType}
                                        onChange={(e) => handleFilterChange('periodType', e.target.value)}
                                    >
                                        <option value="none">Aucun filtre</option>
                                        <option value="day">Par jour</option>
                                        <option value="month">Par mois</option>
                                        <option value="custom">Période personnalisée</option>
                                    </select>
                                </div>

                                {filters.periodType === 'day' && (
                                    <div className="col-md-3">
                                        <label className="form-label fw-bold">Date spécifique</label>
                                        <DatePicker
                                            selected={filters.selectedDate}
                                            onChange={(date) => handleFilterChange('selectedDate', date)}
                                            className="form-control"
                                            dateFormat="dd/MM/yyyy"
                                            placeholderText="Sélectionner une date"
                                        />
                                    </div>
                                )}

                                {filters.periodType === 'month' && (
                                    <div className="col-md-3">
                                        <label className="form-label fw-bold">Mois</label>
                                        <DatePicker
                                            selected={filters.selectedDate}
                                            onChange={(date) => handleFilterChange('selectedDate', date)}
                                            className="form-control"
                                            dateFormat="MM/yyyy"
                                            showMonthYearPicker
                                            placeholderText="Sélectionner un mois"
                                        />
                                    </div>
                                )}

                                {filters.periodType === 'custom' && (
                                    <>
                                        <div className="col-md-3">
                                            <label className="form-label fw-bold">Date de début</label>
                                            <DatePicker
                                                selected={filters.periode_debut}
                                                onChange={(date) => handleFilterChange('periode_debut', date)}
                                                className="form-control"
                                                dateFormat="dd/MM/yyyy"
                                                placeholderText="Date de début"
                                            />
                                        </div>
                                        <div className="col-md-3">
                                            <label className="form-label fw-bold">Date de fin</label>
                                            <DatePicker
                                                selected={filters.periode_fin}
                                                onChange={(date) => handleFilterChange('periode_fin', date)}
                                                className="form-control"
                                                dateFormat="dd/MM/yyyy"
                                                placeholderText="Date de fin"
                                                minDate={filters.periode_debut}
                                            />
                                        </div>
                                    </>
                                )}

                                <div className="col-md-3">
                                    <label className="form-label fw-bold">Type de séance</label>
                                    <select
                                        className="form-select"
                                        value={filters.sessionType}
                                        onChange={(e) => handleFilterChange('sessionType', e.target.value)}
                                    >
                                        <option value="all">Toutes les séances</option>
                                        <option value="normal">Temps normal (8h-17h)</option>
                                        <option value="unique">Séance unique (6h-13h)</option>
                                    </select>
                                </div>

                                <div className="col-md-3 d-flex align-items-end">
                                    <button 
                                        className="btn btn-outline-primary w-100" 
                                        onClick={resetFilters}
                                        disabled={filters.periodType === 'none' && filters.sessionType === 'all'}
                                    >
                                        <i className="bx bx-reset me-2"></i>
                                        Réinitialiser
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="mb-4">
                        <h6 className="p-3 mb-3 bg-light border-bottom">
                            <i className="bx bx-time me-2 text-muted"></i>
                            HISTORIQUE DES POINTAGES
                        </h6>
                        {filteredPresences.length === 0 ? (
                            <div className="alert alert-info mb-4">
                                <i className="bx bx-info-circle me-2"></i>
                                Aucune présence ne correspond aux critères de filtrage
                            </div>
                        ) : (
                            <>
                                <div className="mb-3 text-muted small">
                                    <i className="bx bx-show me-1"></i>
                                    Affichage {offset + 1}-{Math.min(offset + PER_PAGE, filteredPresences.length)} 
                                    sur {filteredPresences.length} enregistrements
                                </div>
                                
                                <div className="table-responsive">
                                    <table className="table table-bordered table-hover">
                                        <thead className="table-primary">
                                            <tr>
                                                <th className="text-nowrap">Date</th>
                                                <th className="text-nowrap">Heure</th>
                                                <th className="text-nowrap">Type</th>
                                                <th className="no-print text-nowrap">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {currentPresences.map((presence, index) => {
                                                const date = moment(presence.date);
                                                return (
                                                    <tr key={index}>
                                                        <td className="fw-bold">{date.format('DD/MM/YYYY')}</td>
                                                        <td className="fw-bold">{date.format('HH:mm')}</td>
                                                        <td>
                                                            <span className={`badge ${
                                                                presence.type.includes('ENTREE') ? 'bg-success' : 
                                                                presence.type.includes('SORTIE') ? 'bg-warning text-dark' : 'bg-secondary'
                                                            }`}>
                                                                {getTypePresence(presence.type)}
                                                            </span>
                                                        </td>
                                                        <td className="no-print">
                                                            <button 
                                                                className="btn btn-sm btn-outline-danger"
                                                                onClick={() => handleDeletePresence(presence._id)}
                                                                title="Supprimer"
                                                            >
                                                                <i className="bx bx-trash"></i>
                                                            </button>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>

                                {pageCount > 1 && (
                                    <div className="d-flex justify-content-center mt-4">
                                        <ReactPaginate
                                            previousLabel={<i className="bx bx-chevron-left"></i>}
                                            nextLabel={<i className="bx bx-chevron-right"></i>}
                                            pageCount={pageCount}
                                            onPageChange={handlePageClick}
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
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AgentPresenceDetail;