import React, { useEffect, useState, useRef, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import moment from 'moment';
import { useReactToPrint } from 'react-to-print';
import Swal from 'sweetalert2';
import ReactPaginate from 'react-paginate';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

const AgentFeuilleDetail = () => {
    const { matricule } = useParams();
    const { user } = useAuth();
    const [feuille, setFeuille] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [selectedPointageDate, setSelectedPointageDate] = useState(null); // Ajouté
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        primes: [],
        absences: [],
        remarques: ''
    });
    const [currentPage, setCurrentPage] = useState(0);
    const [filters, setFilters] = useState({
        periodType: 'none',
        selectedDate: null,
        sessionType: 'all'
    });
    const componentRef = useRef(null);
    const PER_PAGE = 4;

    const filteredPointages = useMemo(() => {
        if (!feuille) return [];
        return feuille.pointages
            .filter(pointage => {
                const datePointage = moment(pointage.date);
                let periodMatch = true;

                // Filtrage par période
                if (filters.periodType === 'day' && filters.selectedDate) {
                    periodMatch = datePointage.isSame(filters.selectedDate, 'day');
                } else if (filters.periodType === 'month' && filters.selectedDate) {
                    periodMatch = datePointage.isSame(filters.selectedDate, 'month');
                }

                // Filtrage par type de séance
                let sessionMatch = true;
                if (filters.sessionType !== 'all' && feuille.date_debut_emploi && feuille.date_fin_emploi) {
                    const debutEmploi = moment(feuille.date_debut_emploi.split(' ')[1], 'HH:mm');
                    const finEmploi = moment(feuille.date_fin_emploi.split(' ')[1], 'HH:mm');

                    if (filters.sessionType === 'normal') {
                        sessionMatch = debutEmploi.hours() === 8 && finEmploi.hours() === 17;
                    } else if (filters.sessionType === 'unique') {
                        sessionMatch = debutEmploi.hours() === 6 && finEmploi.hours() === 14;
                    }
                }

                return periodMatch && sessionMatch;
            })
            .sort((a, b) => new Date(a.date) - new Date(b.date));
    }, [feuille, filters]);

    const pageCount = Math.ceil(filteredPointages.length / PER_PAGE);
    const offset = currentPage * PER_PAGE;
    const currentPointages = filteredPointages.slice(offset, offset + PER_PAGE);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                setError(null);

                if (!user?.token) {
                    throw new Error("Non authentifié");
                }

                const res = await fetch(`http://localhost:5000/api/pointages/${matricule}`, {
                    headers: { 'Authorization': `Bearer ${user.token}` }
                });

                if (!res.ok) {
                    if (res.status === 404) {
                        setFeuille(null);
                        return;
                    }
                    throw new Error(`Erreur HTTP! Statut: ${res.status}`);
                }

                const response = await res.json();

                if (!response.success || !response.data?.length) {
                    setFeuille(null);
                    throw new Error("Aucune donnée trouvée dans la réponse");
                }

                // Fusionner toutes les feuilles
                const mergedFeuilles = response.data.reduce((acc, feuille) => {
                    return {
                        ...feuille,
                        pointages: [...acc.pointages || [], ...feuille.pointages || []],
                        primes: [...acc.primes || [], ...feuille.primes || []],
                        absences: [...acc.absences || [], ...feuille.absences || []]
                    };
                }, {});

                const formattedData = {
                    ...mergedFeuilles,
                    pointages: (mergedFeuilles.pointages || []).map(p => ({
                        ...p,
                        matin: p.matin?.substring(0, 5) || '--:--',
                        apres_midi: p.apres_midi?.substring(0, 5) || '--:--'
                    })),
                    primes: mergedFeuilles.primes?.map(p => p.type || p) || [],
                    absences: mergedFeuilles.absences?.map(a => a.type || a) || []
                };

                setFeuille(formattedData);
                setFormData({
                    primes: formattedData.primes,
                    absences: formattedData.absences,
                    remarques: formattedData.remarques || ''
                });

            } catch (err) {
                setError(err.message);
                setFeuille(null);

                if (err.message.includes("403")) {
                    Swal.fire({
                        icon: 'error',
                        title: 'Accès refusé',
                        text: 'Vous ne pouvez accéder qu\'à votre propre feuille de pointage'
                    });
                }

            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [user?.token, matricule]);

    const handlePageClick = ({ selected }) => {
        setCurrentPage(selected);
    };

    const handleFilterChange = (name, value) => {
        setFilters(prev => ({
            ...prev,
            [name]: value,
            ...(name === 'periodType' && { selectedDate: null })
        }));
        setCurrentPage(0);
    };

    const resetFilters = () => {
        setFilters({
            periodType: 'none',
            selectedDate: null,
            sessionType: 'all'
        });
        setCurrentPage(0);
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleCheckboxChange = (type, value) => {
        setFormData(prev => {
            const currentValues = [...prev[type]];
            const index = currentValues.indexOf(value);
            if (index === -1) {
                currentValues.push(value);
            } else {
                currentValues.splice(index, 1);
            }
            return { ...prev, [type]: currentValues };
        });
    };

    const handleEditClick = (pointage) => {
        setIsEditing(true);
        setSelectedPointageDate(pointage.date);
        // Optionnel : charger les données spécifiques à ce pointage si besoin
    };

    const handleSubmit = async () => {
        if (!selectedPointageDate) {
            Swal.fire('Erreur!', 'Aucune date de pointage sélectionnée', 'error');
            // ...dans handleSubmit, juste après le Swal.fire de succès :
localStorage.setItem('refreshAgentList', '1');
            return;
        }
        try {
            const response = await fetch(`http://localhost:5000/api/pointages/${matricule}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${user.token}`
                },
                body: JSON.stringify({
                    date: selectedPointageDate,
                    primes: formData.primes,
                    absences: formData.absences,
                    remarques: formData.remarques
                })
            });

            const data = await response.json();

            if (!response.ok) throw new Error(data.error || 'Échec de la mise à jour');

            setFeuille(prev => ({
                ...prev,
                primes: data.primes || prev.primes,
                absences: data.absences || prev.absences,
                remarques: data.remarques !== undefined ? data.remarques : prev.remarques
            }));

            setIsEditing(false);
            setSelectedPointageDate(null);

            Swal.fire({
                title: 'Succès!',
                text: 'Modifications enregistrées avec succès',
                icon: 'success'
            }).then(() => {
                navigate('/feuille-pointage');
            });

        } catch (error) {
            Swal.fire('Erreur!', error.message, 'error');
        }
    };

    const handleCancel = () => {
        setFormData({
            primes: feuille.primes,
            absences: feuille.absences,
            remarques: feuille.remarques || ''
        });
        setIsEditing(false);
        setSelectedPointageDate(null);
    };

    const primesOptions = [
        'Prime de repas',
        'Panier',
        'Prime de conduite',
        'Prime d\'hébergement'
    ];

    const absencesOptions = [
        'Congé maladie',
        'Congé annuel',
        'Absence injustifiée',
        'Accident de travail',
        'Repos compensatoire'
    ];

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
                    <Link to="/feuille-pointage" className="btn btn-sm btn-outline-secondary">
                        <i className="bx bx-arrow-back me-1"></i> Retour à la liste
                    </Link>
                </div>
            </div>
        );
    }

    if (!feuille) {
        return (
            <div className="alert alert-warning m-3">
                <i className="bx bx-info-circle me-2"></i>
                Aucune donnée trouvée pour le matricule {matricule}
                <div className="mt-2">
                    <Link to="/feuille-pointage" className="btn btn-sm btn-outline-secondary">
                        <i className="bx bx-arrow-back me-1"></i> Retour à la liste
                    </Link>
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
                        FICHE DE POINTAGE
                    </h5>
                    <div className="d-flex align-items-center mt-2">
                        <span className="badge bg-light text-dark me-2 border">
                            <i className="bx bx-user me-1 text-muted"></i>
                            {feuille.nom_complet}
                        </span>
                        <span className="badge bg-light text-dark border">
                            <i className="bx bx-id-card me-1 text-muted"></i>
                            Matricule: {feuille.matricule}
                        </span>
                    </div>
                </div>
                <div>
                    <Link to="/feuille-pointage" className="btn btn-outline-secondary">
                        <i className="bx bx-arrow-back me-1"></i> Retour
                    </Link>
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
                                                wrapperClassName="w-100"
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
                            <i className="bx bx-time me-2 text-muted"></i>
                            HISTORIQUE DES POINTAGES
                        </h6>
                        {filteredPointages.length === 0 ? (
                            <div className="alert alert-info mb-4">
                                <i className="bx bx-info-circle me-2"></i>
                                Aucun pointage ne correspond aux critères de filtrage
                            </div>
                        ) : (
                            <>
                                <div className="mb-3 text-muted small">
                                    <i className="bx bx-show me-1"></i>
                                    Affichage {offset + 1}-{Math.min(offset + PER_PAGE, filteredPointages.length)}
                                    sur {filteredPointages.length} résultats
                                </div>
                                <div className="table-responsive">
                                    <table className="table table-bordered table-hover">
                                        <thead className="table-primary">
                                            <tr>
                                                <th className="text-nowrap">Date</th>
                                                <th className="text-nowrap">Heure Début</th>
                                                <th className="text-nowrap">Heure Fin</th>
                                                <th className="text-nowrap">Pointage Matin</th>
                                                <th className="text-nowrap">Pointage Après-midi</th>
                                                <th className="no-print text-nowrap">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {currentPointages.map((pointage, index) => (
                                                <tr key={index}>
                                                    <td className="fw-bold">{moment(pointage.date).format('DD/MM/YYYY')}</td>
                                                    <td className="fw-bold">{feuille.date_debut_emploi.split(' ')[1].substring(0, 5)}</td>
                                                    <td className="fw-bold">{feuille.date_fin_emploi.split(' ')[1].substring(0, 5)}</td>
                                                    <td className="text-success fw-bold">{pointage.matin}</td>
                                                    <td className="text-danger fw-bold">{pointage.apres_midi}</td>
                                                    <td className="no-print">
                                                        {!isEditing ? (
                                                            <button
                                                                className="btn btn-sm btn-warning me-2"
                                                                onClick={() => handleEditClick(pointage)}
                                                                title="Modifier"
                                                            >
                                                                <i className="bx bx-edit"></i> Modifier
                                                            </button>
                                                        ) : (
                                                            selectedPointageDate === pointage.date && (
                                                                <div className="d-flex">
                                                                    <button
                                                                        className="btn btn-sm btn-success me-2"
                                                                        onClick={handleSubmit}
                                                                        title="Enregistrer"
                                                                    >
                                                                        <i className="bx bx-save"></i> Enregistrer
                                                                    </button>
                                                                    <button
                                                                        className="btn btn-sm btn-secondary"
                                                                        onClick={handleCancel}
                                                                        title="Annuler"
                                                                    >
                                                                        <i className="bx bx-x"></i> Annuler
                                                                    </button>
                                                                </div>
                                                            )
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                                {pageCount > 1 && (
                                    <div className="d-flex justify-content-center mt-3">
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
                                            forcePage={currentPage}
                                        />
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                    <div className="mb-4">
                        <h6 className="p-3 mb-3 bg-light border-bottom">
                            <i className="bx bx-money me-2 text-muted"></i>
                            PRIMES
                        </h6>
                        {isEditing ? (
                            <div className="row">
                                {primesOptions.map(prime => (
                                    <div key={prime} className="col-md-3 mb-2">
                                        <div className="form-check">
                                            <input
                                                className="form-check-input"
                                                type="checkbox"
                                                id={`prime-${prime}`}
                                                checked={formData.primes.includes(prime)}
                                                onChange={() => handleCheckboxChange('primes', prime)}
                                            />
                                            <label className="form-check-label" htmlFor={`prime-${prime}`}>
                                                {prime}
                                            </label>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div>
                                {feuille.primes?.length > 0 ? (
                                    <ul className="list-group">
                                        {feuille.primes.map((prime, index) => (
                                            <li key={index} className="list-group-item">
                                                {prime.type || prime}
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <p className="text-muted">
                                        <i className="bx bx-info-circle me-2"></i>
                                        Aucune prime enregistrée
                                    </p>
                                )}
                            </div>
                        )}
                    </div>
                    <div className="mb-4">
                        <h6 className="p-3 mb-3 bg-light border-bottom">
                            <i className="bx bx-calendar-minus me-2 text-muted"></i>
                            ABSENCES
                        </h6>
                        {isEditing ? (
                            <div className="row">
                                {absencesOptions.map(absence => (
                                    <div key={absence} className="col-md-3 mb-2">
                                        <div className="form-check">
                                            <input
                                                className="form-check-input"
                                                type="checkbox"
                                                id={`absence-${absence}`}
                                                checked={formData.absences.includes(absence)}
                                                onChange={() => handleCheckboxChange('absences', absence)}
                                            />
                                            <label className="form-check-label" htmlFor={`absence-${absence}`}>
                                                {absence}
                                            </label>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div>
                                {feuille.absences?.length > 0 ? (
                                    <ul className="list-group">
                                        {feuille.absences.map((absence, index) => (
                                            <li key={index} className="list-group-item">
                                                {absence.type || absence}
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <p className="text-muted">
                                        <i className="bx bx-info-circle me-2"></i>
                                        Aucune absence enregistrée
                                    </p>
                                )}
                            </div>
                        )}
                    </div>
                    <div className="mb-4">
                        <h6 className="p-3 mb-3 bg-light border-bottom">
                            <i className="bx bx-comment me-2 text-muted"></i>
                            REMARQUES
                        </h6>
                        {isEditing ? (
                            <textarea
                                className="form-control"
                                name="remarques"
                                value={formData.remarques}
                                onChange={handleInputChange}
                                rows="3"
                                placeholder="Ajoutez des remarques ici..."
                            />
                        ) : (
                            <div className="card card-body">
                                {feuille.remarques || (
                                    <span className="text-muted">
                                        <i className="bx bx-info-circle me-2"></i>
                                        Aucune remarque
                                    </span>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AgentFeuilleDetail;