import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/api';
import { Line } from 'react-chartjs-2';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

const AgentReportsPage = () => {
  const { user } = useAuth();
  const [rapports, setRapports] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchAgentReports = async () => {
      setLoading(true);
      try {
        const response = await api.get('/api/rapports/agent');
        setRapports(response.data);
      } catch (error) {
        console.error('Erreur:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchAgentReports();
  }, []);

  return (
    <div className="container-xxl flex-grow-1 container-p-y">
      <h4 className="fw-bold py-3 mb-4">Mes Rapports Mensuels</h4>

      {loading && <div className="text-center">Chargement...</div>}

      <div className="row">
        {rapports.map((rapport) => (
          <div key={rapport.periode} className="col-md-12 mb-4">
            <div className="card">
              <div className="card-header">
                <h5 className="card-title mb-0">Période : {rapport.periode}</h5>
              </div>
              <div className="card-body">
                <Line
                  data={rapport.courbes}
                  options={{
                    responsive: true,
                    plugins: {
                      legend: { position: 'top' },
                      title: { display: true, text: 'Mes Statistiques' }
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

export default AgentReportsPage;