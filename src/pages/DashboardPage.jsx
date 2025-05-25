import React, { useState, useEffect } from 'react';
import { Line, Pie, Bar } from 'react-chartjs-2';
import { Card, Row, Col, DatePicker, Spin, Statistic, Alert } from 'antd';
import { 
  CheckCircleOutlined, 
  CloseCircleOutlined, 
  ClockCircleOutlined,
  CalendarOutlined
} from '@ant-design/icons';
import moment from 'moment';
import styled from 'styled-components';
import { useAuth } from '../context/AuthContext';
import api from '../api/api';

const { MonthPicker } = DatePicker;

// Styles intégrés avec styled-components
const DashboardContainer = styled.div`
  padding: 20px;
  max-width: 1400px;
  margin: 0 auto;

  .center-spinner {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
  }

  .ant-card {
    box-shadow: 0 2px 8px rgba(0,0,0,0.09);
    border-radius: 8px;
    height: 100%;

    .ant-card-head-title {
      font-weight: 500;
      color: #2c3e50;
    }

    .ant-statistic-title {
      font-size: 14px;
    }
  }

  @media (min-width: 992px) {
    .chart-card {
      height: 400px;
      
      .ant-card-body {
        height: calc(100% - 56px);
        display: flex;
        flex-direction: column;
        
        canvas {
          flex: 1;
          min-height: 300px;
        }
      }
    }

    // Styles spécifiques pour le graphique d'évolution mensuelle
    .monthly-evolution-card {
      height: 500px; // Augmenté de 400px à 500px
      
      .ant-card-body {
        height: calc(100% - 56px);
        display: flex;
        flex-direction: column;
        
        canvas {
          flex: 1;
          min-height: 400px; // Augmenté de 300px à 400px
        }
      }
    }
  }

  // Pour les écrans mobiles et tablettes
  @media (max-width: 991px) {
    .monthly-evolution-card {
      .ant-card-body {
        min-height: 350px; // Hauteur minimale pour mobile
        
        canvas {
          min-height: 300px;
        }
      }
    }
  }
`;

const DashboardCharts = ({ matricule }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [data, setData] = useState(null);
  const [period, setPeriod] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });

  const effectiveMatricule = matricule || user?.matricule;

  const fetchData = async (month, year) => {
    try {
      setLoading(true);
      setError('');
      if (!effectiveMatricule) throw new Error('Matricule non disponible');
      
      const response = await api.get(`/api/charts/${effectiveMatricule}/charts?month=${month}&year=${year}`);
      setData(response.data);
    } catch (err) {
      console.error('Error:', err);
      setError(err.response?.data?.error || err.message || 'Erreur de chargement');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    effectiveMatricule && fetchData(period.split('-')[1], period.split('-')[0]);
  }, [period, effectiveMatricule]);

  const handlePeriodChange = (date) => {
    date && setPeriod(`${date.year()}-${String(date.month() + 1).padStart(2, '0')}`);
  };

  if (loading) return <Spin size="large" className="center-spinner" />;
  if (error) return <Alert message={error} type="error" showIcon />;
  if (!data) return <Alert message="Aucune donnée disponible" type="info" showIcon />;

  return (
    <DashboardContainer>
      <Row gutter={[16, 16]} className="mb-4">
        <Col span={24}>
          <Card
            title="Sélection de la période"
            extra={
              <MonthPicker
                format="MMMM YYYY"
                value={moment(period)}
                onChange={handlePeriodChange}
                allowClear={false}
              />
            }
          />
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        {[
          { title: 'Présents', value: data.stats.presentDays, color: '#52c41a', icon: <CheckCircleOutlined /> },
          { title: 'Absents', value: data.stats.absentDays, color: '#ff4d4f', icon: <CloseCircleOutlined /> },
          { title: 'Congés', value: data.stats.leaveDays, color: '#1890ff', icon: <CalendarOutlined /> },
          { title: 'Heures supp.', value: data.stats.totalOvertimeHours.toFixed(1), color: '#fa8c16', icon: <ClockCircleOutlined />, suffix: 'h' }
        ].map((stat, i) => (
          <Col key={i} xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title={stat.title}
                value={stat.value}
                suffix={stat.suffix}
                prefix={React.cloneElement(stat.icon, { style: { color: stat.color } })}
              />
            </Card>
          </Col>
        ))}
      </Row>

      <Row gutter={[16, 16]} className="mt-4">
        <Col xs={24} md={12} lg={8}>
          <Card title="Répartition des présences" className="chart-card">
            <Pie
              data={{
                labels: ['Présents', 'Absents', 'Congés'],
                datasets: [{
                  data: [data.stats.presentDays, data.stats.absentDays, data.stats.leaveDays],
                  backgroundColor: ['#52c41a80', '#ff4d4f80', '#1890ff80'],
                  borderColor: ['#52c41a', '#ff4d4f', '#1890ff'],
                  borderWidth: 1
                }]
              }}
              options={{
                plugins: {
                  tooltip: {
                    callbacks: {
                      label: (ctx) => `${ctx.label}: ${ctx.raw} jours (${((ctx.raw * 100)/data.stats.totalDays).toFixed(1)}%)`
                    }
                  }
                }
              }}
            />
          </Card>
        </Col>

        <Col xs={24} md={12} lg={16}>
          <Card title="Heures supplémentaires quotidiennes" className="chart-card">
            <Bar
              data={{
                labels: data.data.hours.labels.map(d => d.split('-')[2]),
                datasets: [{
                  label: 'Heures',
                  data: data.data.hours.datasets[0].data,
                  backgroundColor: '#fa8c1680',
                  borderColor: '#fa8c16',
                  borderWidth: 1
                }]
              }}
              options={{
                scales: {
                  y: { title: { display: true, text: 'Heures' }, beginAtZero: true },
                  x: { title: { display: true, text: 'Jour du mois' }, grid: { display: false } }
                }
              }}
            />
          </Card>
        </Col>
      </Row>

      <Row className="mt-4">
        <Col span={24}>
          <Card title="Évolution mensuelle" className="monthly-evolution-card">
            <Line
              data={{
                labels: data.data.present.labels.map(d => d.split('-')[2]),
                datasets: [
                  {
                    label: 'Présents',
                    data: data.data.present.datasets[0].data,
                    borderColor: '#52c41a',
                    backgroundColor: '#52c41a20',
                    borderWidth: 3, // Ligne plus épaisse pour plus de clarté
                    pointRadius: 2, // Points plus petits
                    pointHoverRadius: 5, // Points au survol plus modérés
                    tension: 0.4
                  },
                  {
                    label: 'Absents',
                    data: data.data.absent.datasets[0].data,
                    borderColor: '#ff4d4f',
                    backgroundColor: '#ff4d4f20',
                    borderWidth: 3, // Ligne plus épaisse pour plus de clarté
                    pointRadius: 2, // Points plus petits
                    pointHoverRadius: 5, // Points au survol plus modérés
                    tension: 0.4
                  },
                  {
                    label: 'Congés',
                    data: data.data.leave.datasets[0].data,
                    borderColor: '#1890ff',
                    backgroundColor: '#1890ff20',
                    borderWidth: 3, // Ligne plus épaisse pour plus de clarté
                    pointRadius: 2, // Points plus petits
                    pointHoverRadius: 5, // Points au survol plus modérés
                    tension: 0.4
                  }
                ]
              }}
              options={{
                responsive: true,
                maintainAspectRatio: false, // Important pour permettre le redimensionnement
                interaction: {
                  intersect: false,
                  mode: 'index'
                },
                plugins: {
                  legend: {
                    display: true,
                    position: 'top',
                    labels: {
                      font: {
                        size: 14, // Police plus grande pour la légende
                        weight: 'bold'
                      },
                      padding: 20,
                      usePointStyle: true,
                      pointStyle: 'circle'
                    }
                  },
                  tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    titleFont: {
                      size: 14,
                      weight: 'bold'
                    },
                    bodyFont: {
                      size: 13
                    },
                    padding: 12
                  }
                },
                scales: {
                  y: { 
                    ticks: { 
                      stepSize: 1,
                      font: {
                        size: 12 // Police plus grande pour les axes
                      }
                    }, 
                    title: { 
                      display: true, 
                      text: 'Statut',
                      font: {
                        size: 14,
                        weight: 'bold'
                      }
                    },
                    grid: {
                      color: 'rgba(0, 0, 0, 0.1)'
                    }
                  },
                  x: { 
                    title: { 
                      display: true, 
                      text: 'Jour du mois',
                      font: {
                        size: 14,
                        weight: 'bold'
                      }
                    }, 
                    grid: { 
                      display: false 
                    },
                    ticks: {
                      font: {
                        size: 12 // Police plus grande pour les axes
                      }
                    }
                  }
                }
              }}
            />
          </Card>
        </Col>
      </Row>
    </DashboardContainer>
  );
};

export default DashboardCharts;