import React, { useEffect, useState, useMemo, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import moment from 'moment';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import ReactPaginate from 'react-paginate';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

const AgentFeuillePointage = () => {
    const { matricule } = useParams();
    const { user } = useAuth();
    const [feuille, setFeuille] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
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
        });
    }, [feuille, filters]);

    const pageCount = Math.ceil(filteredPointages.length / PER_PAGE);
    const offset = currentPage * PER_PAGE;
    const currentPointages = filteredPointages.slice(offset, offset + PER_PAGE);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                setError(null);

                const res = await fetch(`http://localhost:5000/api/pointages/${matricule}`, {
                    headers: { 
                        'Authorization': `Bearer ${user.token}`,
                        'Content-Type': 'application/json'
                    }
                });

                if (!res.ok) throw new Error(`Erreur HTTP! Statut: ${res.status}`);
                
                const response = await res.json();
                
                if (!response.success || !response.data?.length) {
                    setFeuille(null);
                    throw new Error("Aucune donnée trouvée");
                }

                const formattedData = {
                    ...response.data[0],
                    pointages: (response.data[0].pointages || []).map(p => ({
                        ...p,
                        matin: p.matin?.substring(0, 5) || '--:--',
                        apres_midi: p.apres_midi?.substring(0, 5) || '--:--'
                    }))
                };

                setFeuille(formattedData);

            } catch (err) {
                console.error('Erreur:', err);
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

        if (user?.token) fetchData();
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

    const exportToPDF = () => {
        const input = componentRef.current;
        html2canvas(input)
            .then((canvas) => {
                const imgData = canvas.toDataURL('image/png');
                const pdf = new jsPDF('p', 'mm', 'a4');
                const imgWidth = 210;
                const imgHeight = (canvas.height * imgWidth) / canvas.width;
                pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
                pdf.save(`feuille-pointage-${matricule}.pdf`);
            });
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
                Erreur lors du chargement : {error}
            </div>
        );
    }

    if (!feuille) {
        return (
            <div className="alert alert-warning m-3">
                <i className="bx bx-info-circle me-2"></i>
                Aucune donnée trouvée pour votre matricule
            </div>
        );
    }

    return (
        <div className="card border-0 shadow-sm">
            <div className="card-header d-flex justify-content-between align-items-center bg-white border-bottom">
                <div>
                    <h5 className="mb-0 fw-bold text-dark">
                        <i className="bx bx-calendar-check me-2 text-primary"></i>
                        MA FICHE DE POINTAGE
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
                <button onClick={exportToPDF} className="btn btn-primary">
                    <i className="bx bx-download me-1"></i> Exporter en PDF
                </button>
            </div>

            <div className="card-body" ref={componentRef}>
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
                            Aucun pointage trouvé pour cette période
                        </div>
                    ) : (
                        <>
                            <div className="table-responsive">
                                <table className="table table-bordered table-hover">
                                    <thead className="table-primary">
                                        <tr>
                                            <th>Date</th>
                                            <th>Heure Début</th>
                                            <th>Heure Fin</th>
                                            <th>Pointage Matin</th>
                                            <th>Pointage Après-midi</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {currentPointages.map((pointage, index) => (
                                            <tr key={index}>
                                                <td>{moment(pointage.date).format('DD/MM/YYYY')}</td>
                                                <td>{feuille.date_debut_emploi.split(' ')[1].substring(0, 5)}</td>
                                                <td>{feuille.date_fin_emploi.split(' ')[1].substring(0, 5)}</td>
                                                <td className="text-success fw-bold">{pointage.matin}</td>
                                                <td className="text-danger fw-bold">{pointage.apres_midi}</td>
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
                    <div className="card card-body">
                        {feuille.primes?.length > 0 ? (
                            <ul className="list-group">
                                {feuille.primes.map((prime, index) => (
                                    <li key={index} className="list-group-item">
                                        {prime}
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <span className="text-muted">
                                <i className="bx bx-info-circle me-2"></i>
                                Aucune prime attribuée
                            </span>
                        )}
                    </div>
                </div>

                <div className="mb-4">
                    <h6 className="p-3 mb-3 bg-light border-bottom">
                        <i className="bx bx-calendar-minus me-2 text-muted"></i>
                        ABSENCES
                    </h6>
                    <div className="card card-body">
                        {feuille.absences?.length > 0 ? (
                            <ul className="list-group">
                                {feuille.absences.map((absence, index) => (
                                    <li key={index} className="list-group-item">
                                        {absence}
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <span className="text-muted">
                                <i className="bx bx-info-circle me-2"></i>
                                Aucune absence enregistrée
                            </span>
                        )}
                    </div>
                </div>

                <div className="mb-4">
                    <h6 className="p-3 mb-3 bg-light border-bottom">
                        <i className="bx bx-comment me-2 text-muted"></i>
                        REMARQUES
                    </h6>
                    <div className="card card-body">
                        {feuille.remarques || (
                            <span className="text-muted">
                                <i className="bx bx-info-circle me-2"></i>
                                Aucune remarque
                            </span>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AgentFeuillePointage;