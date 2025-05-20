import React, { useEffect, useState, useRef, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import moment from 'moment';
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
        sessionType: 'all'
    });

    const PER_PAGE = 10;

    const filteredPresences = useMemo(() => {
        return feuilles.flatMap(feuille => {
            // Récupérer les heures de travail de la feuille
            const debutEmploi = feuille.date_debut_emploi ? 
                moment(feuille.date_debut_emploi.split(' ')[1], 'HH:mm') : null;
            const finEmploi = feuille.date_fin_emploi ? 
                moment(feuille.date_fin_emploi.split(' ')[1], 'HH:mm') : null;

            return (feuille.historique || []).map(presence => ({
                ...presence,
                // Ajouter les heures de travail à chaque présence
                _debutEmploi: debutEmploi,
                _finEmploi: finEmploi
            }));
        })
        .filter(presence => {
            // Correction: Utiliser la date locale pour éviter les problèmes de fuseau horaire
            const datePresence = moment(presence.date);
            let periodMatch = true;

            // Filtrage période corrigé
            if (filters.periodType === 'day' && filters.selectedDate) {
                // Comparer uniquement les dates (jour/mois/année) sans l'heure
                const selectedDay = moment(filters.selectedDate).startOf('day');
                const presenceDay = datePresence.clone().startOf('day');
                periodMatch = presenceDay.isSame(selectedDay);
            } 
            else if (filters.periodType === 'month' && filters.selectedDate) {
                // Corriger le filtrage par mois: extraire le mois et l'année pour la comparaison
                const selectedMonth = moment(filters.selectedDate).month();
                const selectedYear = moment(filters.selectedDate).year();
                periodMatch = (
                    datePresence.month() === selectedMonth && 
                    datePresence.year() === selectedYear
                );
            } 
            else if (filters.periodType === 'custom' && filters.periode_debut && filters.periode_fin) {
                const start = moment(filters.periode_debut).startOf('day');
                const end = moment(filters.periode_fin).endOf('day');
                periodMatch = datePresence.isBetween(start, end, null, '[]');
            }

            // Filtrage type de séance corrigé
            let sessionMatch = true;
            if (filters.sessionType !== 'all') {
                // CORRECTION: Pour séance unique vérifier si la date est en juin ou juillet
                if (filters.sessionType === 'unique') {
                    // Vérifier si le mois est juin (5 en 0-index) ou juillet (6 en 0-index)
                    const mois = datePresence.month();
                    sessionMatch = mois === 5 || mois === 6; // Juin (5) ou Juillet (6)
                }
                // Conserver la logique existante pour le type 'normal'
                else if (filters.sessionType === 'normal') {
                    // Horaire normal: Vérifier si au moins un pointage est entre 8h et 17h
                    if (presence.heures && presence.heures.length > 0) {
                        // Convertir les heures de pointage en moments
                        const heuresPointage = presence.heures.map(h => 
                            moment(h.substring(0, 5), 'HH:mm')
                        );
                        
                        const debut8h = moment('08:00', 'HH:mm');
                        const fin17h = moment('17:00', 'HH:mm');
                        
                        sessionMatch = heuresPointage.some(heure => 
                            heure.isSameOrAfter(debut8h) && heure.isSameOrBefore(fin17h)
                        );
                    } else {
                        sessionMatch = false;
                    }
                }
            }

            return periodMatch && sessionMatch;
        })
        .sort((a, b) => moment(b.date).diff(moment(a.date))); // Tri décroissant
    }, [feuilles, filters]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                setError(null);

                if (!user?.token) {
                    throw new Error("Non authentifié");
                }

                const res = await fetch(`http://localhost:5000/api/presences/${matricule}`, {
                    headers: {
                        'Authorization': `Bearer ${user.token}`,
                        'Content-Type': 'application/json'
                    }
                });

                if (!res.ok) {
                    if (res.status === 404) {
                        setFeuilles([]);
                        return;
                    }
                    throw new Error(`Erreur HTTP! Statut: ${res.status}`);
                }

                const response = await res.json();

                if (!response?.length) {
                    setFeuilles([]);
                    throw new Error("Aucune donnée trouvée dans la réponse");
                }

                // Fusionner toutes les historiques de toutes les feuilles
                const mergedFeuilles = response.reduce((acc, feuille) => ({
                    ...feuille,
                    historique: [...acc.historique || [], ...feuille.historique || []]
                }), {});

                const formattedData = {
                    ...mergedFeuilles,
                    historique: (mergedFeuilles.historique || []).map(p => ({
                        ...p,
                        heures: p.heures?.map(h => h.substring(0, 5)) || ['--:--']
                    }))
                };

                setFeuilles([formattedData]);

            } catch (err) {
                console.error('Erreur:', err);
                setError(err.message);
                setFeuilles([]);

                if (err.message.includes("403")) {
                    Swal.fire({
                        icon: 'error',
                        title: 'Accès refusé',
                        text: 'Vous ne pouvez accéder qu\'à vos propres données'
                    });
                }
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [user?.token, matricule]);

    const handleFilterChange = (name, value) => {
        setFilters(prev => ({
            ...prev, // Conserve les autres valeurs du state
            [name]: value, // Met à jour la propriété spécifique
            ...(name === 'periodType' && { selectedDate: null }) // Reset date si changement de type
        }));
        setCurrentPage(0); // Réinitialise toujours la pagination
    };

    const resetFilters = () => {
        setFilters({
            periodType: 'none', // Valeur par défaut
            selectedDate: null, // Reset date
            sessionType: 'all'  // Valeur par défaut
        });
        setCurrentPage(0); // Réinitialise la pagination
    };

    const getTypePresence = (type) => {
        switch(type) {
            case 'ENTREEMATIN': 
                return {
                    label: 'Matin',
                    icon: 'bx-sun',
                    color: 'bg-warning text-dark'
                };
            case 'ENTREEMIDI': 
                return {
                    label: 'Midi',
                    icon: 'bx-moon',
                    color: 'bg-info text-white'
                };
            default: 
                return {
                    label: type,
                    icon: 'bx-time',
                    color: 'bg-secondary text-white'
                };
        }
    };

    if(loading) return (
        <div className="d-flex justify-content-center p-3">
            <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Chargement...</span>
            </div>
        </div>
    );

    if(error) return (
        <div className="alert alert-danger m-3">
            <i className="bx bx-error-circle me-2"></i>
            Erreur de chargement : {error}
            <div className="mt-2">
                <button onClick={() => navigate(-1)} className="btn btn-sm btn-outline-secondary">
                    <i className="bx bx-arrow-back me-1"></i> Retour
                </button>
            </div>
        </div>
    );

    if(feuilles.length === 0) return (
        <div className="alert alert-warning m-3">
            <i className="bx bx-info-circle me-2"></i>
            Aucune donnée trouvée pour {matricule}
            <div className="mt-2">
                <button onClick={() => navigate(-1)} className="btn btn-sm btn-outline-secondary">
                    <i className="bx bx-arrow-back me-1"></i> Retour
                </button>
            </div>
        </div>
    );

    return (
        <div className="card border-0 shadow-sm">
            <div className="card-header d-flex justify-content-between align-items-center bg-white border-bottom">
                <div>
                    <h5 className="mb-0 fw-bold text-dark">
                        <i className="bx bx-calendar-check me-2 text-primary"></i>
                        FICHE DE PRESENCE
                    </h5>
                    <div className="d-flex align-items-center mt-2">
                        <span className="badge bg-light text-dark me-2 border">
                            <i className="bx bx-user me-1 text-primary"></i> 
                            {feuilles[0]?.nom_complet}
                        </span>
                        <span className="badge bg-light text-dark border">
                            <i className="bx bx-id-card me-1 text-primary"></i>
                            Matricule: {matricule}
                        </span>
                    </div>
                </div>
                <div>
                    <button onClick={() => navigate(-1)} className="btn btn-outline-primary">
                        <i className="bx bx-arrow-back me-1"></i> Retour
                    </button>
                </div>
            </div>
            
            <div className="card-body">
                <div className="card mb-4 border-primary">
                    <div className="card-header bg-light">
                        <h6 className="mb-0 text-primary">
                            <i className="bx bx-filter-alt me-2"></i>
                            FILTRES
                        </h6>
                    </div>
                    <div className="card-body">
                        <div className="row g-3 align-items-end">
                            <div className="col-md-4">
                                <label className="form-label fw-bold">Période</label>
                                <div className="input-group">
                                    <select 
                                        className="form-select"
                                        value={filters.periodType}
                                        onChange={(e) => handleFilterChange('periodType', e.target.value)}
                                    >
                                        <option value="none">Aucun filtre</option>
                                        <option value="day">Par jour</option>
                                        <option value="month">Par mois</option>
                                    </select>
                                    {filters.periodType !== 'none' && (
                                        <DatePicker
                                            selected={filters.selectedDate}
                                            onChange={(date) => handleFilterChange('selectedDate', date)}
                                            className="form-control"
                                            dateFormat={filters.periodType === 'month' ? "MM/yyyy" : "dd/MM/yyyy"}
                                            showMonthYearPicker={filters.periodType === 'month'}
                                            placeholderText={filters.periodType === 'month' ? "Sélectionner un mois" : "Sélectionner une date"}
                                            isClearable
                                        />
                                    )}
                                </div>
                            </div>

                            <div className="col-md-4">
                                <label className="form-label fw-bold">Type de séance</label>
                                <select
                                    className="form-select"
                                    value={filters.sessionType}
                                    onChange={(e) => handleFilterChange('sessionType', e.target.value)}
                                >
                                    <option value="all">Toutes les séances</option>
                                    <option value="normal">Temps normal (8h-17h)</option>
                                    <option value="unique">Séance unique (6h-14h)</option>
                                </select>
                            </div>

                            <div className="col-md-4">
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
                        <i className="bx bx-history me-2 text-primary"></i>
                        HISTORIQUE DES POINTAGES
                    </h6>
                    {filteredPresences.length === 0 ? (
                        <div className="alert alert-info mb-4">
                            <i className="bx bx-info-circle me-2"></i>
                            Aucune entrée correspondant aux filtres
                        </div>
                    ) : (
                        <>
                            <div className="mb-3 text-muted small">
                                <i className="bx bx-show me-1"></i>
                                Affichage {currentPage * PER_PAGE + 1}-{Math.min((currentPage + 1) * PER_PAGE, filteredPresences.length)}
                                sur {filteredPresences.length} résultats
                            </div>
                            
                            <div className="table-responsive">
                                <table className="table table-bordered table-hover">
                                    <thead className="table-primary">
                                        <tr>
                                            <th style={{ width: '20%' }}>
                                                <i className="bx bx-calendar me-2"></i>
                                                Date
                                            </th>
                                            <th>
                                                <i className="bx bx-time-five me-2"></i>
                                                Heures de pointage
                                            </th>
                                            <th style={{ width: '20%' }}>
                                                <i className="bx bx-task me-2"></i>
                                                Type de présence
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredPresences
                                            .slice(currentPage * PER_PAGE, (currentPage + 1) * PER_PAGE)
                                            .map((presence, index) => {
                                                const date = moment(presence.date);
                                                const presenceType = getTypePresence(presence.type_pointage);
                                                
                                                return (
                                                    <tr key={index}>
                                                        <td className="fw-bold text-primary align-middle">
                                                            {date.format('DD/MM/YYYY')}
                                                        </td>
                                                        <td className="align-middle">
                                                            <div className="d-flex flex-wrap gap-2">
                                                                {presence.heures?.map((heure, idx) => (
                                                                    <span 
                                                                        key={idx}
                                                                        className="badge bg-light text-dark border p-2 d-flex align-items-center"
                                                                    >
                                                                        <i className="bx bx-time me-2 text-muted"></i>
                                                                        {heure.substring(0, 5)}
                                                                    </span>
                                                                )) || '--:--'}
                                                            </div>
                                                        </td>
                                                        <td className="align-middle">
                                                            <span className={`badge ${presenceType.color} p-2 d-flex align-items-center`}>
                                                                <i className={`bx ${presenceType.icon} me-2`}></i>
                                                                {presenceType.label}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                    </tbody>
                                </table>
                            </div>

                            {Math.ceil(filteredPresences.length / PER_PAGE) > 1 && (
                                <div className="d-flex justify-content-center mt-4">
                                    <ReactPaginate
                                        previousLabel={<i className="bx bx-chevron-left"></i>}
                                        nextLabel={<i className="bx bx-chevron-right"></i>}
                                        pageCount={Math.ceil(filteredPresences.length / PER_PAGE)}
                                        onPageChange={({ selected }) => setCurrentPage(selected)}
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
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AgentPresenceDetail;