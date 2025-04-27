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
    
    // Calculs de pagination
    const pageCount = Math.ceil(feuilles.flatMap(f => f.historique).length / PER_PAGE);
    const offset = currentPage * PER_PAGE;
    const currentPresences = feuilles.flatMap(f => f.historique).slice(offset, offset + PER_PAGE);

    const filteredPresences = useMemo(() => {
        return feuilles.flatMap(feuille => feuille.historique || [])
            .filter(presence => {
                const datePresence = moment.utc(presence.date);
                let periodMatch = true;

                // Filtrage par période
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

                // Filtrage par session
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
        onPrintError: () => Swal.fire('Error', 'Print failed', 'error')
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
            case 'ENTREEMATIN': return 'Matin';
            case 'ENTREEMIDI': return 'Midi';
            default: return type;
        }
    };

    if(loading) return (
        <div className="d-flex justify-content-center p-3">
            <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
            </div>
        </div>
    );

    if(error) return (
        <div className="alert alert-danger m-3">
            <i className="bx bx-error-circle me-2"></i>
            Load error: {error}
            <div className="mt-2">
                <button onClick={() => navigate(-1)} className="btn btn-sm btn-outline-secondary">
                    <i className="bx bx-arrow-back me-1"></i> Back
                </button>
            </div>
        </div>
    );

    if(feuilles.length === 0) return (
        <div className="alert alert-warning m-3">
            <i className="bx bx-info-circle me-2"></i>
            No data found for {matricule}
            <div className="mt-2">
                <button onClick={() => navigate(-1)} className="btn btn-sm btn-outline-secondary">
                    <i className="bx bx-arrow-back me-1"></i> Back
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
                        ATTENDANCE RECORD
                    </h5>
                    <div className="d-flex align-items-center mt-2">
                        <span className="badge bg-light text-dark me-2 border">
                            <i className="bx bx-user me-1 text-muted"></i> 
                            {feuilles[0]?.nom_complet}
                        </span>
                        <span className="badge bg-light text-dark border">
                            <i className="bx bx-id-card me-1 text-muted"></i>
                            ID: {matricule}
                        </span>
                    </div>
                </div>
                <div>
                    <button onClick={handlePrint} className="btn btn-outline-primary me-2">
                        <i className="bx bx-printer me-1"></i> Print
                    </button>
                    <button onClick={() => navigate(-1)} className="btn btn-outline-secondary">
                        <i className="bx bx-arrow-back me-1"></i> Back
                    </button>
                </div>
            </div>
            
            <div className="card-body">
                <div ref={componentRef}>
                    <div className="card mb-4 border-primary">
                        <div className="card-header bg-light">
                            <h6 className="mb-0 text-primary">
                                <i className="bx bx-filter-alt me-2"></i>
                                FILTERS
                            </h6>
                        </div>
                        <div className="card-body">
                            <div className="row g-3">
                                <div className="col-md-3">
                                    <label className="form-label fw-bold">Period</label>
                                    <select 
                                        className="form-select"
                                        value={filters.periodType}
                                        onChange={(e) => handleFilterChange('periodType', e.target.value)}
                                    >
                                        <option value="none">No filter</option>
                                        <option value="day">Day</option>
                                        <option value="month">Month</option>
                                        <option value="custom">Custom range</option>
                                    </select>
                                </div>

                                {filters.periodType === 'day' && (
                                    <div className="col-md-3">
                                        <label className="form-label fw-bold">Specific date</label>
                                        <DatePicker
                                            selected={filters.selectedDate}
                                            onChange={(date) => handleFilterChange('selectedDate', date)}
                                            className="form-control"
                                            dateFormat="dd/MM/yyyy"
                                            placeholderText="Select date"
                                            isClearable
                                        />
                                    </div>
                                )}

                                {filters.periodType === 'month' && (
                                    <div className="col-md-3">
                                        <label className="form-label fw-bold">Month</label>
                                        <DatePicker
                                            selected={filters.selectedDate}
                                            onChange={(date) => handleFilterChange('selectedDate', date)}
                                            className="form-control"
                                            dateFormat="MM/yyyy"
                                            showMonthYearPicker
                                            placeholderText="Select month"
                                            isClearable
                                        />
                                    </div>
                                )}

                                {filters.periodType === 'custom' && (
                                    <>
                                        <div className="col-md-3">
                                            <label className="form-label fw-bold">Start date</label>
                                            <DatePicker
                                                selected={filters.periode_debut}
                                                onChange={(date) => handleFilterChange('periode_debut', date)}
                                                className="form-control"
                                                dateFormat="dd/MM/yyyy"
                                                placeholderText="Start date"
                                                isClearable
                                            />
                                        </div>
                                        <div className="col-md-3">
                                            <label className="form-label fw-bold">End date</label>
                                            <DatePicker
                                                selected={filters.periode_fin}
                                                onChange={(date) => handleFilterChange('periode_fin', date)}
                                                className="form-control"
                                                dateFormat="dd/MM/yyyy"
                                                placeholderText="End date"
                                                minDate={filters.periode_debut}
                                                isClearable
                                            />
                                        </div>
                                    </>
                                )}

                                <div className="col-md-3">
                                    <label className="form-label fw-bold">Session type</label>
                                    <select
                                        className="form-select"
                                        value={filters.sessionType}
                                        onChange={(e) => handleFilterChange('sessionType', e.target.value)}
                                    >
                                        <option value="all">All sessions</option>
                                        <option value="normal">Normal hours (8AM-5PM)</option>
                                        <option value="unique">Special session (6AM-1PM)</option>
                                    </select>
                                </div>

                                <div className="col-md-3 d-flex align-items-end">
                                    <button 
                                        className="btn btn-outline-primary w-100" 
                                        onClick={resetFilters}
                                        disabled={filters.periodType === 'none' && filters.sessionType === 'all'}
                                    >
                                        <i className="bx bx-reset me-2"></i>
                                        Reset
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="mb-4">
                        <h6 className="p-3 mb-3 bg-light border-bottom">
                            <i className="bx bx-time me-2 text-muted"></i>
                            ATTENDANCE HISTORY
                        </h6>
                        {filteredPresences.length === 0 ? (
                            <div className="alert alert-info mb-4">
                                <i className="bx bx-info-circle me-2"></i>
                                No entries matching filters
                            </div>
                        ) : (
                            <>
                                <div className="mb-3 text-muted small">
                                    <i className="bx bx-show me-1"></i>
                                    Showing {offset + 1}-{Math.min(offset + PER_PAGE, filteredPresences.length)} 
                                    of {filteredPresences.length} entries
                                </div>
                                
                                <div className="table-responsive">
                                    <table className="table table-bordered table-hover">
                                        <thead className="table-primary">
                                            <tr>
                                                <th className="text-nowrap">Date</th>
                                                <th className="text-nowrap">Time</th>
                                                <th className="text-nowrap">Type</th>
                                                <th className="no-print text-nowrap">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {currentPresences.map((presence, index) => {
                                                const date = moment.utc(presence.date);
                                                const times = presence.heures?.map(h => h.substring(0, 5)).join(' → ') || '--:--';
                                                
                                                return (
                                                    <tr key={index}>
                                                        <td className="fw-bold">{date.format('DD/MM/YYYY')}</td>
                                                        <td className="fw-bold">{times}</td>
                                                        <td>
                                                            <span className={`badge ${
                                                                presence.type_pointage === 'ENTREEMATIN' ? 'bg-success' : 
                                                                'bg-primary'
                                                            }`}>
                                                                {getTypePresence(presence.type_pointage)}
                                                            </span>
                                                        </td>
                                                        <td className="no-print">
                                                            <button 
                                                                className="btn btn-sm btn-outline-danger"
                                                                onClick={() => handleDeletePresence(presence._id)}
                                                                title="Delete"
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
        </div>
    );
};

export default AgentPresenceDetail;