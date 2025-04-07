import React, { useEffect, useState, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import moment from 'moment';
import Swal from 'sweetalert2';
import { useReactToPrint } from 'react-to-print';

const FeuillePointagePage = () => {
    const { user } = useAuth();
    const [feuilles, setFeuilles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [refresh, setRefresh] = useState(false);
    const [isPrinting, setIsPrinting] = useState(false);
    const componentRef = useRef(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const res = await fetch('http://localhost:5000/api/pointages', {
                    headers: {
                        'Authorization': `Bearer ${user.token}`
                    }
                });
                
                if (!res.ok) throw new Error(`Erreur HTTP! Statut: ${res.status}`);
                
                const data = await res.json();

                const normalizedData = data.map(item => ({
                    ...item,
                    nom_complet: item.nom_complet || 'Non spécifié',
                    pointages: (item.pointages || []).map(p => ({
                        ...p,
                        seance_matin: p.matin || '--:--',
                        seance_midi: p.apres_midi || '--:--'
                    })),
                    primes: item.primes || [],
                    absences: item.absences || [],
                    remarques: item.remarques || ''
                }));
                
                setFeuilles(normalizedData);
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
    }, [user?.token, refresh]);

    const updateFeuille = async (matricule, updatedData) => {
        try {
            const response = await fetch(`http://localhost:5000/api/pointages/${matricule}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${user.token}`
                },
                body: JSON.stringify(updatedData)
            });
            
            if (!response.ok) throw new Error('Échec de la mise à jour');
            
            const result = await response.json();
            
            Swal.fire({
                title: 'Succès!',
                text: 'Modification enregistrée avec succès',
                icon: 'success',
                confirmButtonText: 'OK'
            });

            setRefresh(prev => !prev);
            
            return result;
        } catch (error) {
            console.error('Erreur mise à jour:', error);
            Swal.fire({
                title: 'Erreur!',
                text: error.message,
                icon: 'error',
                confirmButtonText: 'OK'
            });
            throw error;
        }
    };

    const deleteFeuille = async (matricule) => {
        try {
            const result = await Swal.fire({
                title: 'Êtes-vous sûr?',
                text: "Vous ne pourrez pas annuler cette action!",
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#3085d6',
                cancelButtonColor: '#d33',
                confirmButtonText: 'Oui, supprimer!'
            });
            
            if (result.isConfirmed) {
                const response = await fetch(`http://localhost:5000/api/pointages/${matricule}`, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${user.token}`
                    }
                });
                
                if (!response.ok) throw new Error('Échec de la suppression');
                
                Swal.fire(
                    'Supprimé!',
                    'La feuille de pointage a été supprimée.',
                    'success'
                );
                
                setRefresh(prev => !prev);
            }
        } catch (error) {
            console.error('Erreur suppression:', error);
            Swal.fire({
                title: 'Erreur!',
                text: error.message,
                icon: 'error',
                confirmButtonText: 'OK'
            });
        }
    };

    const handlePrint = useReactToPrint({
        content: () => componentRef.current,
        onBeforeGetContent: () => {
            setIsPrinting(true);
            return new Promise((resolve) => {
                if (!componentRef.current) {
                    Swal.fire('Erreur', 'Document non prêt pour l\'impression', 'error');
                    setIsPrinting(false);
                    return;
                }
                if (feuilles.length > 0) {
                    resolve();
                } else {
                    Swal.fire({
                        title: 'Aucune donnée',
                        text: 'Il n\'y a aucune feuille de pointage à imprimer',
                        icon: 'warning'
                    });
                    setIsPrinting(false);
                    throw new Error('No data to print');
                }
            });
        },
        onAfterPrint: () => setIsPrinting(false),
        pageStyle: `
            @page { 
                size: A4 landscape;
                margin: 10mm;
                @top-center { 
                    content: "Feuilles de Pointage - ${moment().format('DD/MM/YYYY')}";
                    font-size: 12px;
                }
                @bottom-right { 
                    content: "Page " counter(page) " sur " counter(pages);
                    font-size: 10px;
                }
            }
            @media print {
                body { 
                    -webkit-print-color-adjust: exact;
                    visibility: hidden;
                }
                .print-content, .print-content * {
                    visibility: visible;
                }
                .print-content {
                    position: absolute;
                    left: 0;
                    top: 0;
                    width: 100%;
                    padding: 0;
                    margin: 0;
                }
                .no-print { 
                    display: none !important; 
                }
                table { 
                    width: 100%; 
                    border-collapse: collapse; 
                    font-size: 12px;
                }
                th, td { 
                    border: 1px solid #ddd; 
                    padding: 8px; 
                    text-align: left;
                }
                th {
                    background-color: #f2f2f2;
                }
            }
        `,
        documentTitle: `Feuilles_de_pointage_${moment().format('YYYY-MM-DD')}`,
        removeAfterPrint: true
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
        <>
            <div className="card">
                <div className="card-header d-flex justify-content-between align-items-center">
                    <h5 className="mb-0">Feuilles de Pointage</h5>
                    <button 
                        onClick={handlePrint}
                        className="btn btn-primary no-print"
                        disabled={loading || feuilles.length === 0 || isPrinting}
                    >
                        {isPrinting ? (
                            <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
                        ) : (
                            <i className="bx bx-printer me-1"></i>
                        )}
                        Imprimer
                    </button>
                </div>
                <div className="card-body">
                    <div className="table-responsive">
                        <table className="table table-bordered">
                            <thead>
                                <tr>
                                    <th>Matricule</th>
                                    <th>Nom Complet</th>
                                    <th>Date</th>
                                    <th>Début Emploi</th>
                                    <th>Fin Emploi</th>
                                    <th>Pointage Matin</th>
                                    <th>Pointage Midi</th>
                                    <th>Absences</th>
                                    <th>Primes</th>
                                    <th>Remarques</th>
                                    <th className="no-print">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {feuilles.length > 0 ? (
                                    feuilles.map(feuille => (
                                        <FeuilleRow
                                            key={feuille._id} 
                                            feuille={feuille} 
                                            onUpdate={updateFeuille}
                                            onDelete={deleteFeuille}
                                        />
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="11" className="text-center">
                                            Aucune feuille de pointage disponible
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Contenu caché pour l'impression */}
            <div style={{ display: 'none' }}>
                <div ref={componentRef} className="print-content">
                    <h4 className="text-center mb-4">Feuilles de Pointage - {moment().format('DD/MM/YYYY')}</h4>
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Matricule</th>
                                <th>Nom Complet</th>
                                <th>Date</th>
                                <th>Début</th>
                                <th>Fin</th>
                                <th>Matin</th>
                                <th>Midi</th>
                                <th>Absences</th>
                                <th>Primes</th>
                                <th>Remarques</th>
                            </tr>
                        </thead>
                        <tbody>
                            {feuilles.map(feuille => (
                                <tr key={feuille._id}>
                                    <td>{feuille.matricule}</td>
                                    <td>{feuille.nom_complet}</td>
                                    <td>{feuille.pointages?.[0]?.date ? moment(feuille.pointages[0].date).format('DD/MM/YYYY') : '--/--/----'}</td>
                                    <td>{feuille.date_debut_emploi?.split(' ')[1]?.substring(0,5) || '--:--'}</td>
                                    <td>{feuille.date_fin_emploi?.split(' ')[1]?.substring(0,5) || '--:--'}</td>
                                    <td>{feuille.pointages?.[0]?.seance_matin || '--:--'}</td>
                                    <td>{feuille.pointages?.[0]?.seance_midi || '--:--'}</td>
                                    <td>{feuille.absences?.join(', ') || 'Aucune'}</td>
                                    <td>{feuille.primes?.join(', ') || 'Aucune'}</td>
                                    <td>{feuille.remarques || 'Aucune'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </>
    );
};

const FeuilleRow = ({ feuille, onUpdate, onDelete }) => {
    const [localFeuille, setLocalFeuille] = useState({ ...feuille });
    const [isEditing, setIsEditing] = useState(false);
    const [textAreaValue, setTextAreaValue] = useState(feuille.remarques || '');

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

    const handleTextChange = (e) => {
        setTextAreaValue(e.target.value);
        setLocalFeuille(prev => ({ ...prev, remarques: e.target.value }));
    };

    const handleSave = async () => {
        try {
            await onUpdate(localFeuille.matricule, {
                primes: localFeuille.primes,
                absences: localFeuille.absences,
                remarques: textAreaValue
            });
            setIsEditing(false);
        } catch (error) {
            console.error('Erreur lors de la sauvegarde:', error);
        }
    };

    const handleDelete = () => {
        onDelete(localFeuille.matricule);
    };

    return (
        <tr>
            <td>
                <span className="badge bg-primary">{localFeuille.matricule}</span>
            </td>
            <td>{localFeuille.nom_complet}</td>
            <td>{localFeuille.pointages?.[0]?.date ? moment(localFeuille.pointages[0].date).format('DD/MM/YYYY') : '--/--/----'}</td>
            <td>{localFeuille.date_debut_emploi?.split(' ')[1]?.substring(0,5) || '--:--'}</td>
            <td>{localFeuille.date_fin_emploi?.split(' ')[1]?.substring(0,5) || '--:--'}</td>
            <td className="text-success fw-medium">
                {localFeuille.pointages?.[0]?.seance_matin || '--:--'}
            </td>
            <td className="text-danger fw-medium">
                {localFeuille.pointages?.[0]?.seance_midi || '--:--'}
            </td>
            <td>
                {localFeuille.absences?.join(', ') || 'Aucune'}
            </td>
            <td>
                {localFeuille.primes?.join(', ') || 'Aucune'}
            </td>
            <td>
                {isEditing ? (
                    <textarea 
                        className="form-control form-control-sm"
                        value={textAreaValue}
                        onChange={handleTextChange}
                        rows="2"
                    />
                ) : (
                    textAreaValue || 'Aucune remarque'
                )}
            </td>
            <td className="no-print">
                <div className="d-flex gap-2">
                    {!isEditing ? (
                        <>
                            <button 
                                className="btn btn-sm btn-primary"
                                onClick={() => setIsEditing(true)}
                            >
                                <i className="bx bx-edit-alt"></i>
                            </button>
                            <button 
                                className="btn btn-sm btn-danger"
                                onClick={handleDelete}
                            >
                                <i className="bx bx-trash"></i>
                            </button>
                        </>
                    ) : (
                        <>
                            <button 
                                className="btn btn-sm btn-success"
                                onClick={handleSave}
                            >
                                <i className="bx bx-save"></i>
                            </button>
                            <button 
                                className="btn btn-sm btn-secondary"
                                onClick={() => {
                                    setIsEditing(false);
                                    setTextAreaValue(localFeuille.remarques);
                                }}
                            >
                                <i className="bx bx-x"></i>
                            </button>
                        </>
                    )}
                </div>
            </td>
        </tr>
    );
};

export default FeuillePointagePage;