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
        periode_debut: null,
        periode_fin: null,
        sessionType: 'all'
    });

    const PER_PAGE = 5;

    const filteredPresences = useMemo(() => {
        return feuilles.flatMap(feuille => feuille.historique || [])
            .filter(presence => {
                const datePresence = moment.utc(presence.date);
                let periodMatch = true;

                switch(filters.periodType) {
                    case 'day':
                        if(filters.selectedDate) {
                            periodMatch = datePresence.isSame(moment.utc(filters.selectedDate), 'day');
                        }
                        break;
                    case 'month':
                        if(filters.selectedDate) {
                            periodMatch = datePresence.isSame(moment.utc(filters.selectedDate), 'month');
                        }
                        break;
                    case 'custom':
                        if(filters.periode_debut && filters.periode_fin) {
                            const start = moment.utc(filters.periode_debut).startOf('day');
                            const end = moment.utc(filters.periode_fin).endOf('day');
                            periodMatch = datePresence.isBetween(start, end, null, '[]');
                        }
                        break;
                    default:
                        periodMatch = true;
                }

                let sessionMatch = true;
                if(filters.sessionType !== 'all' && presence.heures) {
                    sessionMatch = presence.heures.some(heure => {
                        const [h, m] = heure.split(':').map(Number);
                        const totalMinutes = h * 60 + m;
                        
                        return filters.sessionType === 'normal' ? 
                            (totalMinutes >= 480 && totalMinutes <= 1020) : 
                            (totalMinutes >= 360 && totalMinutes <= 780);
                    });
                }

                return periodMatch && sessionMatch;
            })
            .sort((a, b) => moment.utc(b.date).diff(moment.utc(a.date)));
    }, [feuilles, filters]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const params = new URLSearchParams();
                let periodeDebut, periodeFin;

                switch(filters.periodType) {
                    case 'day':
                        if(filters.selectedDate) {
                            periodeDebut = moment.utc(filters.selectedDate).format('YYYY-MM-DD');
                            periodeFin = periodeDebut;
                        }
                        break;
                    case 'month':
                        if(filters.selectedDate) {
                            periodeDebut = moment.utc(filters.selectedDate).startOf('month').format('YYYY-MM-DD');
                            periodeFin = moment.utc(filters.selectedDate).endOf('month').format('YYYY-MM-DD');
                        }
                        break;
                    case 'custom':
                        if(filters.periode_debut && filters.periode_fin) {
                            periodeDebut = moment.utc(filters.periode_debut).format('YYYY-MM-DD');
                            periodeFin = moment.utc(filters.periode_fin).format('YYYY-MM-DD');
                        }
                        break;
                }

                if(periodeDebut && periodeFin) {
                    params.append('periode_debut', periodeDebut);
                    params.append('periode_fin', periodeFin);
                }

                const res = await fetch(`http://localhost:5000/api/presences/${matricule}?${params.toString()}`, {
                    headers: {
                        'Authorization': `Bearer ${user.token}`,
                        'Content-Type': 'application/json'
                    }
                });

                if(!res.ok) throw new Error(await res.text());
                
                const data = await res.json();
                setFeuilles(data.map(f => ({
                    ...f,
                    historique: f.historique?.sort((a, b) => 
                        moment.utc(a.date).diff(moment.utc(b.date)))
                })));
                
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        
        if(user?.token) fetchData();
    }, [user?.token, matricule, filters]);

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
                        <div className="row g-3">
                            <div className="col-md-3">
                                <label className="form-label fw-bold">Période</label>
                                <select 
                                    className="form-select"
                                    value={filters.periodType}
                                    onChange={(e) => handleFilterChange('periodType', e.target.value)}
                                >
                                    <option value="none">Sans filtre</option>
                                    <option value="day">Jour</option>
                                    <option value="month">Mois</option>
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
                                        isClearable
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
                                        isClearable
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
                                            isClearable
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
                                            isClearable
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
                                    <option value="normal">Heures normales (8h-17h)</option>
                                    <option value="unique">Séance spéciale (6h-14h)</option>
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
                                                const date = moment.utc(presence.date);
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