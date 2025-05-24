import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/api';
import { Line } from 'react-chartjs-2';
import { Chart, registerables } from 'chart.js';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

Chart.register(...registerables);

const AdminReportsPage = () => {
  const { user } = useAuth();
  const [rapports, setRapports] = useState([]);
  const [selectedMatricule, setSelectedMatricule] = useState('');
  const [startDate, setStartDate] = useState(new Date());
  const [loading, setLoading] = useState(false);

  const fetchReports = async (matricule, mois, annee) => {
    setLoading(true);
    try {
      const params = {};
      if (matricule) params.matricule = matricule;
      if (mois) params.mois = mois;
      if (annee) params.annee = annee;

      const response = await api.get('/api/rapports', { params });
      setRapports(response.data);
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    const mois = startDate.getMonth() + 1;
    const annee = startDate.getFullYear();
    fetchReports(selectedMatricule, mois, annee);
  };

  return (
    <div className="container-xxl flex-grow-1 container-p-y">
      <h4 className="fw-bold py-3 mb-4">Rapports des Agents</h4>
      
      <div className="card mb-4">
        <div className="card-body">
          <form onSubmit={handleSearch}>
            <div className="row g-3">
              <div className="col-md-4">
                <input
                  type="text"
                  className="form-control"
                  placeholder="Matricule agent"
                  value={selectedMatricule}
                  onChange={(e) => setSelectedMatricule(e.target.value)}
                />
              </div>
              <div className="col-md-4">
                <DatePicker
                  selected={startDate}
                  onChange={(date) => setStartDate(date)}
                  dateFormat="MM/yyyy"
                  showMonthYearPicker
                  className="form-control"
                />
              </div>
              <div className="col-md-4">
                <button type="submit" className="btn btn-primary">
                  Rechercher
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>

      {loading && <div className="text-center">Chargement...</div>}

      <div className="row">
        {rapports.map((rapport) => (
          <div key={`${rapport.matricule}-${rapport.periode}`} className="col-md-6 mb-4">
            <div className="card">
              <div className="card-header">
                <h5 className="card-title mb-0">
                  {rapport.prenom} {rapport.nom} - {rapport.periode}
                </h5>
              </div>
              <div className="card-body">
                <Line
                  data={rapport.courbes}
                  options={{
                    responsive: true,
                    plugins: {
                      legend: { position: 'top' },
                      title: { display: true, text: 'Statistiques Mensuelles' }
                    }
                  }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminReportsPage;