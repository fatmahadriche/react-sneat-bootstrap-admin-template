import React, { useEffect, useState, useRef, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
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
        
        return feuille.pointages.filter(pointage => {
            const datePointage = moment(pointage.date);
            let periodMatch = true;
            
            if (filters.periodType === 'day' && filters.selectedDate) {
                periodMatch = datePointage.isSame(filters.selectedDate, 'day');
            } else if (filters.periodType === 'month' && filters.selectedDate) {
                periodMatch = datePointage.isSame(filters.selectedDate, 'month');
            }
            
            let sessionMatch = true;
            if (filters.sessionType !== 'all') {
                const matinTime = moment(pointage.matin, 'HH:mm');
                const apresMidiTime = moment(pointage.apres_midi, 'HH:mm');
                
                if (filters.sessionType === 'normal') {
                    sessionMatch = matinTime.hours() >= 8 && apresMidiTime.hours() <= 17;
                } else if (filters.sessionType === 'unique') {
                    sessionMatch = matinTime.hours() >= 6 && apresMidiTime.hours() <= 13;
                }
            }
            
            return periodMatch && sessionMatch;
        });
    }, [feuille, filters]);

    const pageCount = Math.ceil(filteredPointages.length / PER_PAGE);
    const offset = currentPage * PER_PAGE;
    const currentPointages = filteredPointages.slice(offset, offset + PER_PAGE);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await fetch(`http://localhost:5000/api/pointages/${matricule}`, {
                    headers: {
                        'Authorization': `Bearer ${user.token}`
                    }
                });
                
                if (!res.ok) throw new Error(`Erreur HTTP! Statut: ${res.status}`);
                
                const data = await res.json();
                
                if (data.length > 0) {
                    const feuilleData = data[0];
                    setFeuille({
                        ...feuilleData,
                        pointages: (feuilleData.pointages || []).map(p => ({
                            ...p,
                            matin: p.matin || '--:--',
                            apres_midi: p.apres_midi || '--:--'
                        }))
                    });
                    setFormData({
                        primes: feuilleData.primes || [],
                        absences: feuilleData.absences || [],
                        remarques: feuilleData.remarques || ''
                    });
                } else {
                    setFeuille(null);
                }
                setError(null);
            } catch (err) {
                console.error('Erreur:', err);
                setError(err.message);
                setFeuille(null);
            } finally {
                setLoading(false);
            }
        };
        
        if (user?.token) fetchData();
    }, [user?.token, matricule]);

    const handlePageClick = ({ selected }) => {
        setCurrentPage(selected);
    };

    const handlePrint = useReactToPrint({
        content: () => componentRef.current,
        documentTitle: `Feuille_pointage_${matricule}_${moment().format('YYYY-MM-DD')}`,
        pageStyle: `
            @page { size: A4 landscape; margin: 10mm; }
            @media print {
                body { -webkit-print-color-adjust: exact; }
                .no-print { display: none !important; }
                table { width: 100%; border-collapse: collapse; }
                th, td { border: 1px solid #ddd; padding: 8px; }
                .section-title { background-color: #f2f2f2; }
            }
        `
    });

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

    const handleDeletePointage = async (pointageId) => {
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
                const response = await fetch(`http://localhost:5000/api/pointages/${matricule}/${pointageId}`, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${user.token}`
                    }
                });
                
                if (!response.ok) throw new Error('Échec de la suppression');
                
                setFeuille(prev => ({
                    ...prev,
                    pointages: prev.pointages.filter(p => p._id !== pointageId)
                }));
                
                Swal.fire('Supprimé!', 'Le pointage a été supprimé.', 'success');
            }
        } catch (error) {
            Swal.fire('Erreur!', error.message, 'error');
        }
    };

    const handleSubmit = async () => {
        try {
            const response = await fetch(`http://localhost:5000/api/pointages/${matricule}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${user.token}`
                },
                body: JSON.stringify(formData)
            });
            
            if (!response.ok) throw new Error('Échec de la mise à jour');
            
            const result = await response.json();
            setFeuille(prev => ({ ...prev, ...formData }));
            setIsEditing(false);
            
            Swal.fire('Succès!', 'Modifications enregistrées avec succès', 'success');
        } catch (error) {
            Swal.fire('Erreur!', error.message, 'error');
        }
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
                    <button onClick={handlePrint} className="btn btn-outline-primary me-2">
                        <i className="bx bx-printer me-1"></i> Imprimer
                    </button>
                    <Link to="/feuille-pointage" className="btn btn-outline-secondary me-2">
                        <i className="bx bx-arrow-back me-1"></i> Retour
                    </Link>
                    {!isEditing ? (
                        <button className="btn btn-warning" onClick={() => setIsEditing(true)}>
                            <i className="bx bx-edit me-1"></i> Modifier
                        </button>
                    ) : (
                        <button className="btn btn-success" onClick={handleSubmit}>
                            <i className="bx bx-save me-1"></i> Enregistrer
                        </button>
                    )}
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
                                        <option value="unique">Séance unique (6h-13h)</option>
                                    </select>
                                </div>
                                
                                <div className="col-md-4 d-flex align-items-end">
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
                                                    <td className="fw-bold">{feuille.date_debut_emploi.split(' ')[1].substring(0,5)}</td>
                                                    <td className="fw-bold">{feuille.date_fin_emploi.split(' ')[1].substring(0,5)}</td>
                                                    <td className="text-success fw-bold">{pointage.matin}</td>
                                                    <td className="text-danger fw-bold">{pointage.apres_midi}</td>
                                                    <td className="no-print">
                                                        <button 
                                                            className="btn btn-sm btn-outline-danger"
                                                            onClick={() => handleDeletePointage(pointage._id)}
                                                            title="Supprimer"
                                                        >
                                                            <i className="bx bx-trash"></i>
                                                        </button>
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
                                                {prime}
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
                                                {absence}
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