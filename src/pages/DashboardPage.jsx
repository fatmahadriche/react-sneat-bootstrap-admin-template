import React, { useEffect, useState } from 'react';
import { Line, Pie, Bar } from 'react-chartjs-2';
import { Chart as ChartJS, registerables } from 'chart.js';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Select, Spin, Alert } from 'antd';
import moment from 'moment';

ChartJS.register(...registerables);

const { Option } = Select;

const DashboardPage = () => {
  const { user } = useAuth();
  const [chartsData, setChartsData] = useState({
    present: { labels: [], datasets: [] },
    absent: { labels: [], datasets: [] },
    leave: { labels: [], datasets: [] },
    hours: { labels: [], datasets: [] },
  });
  const [pieData, setPieData] = useState({ labels: [], datasets: [] });
  const [barData, setBarData] = useState({ labels: [], datasets: [] });
  const [stats, setStats] = useState({
    presentDays: 0,
    absentDays: 0,
    leaveDays: 0,
    totalDays: 0,
    totalOvertimeHours: 0
  });
  const [availableMonths, setAvailableMonths] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState(null);
  const [selectedYear, setSelectedYear] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [debugInfo, setDebugInfo] = useState(null); // Pour debugger

  // Générer une liste statique de mois (par exemple, de janvier 2024 à mai 2025)
  useEffect(() => {
    const months = [];
    const startDate = moment('2024-01-01');
    const endDate = moment('2025-05-31');
    let currentDate = startDate.clone();

    while (currentDate.isSameOrBefore(endDate)) {
      months.push({
        month: currentDate.month() + 1, // 1 à 12
        year: currentDate.year(),
        label: currentDate.format('MMMM YYYY'),
      });
      currentDate.add(1, 'month');
    }

    setAvailableMonths(months.reverse()); // Les mois les plus récents en premier
    if (months.length > 0) {
      setSelectedMonth(months[0].month);
      setSelectedYear(months[0].year);
    }
  }, []);

  // Récupérer les données des graphiques
  useEffect(() => {
    const fetchChartData = async () => {
      if (!user?.matricule || !selectedMonth || !selectedYear) {
        setError('Utilisateur non authentifié ou période non sélectionnée');
        return;
      }

      setLoading(true);
      setError(null);
      try {
        console.log('Fetching data for:', { matricule: user.matricule, month: selectedMonth, year: selectedYear });
        
        const response = await axios.get(
          `/api/charts/${user.matricule}/charts?month=${selectedMonth}&year=${selectedYear}`,
          {
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
          }
        );
        
        console.log('API Response:', response.data);
        
        // Safe access to response data with fallbacks
        const responseData = response.data?.data || {};
        const responseStats = response.data?.stats || {};
        
        // Debug info
        setDebugInfo({
          hasData: !!responseData,
          present: responseData.present || null,
          absent: responseData.absent || null,
          leave: responseData.leave || null,
          hours: responseData.hours || null,
          stats: responseStats
        });
        
        // ✅ CORRECTION 1: Vérifier si les données existent vraiment
        const safeChartsData = {
          present: responseData.present?.datasets?.length > 0 ? responseData.present : { labels: [], datasets: [] },
          absent: responseData.absent?.datasets?.length > 0 ? responseData.absent : { labels: [], datasets: [] },
          leave: responseData.leave?.datasets?.length > 0 ? responseData.leave : { labels: [], datasets: [] },
          hours: responseData.hours?.datasets?.length > 0 ? responseData.hours : { labels: [], datasets: [] },
        };
        
        setChartsData(safeChartsData);
        
        setStats({
          presentDays: responseStats.presentDays || 0,
          absentDays: responseStats.absentDays || 0,
          leaveDays: responseStats.leaveDays || 0,
          totalDays: responseStats.totalDays || 0,
          totalOvertimeHours: responseStats.totalOvertimeHours || 0
        });

        // ✅ CORRECTION 2: Créer le pie chart seulement si on a des stats valides
        if (responseStats.presentDays > 0 || responseStats.absentDays > 0 || responseStats.leaveDays > 0) {
          setPieData({
            labels: ['Présent', 'Absent', 'En congé'],
            datasets: [
              {
                data: [
                  responseStats.presentDays || 0,
                  responseStats.absentDays || 0,
                  responseStats.leaveDays || 0,
                ],
                backgroundColor: ['#52c41a', '#ff4d4f', '#1890ff'],
                hoverBackgroundColor: ['#73d13d', '#ff7875', '#40a9ff'],
              },
            ],
          });
        } else {
          setPieData({ labels: [], datasets: [] });
        }

        // ✅ CORRECTION 3: Créer le bar chart seulement si on a des données d'heures
        const hoursData = responseData.hours;
        if (hoursData?.datasets?.[0]?.data?.some(val => val > 0)) {
          setBarData({
            labels: hoursData.labels || [],
            datasets: [
              {
                label: 'Heures Supplémentaires',
                data: hoursData.datasets[0].data || [],
                backgroundColor: '#fa8c16',
                borderColor: '#fa8c16',
                borderWidth: 1,
              },
            ],
          });
        } else {
          setBarData({ labels: [], datasets: [] });
        }
        
      } catch (err) {
        console.error('Error fetching chart data:', err);
        setError(err.response?.data?.error || 'Erreur lors de la récupération des données');
        
        // Reset data on error
        setChartsData({
          present: { labels: [], datasets: [] },
          absent: { labels: [], datasets: [] },
          leave: { labels: [], datasets: [] },
          hours: { labels: [], datasets: [] },
        });
        setPieData({ labels: [], datasets: [] });
        setBarData({ labels: [], datasets: [] });
        setStats({
          presentDays: 0,
          absentDays: 0,
          leaveDays: 0,
          totalDays: 0,
          totalOvertimeHours: 0
        });
        setDebugInfo({ error: err.message });
      } finally {
        setLoading(false);
      }
    };
    fetchChartData();
  }, [selectedMonth, selectedYear, user?.matricule]);

  const handlePeriodChange = (value) => {
    const [month, year] = value.split('-').map(Number);
    setSelectedMonth(month);
    setSelectedYear(year);
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top' },
    },
  };

  const pieOptions = {
    responsive: true,
    plugins: {
      legend: { position: 'right' },
      title: {
        display: true,
        text: `Répartition des Jours - ${moment({ year: selectedYear, month: selectedMonth - 1 }).format('MMMM YYYY')}`,
      },
    },
  };

  const barOptions = {
    responsive: true,
    plugins: {
      legend: { position: 'top' },
      title: {
        display: true,
        text: `Heures Supplémentaires par Jour - ${moment({ year: selectedYear, month: selectedMonth - 1 }).format('MMMM YYYY')}`,
      },
    },
    scales: {
      y: { beginAtZero: true, title: { display: true, text: 'Heures' } },
      x: { title: { display: true, text: 'Date' } },
    },
  };

  // ✅ CORRECTION 4: Fonctions utilitaires pour vérifier les données
  const hasValidChartData = (chartData) => {
    return chartData?.datasets?.length > 0 && chartData.datasets[0]?.data?.length > 0;
  };

  const hasValidPieData = () => {
    return pieData?.datasets?.length > 0 && pieData.datasets[0]?.data?.some(val => val > 0);
  };

  const hasValidBarData = () => {
    return barData?.datasets?.length > 0 && barData.datasets[0]?.data?.some(val => val > 0);
  };

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <h2 style={{ marginBottom: '20px' }}>Tableau de Bord de Présence</h2>

      <div style={{ marginBottom: '20px' }}>
        <Select
          style={{ width: 200 }}
          value={selectedMonth && selectedYear ? `${selectedMonth}-${selectedYear}` : undefined}
          onChange={handlePeriodChange}
          placeholder="Sélectionner un mois"
          disabled={loading || availableMonths.length === 0}
        >
          {availableMonths.map(({ month, year, label }) => (
            <Option key={`${month}-${year}`} value={`${month}-${year}`}>
              {label}
            </Option>
          ))}
        </Select>
      </div>

      {error && (
        <Alert
          message="Erreur"
          description={error}
          type="error"
          showIcon
          style={{ marginBottom: '20px' }}
        />
      )}

      {/* Debug info - À supprimer en production */}
      {debugInfo && (
        <div style={{ marginBottom: '20px', padding: '10px', background: '#f0f0f0', borderRadius: '4px', fontSize: '12px' }}>
          <h4>Debug Info:</h4>
          <pre>{JSON.stringify(debugInfo, null, 2)}</pre>
        </div>
      )}

      {loading && (
        <div style={{ textAlign: 'center', margin: '20px 0' }}>
          <Spin size="large" />
        </div>
      )}

      {!loading && selectedMonth && selectedYear && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '20px',
          }}
        >
          {/* ✅ CORRECTION 5: Conditions simplifiées et debug visuel */}
          {hasValidChartData(chartsData.present) && (
            <div style={{ height: '300px', border: '1px solid #d9d9d9', padding: '10px' }}>
              <h4>Jours Présents</h4>
              <Line data={chartsData.present} options={chartOptions} />
            </div>
          )}
          
          {hasValidChartData(chartsData.absent) && (
            <div style={{ height: '300px', border: '1px solid #d9d9d9', padding: '10px' }}>
              <h4>Jours Absents</h4>
              <Line data={chartsData.absent} options={chartOptions} />
            </div>
          )}
          
          {hasValidChartData(chartsData.leave) && (
            <div style={{ height: '300px', border: '1px solid #d9d9d9', padding: '10px' }}>
              <h4>Jours en Congé</h4>
              <Line data={chartsData.leave} options={chartOptions} />
            </div>
          )}
          
          {hasValidChartData(chartsData.hours) && (
            <div style={{ height: '300px', border: '1px solid #d9d9d9', padding: '10px' }}>
              <h4>Heures Supplémentaires</h4>
              <Line data={chartsData.hours} options={chartOptions} />
            </div>
          )}

          {hasValidPieData() && (
            <div style={{ height: '300px', border: '1px solid #d9d9d9', padding: '10px' }}>
              <h4>Répartition</h4>
              <Pie data={pieData} options={pieOptions} />
            </div>
          )}

          {hasValidBarData() && (
            <div style={{ height: '300px', border: '1px solid #d9d9d9', padding: '10px' }}>
              <h4>Heures Supplémentaires (Bar)</h4>
              <Bar data={barData} options={barOptions} />
            </div>
          )}
          
          {/* Message si aucun graphique n'est affiché */}
          {!hasValidChartData(chartsData.present) && 
           !hasValidChartData(chartsData.absent) && 
           !hasValidChartData(chartsData.leave) && 
           !hasValidChartData(chartsData.hours) && 
           !hasValidPieData() && 
           !hasValidBarData() && (
            <div style={{ 
              gridColumn: '1 / -1', 
              textAlign: 'center', 
              padding: '40px', 
              background: '#fafafa', 
              borderRadius: '8px',
              border: '2px dashed #d9d9d9' 
            }}>
              <h3>Aucun graphique à afficher</h3>
              <p>Les données pour cette période ne sont pas disponibles ou sont vides.</p>
              <p>Vérifiez que des données existent pour {selectedMonth}/{selectedYear}</p>
            </div>
          )}
        </div>
      )}

      {stats?.totalDays > 0 && (
        <div style={{ marginTop: '20px', padding: '20px', background: '#f5f5f5', borderRadius: '8px' }}>
          <h3>
            Statistiques pour {moment({ year: selectedYear, month: selectedMonth - 1 }).format('MMMM YYYY')}
          </h3>
          <p><strong>Jours Présents :</strong> {stats.presentDays}</p>
          <p><strong>Jours Absents :</strong> {stats.absentDays}</p>
          <p><strong>Jours en Congé :</strong> {stats.leaveDays}</p>
          <p><strong>Total Heures Supplémentaires :</strong> {stats.totalOvertimeHours?.toFixed(2)} heures</p>
        </div>
      )}
    </div>
  );
};

export default DashboardPage;