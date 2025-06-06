import React, { useState, useEffect } from 'react';
import { Line, Pie, Bar } from 'react-chartjs-2';
import { Card, Row, Col, Select, Spin, Statistic, Alert, Typography, Input, Button } from 'antd';
import { 
  CheckCircleOutlined, 
  CloseCircleOutlined, 
  ClockCircleOutlined,
  CalendarOutlined,
  UserOutlined,
  ClearOutlined,
  SearchOutlined
} from '@ant-design/icons';
import styled from 'styled-components';
import { useAuth } from '../context/AuthContext';
import api from '../api/api';

const { Option } = Select;
const { Text } = Typography;

// Styles optimisés
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

  .agent-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
    padding: 12px 16px;
    background: #f9fafb;
    border-radius: 8px;
    border-left: 4px solid #1890ff;
  }

  .agent-info {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 18px;
    font-weight: 500;
    color: #2c3e50;
    
    .anticon {
      color: #1890ff;
      font-size: 20px;
    }
  }

  .period-selector {
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;
    padding: 12px 0;
    
    @media (max-width: 768px) {
      flex-direction: column;
      align-items: flex-start;
      gap: 12px;
    }
  }

  .filter-controls {
    display: flex;
    align-items: center;
    gap: 12px;
    
    .clear-filter-btn {
      display: flex;
      align-items: center;
      gap: 6px;
      color: #1890ff;
      cursor: pointer;
      font-size: 13px;
      font-weight: 500;
      padding: 4px 8px;
      border-radius: 4px;
      transition: all 0.2s ease;
      background: rgba(24, 144, 255, 0.05);
      border: 1px solid rgba(24, 144, 255, 0.2);
      
      &:hover {
        background: rgba(24, 144, 255, 0.1);
        border-color: rgba(24, 144, 255, 0.3);
        color: #0050b3;
      }
    }

    .ant-select {
      width: 100px;
    }
  }

  .stats-row {
    margin: 16px 0;
    
    .ant-card {
      height: 100%;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.05);
      transition: all 0.3s ease;
      
      &:hover {
        box-shadow: 0 4px 12px rgba(0,0,0,0.08);
      }
      
      .ant-card-body {
        padding: 16px;
      }
    }
  }

  .chart-card {
    margin-bottom: 20px;
    border-radius: 8px;
    overflow: hidden;
    box-shadow: 0 2px 8px rgba(0,0,0,0.05);
    
    .ant-card-head {
      background: #f9fafb;
      border-bottom: 1px solid #e8e8e8;
    }
    
    .ant-card-body {
      height: calc(100% - 56px);
      display: flex;
      flex-direction: column;
      padding: 0;
      
      > div {
        flex: 1;
        padding: 16px;
      }
    }
  }

  .search-bar {
    display: flex;
    gap: 8px;
    margin-bottom: 16px;
    
    .ant-input {
      flex: 1;
    }
  }

  @media (min-width: 992px) {
    .chart-card {
      height: 380px;
    }

    .monthly-evolution-card {
      height: 450px;
    }
  }
`;

const DashboardCharts = ({ matricule }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [data, setData] = useState(null);
  const [agentInfo, setAgentInfo] = useState(null);
  const [period, setPeriod] = useState(() => {
    const d = new Date();
    return {
      day: d.getDate(),
      month: d.getMonth() + 1,
      year: d.getFullYear()
    };
  });

  const [searchValue, setSearchValue] = useState('');
  const [searchedAgent, setSearchedAgent] = useState(null);
  const [searchError, setSearchError] = useState('');

  const effectiveMatricule = searchedAgent?.matricule || matricule || user?.matricule;

  // Generate options for days, months, and years
  const days = Array.from({ length: 31 }, (_, i) => i + 1);
  const months = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
  ];
  const years = Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - 5 + i);

  const handleAgentSearch = async () => {
    setSearchError('');
    setLoading(true);
    try {
      const response = await api.get(`/api/charts/search/agents?q=${encodeURIComponent(searchValue)}&year=${period.year}&month=${period.month}&day=${period.day}`);
      if (response.data.results && response.data.results.length > 0) {
        const agent = response.data.results[0];
        if (agent.error) {
          setSearchError(agent.error);
          setSearchedAgent(null);
        } else {
          setSearchedAgent({
            matricule: agent.matricule,
            nom: agent.nom,
            prenom: agent.prenom
          });
          await fetchData(period.day, period.month, period.year, agent.matricule);
          setAgentInfo({ nom: agent.nom, prenom: agent.prenom, matricule: agent.matricule });
        }
      } else {
        setSearchError('Aucun agent trouvé');
        setSearchedAgent(null);
      }
    } catch (err) {
      setSearchError(err.response?.data?.error || err.message || 'Erreur de recherche');
      setSearchedAgent(null);
    } finally {
      setLoading(false);
    }
  };

  const handleBackToOwnDashboard = () => {
    setSearchedAgent(null);
    setAgentInfo(null);
    setSearchError('');
    setSearchValue('');
    fetchData(period.day, period.month, period.year, user?.matricule);
  };

  const fetchData = async (day, month, year, customMatricule) => {
    try {
      setLoading(true);
      setError('');
      const mat = customMatricule || effectiveMatricule;
      if (!mat) throw new Error('Matricule non disponible');
      const response = await api.get(`/api/charts/${mat}/charts?day=${day}&month=${month}&year=${year}`);
      setData(response.data);
      if (response.data.agentInfo) {
        setAgentInfo(response.data.agentInfo);
      }
    } catch (err) {
      console.error('Error:', err);
      setError(err.response?.data?.error || err.message || 'Erreur de chargement');
    } finally {
      setLoading(false);
    }
  };

  const fetchAgentInfo = async () => {
    try {
      if (!effectiveMatricule) return;
      
      const response = await api.get(`/api/charts/${effectiveMatricule}`);
      setAgentInfo(response.data);
    } catch (err) {
      console.error('Error fetching agent info:', err);
      if (user && user.matricule === effectiveMatricule) {
        setAgentInfo({
          nom: user.nom,
          prenom: user.prenom,
          matricule: user.matricule
        });
      }
    }
  };

  useEffect(() => {
    if (effectiveMatricule) {
      fetchAgentInfo();
      fetchData(period.day, period.month, period.year);
    }
  }, [period, effectiveMatricule]);

  const handlePeriodChange = (field, value) => {
    setPeriod(prev => ({ ...prev, [field]: value }));
  };

  const resetToCurrentDate = () => {
    const d = new Date();
    setPeriod({
      day: d.getDate(),
      month: d.getMonth() + 1,
      year: d.getFullYear()
    });
  };

  if (loading) return <Spin size="large" className="center-spinner" />;
  if (error) return <Alert message={error} type="error" showIcon />;
  if (!data) return <Alert message="Aucune donnée disponible" type="info" showIcon />;

  return (
    <DashboardContainer>
      {(user?.role === 'ADMIN' || user?.role === 'GESTIONNAIRE') && (
        <div className="search-bar">
          <Input
            placeholder="Matricule, nom ou prénom"
            value={searchValue}
            onChange={e => setSearchValue(e.target.value)}
            onPressEnter={handleAgentSearch}
            prefix={<SearchOutlined />}
          />
          <Button type="primary" onClick={handleAgentSearch} icon={<SearchOutlined />}>
            Rechercher
          </Button>
          {searchedAgent && (
            <Button onClick={handleBackToOwnDashboard}>
              Retour à mon dashboard
            </Button>
          )}
        </div>
      )}
      {searchError && <Alert message={searchError} type="error" showIcon style={{ marginBottom: 16 }} />}

      <div className="agent-header">
        <div className="agent-info">
          <UserOutlined />
          <Text strong>
            {agentInfo ? 
              `${agentInfo.prenom} ${agentInfo.nom} (${agentInfo.matricule || effectiveMatricule})`
              : 
              `Agent ${effectiveMatricule}`
            }
          </Text>
        </div>
        <div className="filter-controls">
          <div className="clear-filter-btn" onClick={resetToCurrentDate}>
            <ClearOutlined />
            <span>Aujourd'hui</span>
          </div>
        </div>
      </div>

      <Card>
        <div className="period-selector">
          <Text strong>Sélection de la période :</Text>
          <div className="filter-controls">
            <Select
              value={period.day}
              onChange={value => handlePeriodChange('day', value)}
              suffixIcon={<CalendarOutlined />}
            >
              {days.map(day => (
                <Option key={day} value={day}>{day}</Option>
              ))}
            </Select>
            <Select
              value={period.month}
              onChange={value => handlePeriodChange('month', value)}
            >
              {months.map((month, index) => (
                <Option key={index + 1} value={index + 1}>{month}</Option>
              ))}
            </Select>
            <Select
              value={period.year}
              onChange={value => handlePeriodChange('year', value)}
            >
              {years.map(year => (
                <Option key={year} value={year}>{year}</Option>
              ))}
            </Select>
          </div>
        </div>
      </Card>

      <Row gutter={[16, 16]} className="stats-row">
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
                prefix={React.cloneElement(stat.icon, { style: { color: stat.color, fontSize: 24 } })}
                valueStyle={{ color: stat.color, fontSize: 22 }}
              />
            </Card>
          </Col>
        ))}
      </Row>

      <Row gutter={[16, 16]}>
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
                  legend: { position: 'bottom' },
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
                  y: { 
                    title: { display: true, text: 'Heures' }, 
                    beginAtZero: true 
                  },
                  x: { 
                    title: { display: true, text: 'Jour du mois' }, 
                    grid: { display: false } 
                  }
                }
              }}
            />
          </Card>
        </Col>
      </Row>

      <Row>
        <Col span={24}>
          <Card title="Évolution mensuelle" className="chart-card monthly-evolution-card">
            <Line
              data={{
                labels: data.data.present.labels.map(d => d.split('-')[2]),
                datasets: [
                  {
                    label: 'Présents',
                    data: data.data.present.datasets[0].data,
                    borderColor: '#52c41a',
                    backgroundColor: '#52c41a20',
                    borderWidth: 3,
                    pointRadius: 2,
                    pointHoverRadius: 5,
                    tension: 0.4
                  },
                  {
                    label: 'Absents',
                    data: data.data.absent.datasets[0].data,
                    borderColor: '#ff4d4f',
                    backgroundColor: '#ff4d4f20',
                    borderWidth: 3,
                    pointRadius: 2,
                    pointHoverRadius: 5,
                    tension: 0.4
                  },
                  {
                    label: 'Congés',
                    data: data.data.leave.datasets[0].data,
                    borderColor: '#1890ff',
                    backgroundColor: '#1890ff20',
                    borderWidth: 3,
                    pointRadius: 2,
                    pointHoverRadius: 5,
                    tension: 0.4
                  }
                ]
              }}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    display: true,
                    position: 'top',
                    labels: {
                      font: { size: 14, weight: 'bold' },
                      padding: 20,
                      usePointStyle: true
                    }
                  }
                },
                scales: {
                  y: { 
                    title: { display: true, text: 'Jours', font: { size: 14, weight: 'bold' } },
                    grid: { color: 'rgba(0, 0, 0, 0.05)' }
                  },
                  x: { 
                    title: { display: true, text: 'Jour du mois', font: { size: 14, weight: 'bold' } }, 
                    grid: { display: false } 
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