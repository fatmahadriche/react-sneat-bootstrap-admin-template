import React, { useEffect, useState, useMemo, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Link } from 'react-router-dom';
import moment from 'moment';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { useReactToPrint } from 'react-to-print';
import ReactPaginate from 'react-paginate';

const AgentListPage = () => {
    const { user } = useAuth();
    const [feuilles, setFeuilles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [currentPage, setCurrentPage] = useState(0);
    const [filters, setFilters] = useState({
        periodType: 'none',
        selectedDate: null,
        sessionType: 'all'
    });
    const componentRef = useRef(null);
    const PER_PAGE = 10;

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
    }, [user?.token]);

    const allPointages = useMemo(() => {
        return feuilles.flatMap(feuille => 
            feuille.pointages.map(pointage => ({
                ...pointage,
                matricule: feuille.matricule,
                nom_complet: feuille.nom_complet,
                date_debut_emploi: feuille.date_debut_emploi,
                date_fin_emploi: feuille.date_fin_emploi,
                primes: feuille.primes,
                absences: feuille.absences,
                remarques: feuille.remarques
            }))
        );
    }, [feuilles]);

    const filteredPointages = useMemo(() => {
        return allPointages.filter(pointage => {
            const datePointage = moment(pointage.date);
            let periodMatch = true;

            if (filters.periodType === 'day' && filters.selectedDate) {
                periodMatch = datePointage.isSame(filters.selectedDate, 'day');
            } else if (filters.periodType === 'month' && filters.selectedDate) {
                periodMatch = datePointage.isSame(filters.selectedDate, 'month');
            }

            let sessionMatch = true;
            if (filters.sessionType !== 'all') {
                const matinTime = moment(pointage.matin || '00:00', 'HH:mm');
                const apresMidiTime = moment(pointage.apres_midi || '00:00', 'HH:mm');

                if (filters.sessionType === 'normal') {
                    sessionMatch = matinTime.hours() >= 8 && apresMidiTime.hours() <= 17;
                } else if (filters.sessionType === 'unique') {
                    sessionMatch = matinTime.hours() >= 6 && apresMidiTime.hours() <= 13;
                }
            }

            return periodMatch && sessionMatch;
        });
    }, [allPointages, filters]);

    const isFilterActive = filters.periodType !== 'none' 
        || filters.selectedDate !== null 
        || filters.sessionType !== 'all';

    const pageCount = Math.ceil(filteredPointages.length / PER_PAGE);
    const offset = currentPage * PER_PAGE;
    const currentPointages = filteredPointages.slice(offset, offset + PER_PAGE);
    const dataToRender = isFilterActive ? filteredPointages : currentPointages;

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

    const handlePrint = useReactToPrint({
        content: () => componentRef.current,
        documentTitle: `Feuilles_pointage_${moment().format('YYYY-MM-DD')}`,
        pageStyle: `
            @page { size: A4 landscape; margin: 10mm; }
            @media print {
                body { -webkit-print-color-adjust: exact; }
                table { width: 100%; border-collapse: collapse; }
                th, td { border: 1px solid #ddd; padding: 8px; }
                .no-print { display: none !important; }
            }
        `
    });

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
        <div className="card shadow-sm">
            <div className="card-header d-flex justify-content-between align-items-center">
                <h5 className="mb-0">
                    <i className="bx bx-time me-2" style={{ fontSize: "1.5rem", color: "#0d6efd" }}></i>
                    Feuilles de Pointage
                </h5>
                <button onClick={handlePrint} className="btn btn-primary">
                    <i className="bx bx-printer me-1"></i> Télécharger PDF
                </button>
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
                                        disabled={!isFilterActive}
                                    >
                                        <i className="bx bx-reset me-2"></i>
                                        Réinitialiser
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="table-responsive" style={{ overflowX: 'auto' }}>
                        <table className="table table-hover table-striped" style={{ minWidth: '1200px' }}>
                            <caption className="ms-4">Liste des pointages des agents</caption>
                            <thead className="table-light">
                                <tr>
                                    <th style={{ backgroundColor: "#f8f9fa", color: "#0d6efd", verticalAlign: 'middle' }}>
                                        <i className="bx bx-id-card me-1"></i>
                                        Matricule
                                    </th>
                                    <th style={{ backgroundColor: "#f8f9fa", color: "#198754", verticalAlign: 'middle' }}>
                                        <i className="bx bx-user me-1"></i>
                                        Nom Complet
                                    </th>
                                    <th style={{ backgroundColor: "#f8f9fa", color: "#fd7e14", verticalAlign: 'middle' }}>
                                        <i className="bx bx-calendar me-1"></i>
                                        Date
                                    </th>
                                    <th style={{ backgroundColor: "#f8f9fa", color: "#6f42c1", verticalAlign: 'middle' }}>
                                        <i className="bx bx-time me-1"></i>
                                        Début
                                    </th>
                                    <th style={{ backgroundColor: "#f8f9fa", color: "#d63384", verticalAlign: 'middle' }}>
                                        <i className="bx bx-time-five me-1"></i>
                                        Fin
                                    </th>
                                    <th style={{ backgroundColor: "#f8f9fa", color: "#ffc107", verticalAlign: 'middle' }}>
                                        <i className="bx bx-sun me-1"></i>
                                        Matin
                                    </th>
                                    <th style={{ backgroundColor: "#f8f9fa", color: "#dc3545", verticalAlign: 'middle' }}>
                                        <i className="bx bx-moon me-1"></i>
                                        Après-midi
                                    </th>
                                    <th style={{ backgroundColor: "#f8f9fa", color: "#20c997", verticalAlign: 'middle' }}>
                                        <i className="bx bx-star me-1"></i>
                                        Primes
                                    </th>
                                    <th style={{ backgroundColor: "#f8f9fa", color: "#ff6b6b", verticalAlign: 'middle' }}>
                                        <i className="bx bx-x-circle me-1"></i>
                                        Absences
                                    </th>
                                    <th style={{ backgroundColor: "#f8f9fa", color: "#495057", verticalAlign: 'middle' }}>
                                        <i className="bx bx-comment me-1"></i>
                                        Remarques
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {dataToRender.map((pointage, index) => {
                                    const heureDebut = pointage.date_debut_emploi?.split(' ')[1]?.substring(0, 5) || '--:--';
                                    const heureFin = pointage.date_fin_emploi?.split(' ')[1]?.substring(0, 5) || '--:--';

                                    return (
                                        <tr key={`${pointage._id}-${index}`}>
                                            <td style={{ verticalAlign: 'middle' }}>
                                                <Link 
                                                    to={`/feuille-pointage/${pointage.matricule}`} 
                                                    className="d-flex align-items-center text-decoration-none"
                                                >
                                                    <i className="bx bx-link-external me-1"></i>
                                                    {pointage.matricule}
                                                </Link>
                                            </td>
                                            <td style={{ verticalAlign: 'middle' }}>{pointage.nom_complet}</td>
                                            <td style={{ verticalAlign: 'middle' }}>{moment(pointage.date).format('DD/MM/YYYY')}</td>
                                            <td style={{ verticalAlign: 'middle' }}>{heureDebut}</td>
                                            <td style={{ verticalAlign: 'middle' }}>{heureFin}</td>
                                            <td style={{ verticalAlign: 'middle' }}>
                                                <span className="badge bg-label-primary">
                                                    {pointage.matin || '--:--'}
                                                </span>
                                            </td>
                                            <td style={{ verticalAlign: 'middle' }}>
                                                <span className="badge bg-label-warning">
                                                    {pointage.apres_midi || '--:--'}
                                                </span>
                                            </td>
                                            <td style={{ verticalAlign: 'middle' }}>
                                                {pointage.primes?.map((prime, idx) => (
                                                    <span key={idx} className="badge bg-success me-1 mb-1">
                                                        {typeof prime === 'object' ? prime.type : prime}
                                                    </span>
                                                )) || <span className="text-muted">Aucune</span>}
                                            </td>
                                            <td style={{ verticalAlign: 'middle' }}>
                                                {pointage.absences?.map((absence, idx) => (
                                                    <span key={idx} className="badge bg-danger me-1 mb-1">
                                                        {typeof absence === 'object' ? absence.type : absence}
                                                    </span>
                                                )) || <span className="text-muted">Aucune</span>}
                                            </td>
                                            <td style={{ verticalAlign: 'middle' }}>
                                                {pointage.remarques || 
                                                    <span className="text-muted">Aucune</span>}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    {!isFilterActive && pageCount > 1 && (
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
                </div>
            </div>
        </div>
    );
};

export default AgentListPage;