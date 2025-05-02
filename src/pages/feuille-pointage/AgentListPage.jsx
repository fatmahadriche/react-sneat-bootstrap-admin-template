import React, { useEffect, useState, useMemo, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Link } from 'react-router-dom';
import moment from 'moment';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import ReactPaginate from 'react-paginate';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

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
    const pdfTableRef = useRef();
    const PER_PAGE = 10;

    const getStatusBadgeStyle = (status) => {
        switch (status) {
            case 'Présent': return 'bg-success';
            case 'Absent': return 'bg-danger';
            case 'En congé': return 'bg-primary';
            default: return 'bg-secondary';
        }
    };

    const getPDFStatusStyle = (status) => {
        const baseStyle = {
            padding: '4px 8px',
            borderRadius: '12px',
            display: 'inline-block',
            margin: '2px',
            fontSize: '10px',
            color: 'white'
        };
        
        switch (status) {
            case 'Présent': return { ...baseStyle, backgroundColor: '#28a745' };
            case 'Absent': return { ...baseStyle, backgroundColor: '#dc3545' };
            case 'En congé': return { ...baseStyle, backgroundColor: '#0d6efd' };
            default: return { ...baseStyle, backgroundColor: '#6c757d' };
        }
    };

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
        return feuilles.flatMap(feuille => {
            // Extraire les heures de la feuille principale
            const heureDebut = feuille.date_debut_emploi?.split(' ')[1]?.substring(0, 5) || '08:00';
            const heureFin = feuille.date_fin_emploi?.split(' ')[1]?.substring(0, 5) || '17:00';
            
            return feuille.pointages.map(pointage => ({
                ...pointage,
                matricule: feuille.matricule,
                nom_complet: feuille.nom_complet,
                heureDebut, // Ajout des heures de la feuille
                heureFin,   // Ajout des heures de la feuille
                primes: feuille.primes,
                absences: feuille.absences,
                remarques: feuille.remarques
            }));
        });
    }, [feuilles]);

    const filteredPointages = useMemo(() => {
        return allPointages.filter(pointage => {
            const datePointage = moment(pointage.date, 'YYYY-MM-DD');
            let periodMatch = true;
            
            // Filtrage par période
            if (filters.periodType !== 'none' && filters.selectedDate) {
                const filterDate = moment(filters.selectedDate).startOf(filters.periodType);
                
                if (filters.periodType === 'day') {
                    periodMatch = datePointage.isSame(filterDate, 'day');
                } else if (filters.periodType === 'month') {
                    periodMatch = datePointage.isBetween(
                        filterDate.startOf('month'),
                        filterDate.endOf('month'),
                        null,
                        '[]'
                    );
                }
            }
    
            // Filtrage par type de séance
            let sessionMatch = true;
            if (filters.sessionType !== 'all') {
                const debut = parseInt(pointage.heureDebut.split(':')[0]);
                const fin = parseInt(pointage.heureFin.split(':')[0]);
                
                if (filters.sessionType === 'normal') {
                    sessionMatch = debut === 8 && fin === 17;
                } else if (filters.sessionType === 'unique') {
                    sessionMatch = debut === 6 && fin === 14;
                }
            }
    
            return periodMatch && sessionMatch;
        });
    }, [allPointages, filters]);

    const isFilterActive = filters.periodType !== 'none'
        || filters.selectedDate !== null
        || filters.sessionType !== 'all';

    const filteredPageCount = Math.ceil(filteredPointages.length / PER_PAGE);
    const filteredOffset = currentPage * PER_PAGE;
    const filteredPaginatedData = filteredPointages.slice(filteredOffset, filteredOffset + PER_PAGE);

    const unfilteredPageCount = Math.ceil(allPointages.length / PER_PAGE);
    const unfilteredOffset = currentPage * PER_PAGE;
    const unfilteredPaginatedData = allPointages.slice(unfilteredOffset, unfilteredOffset + PER_PAGE);

    const dataToRender = isFilterActive ? filteredPaginatedData : unfilteredPaginatedData;
    const pageCount = isFilterActive ? filteredPageCount : unfilteredPageCount;

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

    const exportTableToPDF = () => {
        const table = pdfTableRef.current;
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pdfWidth = 210;
        const pdfHeight = 297;
        html2canvas(table, {
            scale: 2,
            useCORS: true,
            letterRendering: true,
            logging: false
        }).then((canvas) => {
            const imgData = canvas.toDataURL('image/png');
            const imgWidth = pdfWidth;
            const imgHeight = (canvas.height * imgWidth) / canvas.width;
            const totalPages = Math.ceil(imgHeight / pdfHeight);
            for (let i = 0; i < totalPages; i++) {
                if (i > 0) pdf.addPage();
                const position = -(i * pdfHeight);
                pdf.addImage(
                    imgData,
                    'PNG',
                    0,
                    position,
                    imgWidth,
                    imgHeight,
                    undefined,
                    'FAST'
                );
            }
            pdf.save(`Feuilles_pointage_${moment().format('YYYY-MM-DD')}.pdf`);
        });
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
                <button
                    onClick={exportTableToPDF}
                    className="btn btn-primary"
                >
                    <i className="bx bx-download me-1"></i> Télécharger PDF
                </button>
            </div>

            <div style={{ position: 'absolute', left: '-9999px' }}>
                <div ref={pdfTableRef}>
                    <h4 style={{ textAlign: 'center', color: '#2c3e50', fontFamily: 'Arial, sans-serif', fontSize: '24px', marginBottom: '20px', padding: '10px' }}>
                        Feuille de Pointage {isFilterActive ? 'Filtrée' : 'Complète'}
                    </h4>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'Arial, sans-serif', fontSize: '12px' }}>
                        <thead>
                            <tr>
                                {['Matricule', 'Nom Complet', 'Date', 'Début', 'Fin', 'Matin', 'Après-midi', 'Primes', 'Absences', 'Remarques', 'Statut'].map((header, index) => (
                                    <th key={index} style={{ backgroundColor: '#f8f9fa', color: '#495057', padding: '12px', border: '1px solid #dee2e6', textAlign: 'left', fontWeight: 'bold' }}>
                                        {header}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {(isFilterActive ? filteredPointages : allPointages).map((pointage, index) => (
                                <tr key={`pdf-${pointage._id}-${index}`} style={{ backgroundColor: index % 2 === 0 ? '#ffffff' : '#f8f9fa' }}>
                                    <td style={{ padding: '10px', border: '1px solid #dee2e6' }}>{pointage.matricule}</td>
                                    <td style={{ padding: '10px', border: '1px solid #dee2e6' }}>{pointage.nom_complet}</td>
                                    <td style={{ padding: '10px', border: '1px solid #dee2e6' }}>{moment(pointage.date).format('DD/MM/YYYY')}</td>
                                    <td style={{ padding: '10px', border: '1px solid #dee2e6' }}>{pointage.heureDebut}</td>
                                    <td style={{ padding: '10px', border: '1px solid #dee2e6' }}>{pointage.heureFin}</td>
                                    <td style={{ padding: '10px', border: '1px solid #dee2e6' }}>{pointage.matin || '--:--'}</td>
                                    <td style={{ padding: '10px', border: '1px solid #dee2e6' }}>{pointage.apres_midi || '--:--'}</td>
                                    <td style={{ padding: '10px', border: '1px solid #dee2e6' }}>
                                        {pointage.primes?.map((prime, idx) => (
                                            <div key={idx} style={{ backgroundColor: '#28a745', color: 'white', padding: '4px 8px', borderRadius: '12px', display: 'inline-block', margin: '2px', fontSize: '10px' }}>
                                                {typeof prime === 'object' ? prime.type : prime}
                                            </div>
                                        )) || 'Aucune'}
                                    </td>
                                    <td style={{ padding: '10px', border: '1px solid #dee2e6' }}>
                                        {pointage.absences?.map((absence, idx) => (
                                            <div key={idx} style={{ backgroundColor: '#dc3545', color: 'white', padding: '4px 8px', borderRadius: '12px', display: 'inline-block', margin: '2px', fontSize: '10px' }}>
                                                {typeof absence === 'object' ? absence.type : absence}
                                            </div>
                                        )) || 'Aucune'}
                                    </td>
                                    <td style={{ padding: '10px', border: '1px solid #dee2e6' }}>{pointage.remarques || 'Aucune'}</td>
                                    <td style={{ padding: '10px', border: '1px solid #dee2e6' }}>
                                        <div style={getPDFStatusStyle(pointage.status)}>
                                            {pointage.status}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
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
                                <th style={{ backgroundColor: "#f8f9fa", color: "#0dcaf0", verticalAlign: 'middle' }}>
                                    <i className="bx bx-info-circle me-1"></i>
                                    Statut
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {dataToRender.map((pointage, index) => (
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
                                    <td style={{ verticalAlign: 'middle' }}>{pointage.heureDebut}</td>
                                    <td style={{ verticalAlign: 'middle' }}>{pointage.heureFin}</td>
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
                                    <td style={{ verticalAlign: 'middle' }}>
                                        <span className={`badge ${getStatusBadgeStyle(pointage.status)}`}>
                                            {pointage.status}
                                        </span>
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
            </div>
        </div>
    );
};

export default AgentListPage;