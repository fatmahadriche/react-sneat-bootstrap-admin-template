import React, { useState, useEffect } from 'react';
import { 
  Table, 
  Pagination, 
  Select, 
  Row, 
  Col, 
  Card, 
  Button, 
  message,
  Tag,
  Badge,
  Tooltip,
  Popconfirm
} from 'antd';
import { 
  DownloadOutlined, 
  FilterOutlined, 
  SyncOutlined,
  EyeOutlined,
  ClockCircleOutlined,
  CalendarOutlined,
  UserOutlined,
  IdcardOutlined,
  FileExcelOutlined,
  FilePdfOutlined
} from '@ant-design/icons';
import { useAuth } from '../../context/AuthContext';
import { getHeuresSupplementaires, exportHeuresSupplementaires } from '../../services/heuresSupplementairesService';
import { useNavigate } from 'react-router-dom';
const { Option } = Select;

const HeuresSupplementairesPage = () => {
  const { user } = useAuth();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0
  });
  const [filters, setFilters] = useState({
    mois: null,
    annee: new Date().getFullYear()
  });

  const getStatusColor = (hours) => {
    if (!hours) return 'default';
    const [h] = hours.split('h').map(Number);
    if (h < 5) return 'green';
    if (h < 10) return 'orange';
    return 'red';
  };

  const columns = [
    {
      title: (
        <span>
          <IdcardOutlined style={{ marginRight: 8, color: '#1890ff' }} />
          Matricule
        </span>
      ),
      dataIndex: 'matricule',
      key: 'matricule',
      sorter: (a, b) => a.matricule.localeCompare(b.matricule),
      render: (text) => (
        <Tag icon={<IdcardOutlined />} color="blue">
          {text}
        </Tag>
      )
    },
    {
      title: (
        <span>
          <UserOutlined style={{ marginRight: 8, color: '#52c41a' }} />
          Nom Complet
        </span>
      ),
      key: 'nom_complet',
      render: (_, record) => (
        <Tooltip title={`${record.nom} ${record.prenom}`}>
          <span style={{ fontWeight: 500 }}>
            {record.nom} {record.prenom}
          </span>
        </Tooltip>
      ),
      sorter: (a, b) => `${a.nom}${a.prenom}`.localeCompare(`${b.nom}${b.prenom}`)
    },
    {
      title: (
        <span>
          <CalendarOutlined style={{ marginRight: 8, color: '#faad14' }} />
          Période
        </span>
      ),
      key: 'periode',
      render: (_, record) => (
        <Badge 
          count={`${record.mois}/${record.annee}`} 
          style={{ 
            backgroundColor: '#fff', 
            color: '#999', 
            boxShadow: '0 0 0 1px #d9d9d9 inset' 
          }} 
        />
      ),
      sorter: (a, b) => {
        const dateA = new Date(a.annee, a.mois - 1);
        const dateB = new Date(b.annee, b.mois - 1);
        return dateA - dateB;
      }
    },
    {
      title: (
        <span>
          <ClockCircleOutlined style={{ marginRight: 8, color: '#f5222d' }} />
          Total HS
        </span>
      ),
      dataIndex: 'total_mois',
      key: 'total_mois',
      render: (text) => (
        <Tag 
          color={getStatusColor(text)} 
          style={{ fontWeight: 'bold' }}
        >
          {text || '00h 00m 00s'}
        </Tag>
      )
    },
    {
      title: 'Actions',
      key: 'actions',
      // Dans la colonne Actions
render: (_, record) => (
  <Tooltip title="Voir les détails">
      <Button 
          type="link" 
          icon={<EyeOutlined style={{ color: '#13c2c2' }} />} 
          onClick={() => navigate(`/heures-supplementaires/${record._id}`, { 
              state: { 
                  filters: { 
                      mois: record.mois, 
                      annee: record.annee 
                  } 
              } 
          })}
      />
  </Tooltip>
)
    }
  ];

  const fetchData = async () => {
    setLoading(true);
    try {
      const result = await getHeuresSupplementaires({
        page: pagination.current,
        limit: pagination.pageSize,
        ...filters
      });
      
      setData(result.data);
      setPagination({
        ...pagination,
        total: result.pagination.total
      });
    } catch (error) {
      message.error('Erreur lors du chargement des données');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExportExcel = async () => {
    try {
      const blob = await exportHeuresSupplementaires({
        ...filters,
        format: 'excel'
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `heures_supplementaires_${new Date().toISOString()}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      message.success('Export Excel réussi');
    } catch (error) {
      message.error('Erreur lors de l\'export Excel');
      console.error('Export error:', error);
    }
  };

  const handleExportPDF = async () => {
    try {
      const blob = await exportHeuresSupplementaires({
        ...filters,
        format: 'pdf'
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `heures_supplementaires_${new Date().toISOString()}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      message.success('Export PDF réussi');
    } catch (error) {
      message.error('Erreur lors de l\'export PDF');
      console.error('Export error:', error);
    }
  };

  useEffect(() => {
    fetchData();
  }, [pagination.current, filters]);

  const handleTableChange = (pagination) => {
    setPagination(pagination);
  };

  const handleFilterChange = (name, value) => {
    setFilters({
      ...filters,
      [name]: value
    });
    setPagination({
      ...pagination,
      current: 1
    });
  };

  const resetFilters = () => {
    setFilters({
      mois: null,
      annee: new Date().getFullYear()
    });
    setPagination({
      ...pagination,
      current: 1
    });
  };

  return (
    <Card 
      title={
        <span style={{ display: 'flex', alignItems: 'center' }}>
          <ClockCircleOutlined style={{ fontSize: 24, color: '#fa8c16', marginRight: 16 }} />
          <span style={{ fontSize: 20, fontWeight: 500 }}>Gestion des Heures Supplémentaires</span>
        </span>
      }
      extra={
        <div style={{ display: 'flex', gap: 8 }}>
          <Tooltip title="Exporter en Excel">
            <Button 
              icon={<FileExcelOutlined style={{ color: '#52c41a' }} />} 
              onClick={handleExportExcel}
              disabled={loading}
            />
          </Tooltip>
          <Tooltip title="Exporter en PDF">
            <Button 
              icon={<FilePdfOutlined style={{ color: '#f5222d' }} />} 
              onClick={handleExportPDF}
              disabled={loading}
            />
          </Tooltip>
          <Tooltip title="Actualiser">
            <Button 
              icon={<SyncOutlined />} 
              onClick={fetchData}
              disabled={loading}
            />
          </Tooltip>
        </div>
      }
      styles={{
        header: { borderBottom: '1px solid #f0f0f0' },
        body: { padding: '24px 0' }
      }}
    >
      <Row gutter={[16, 16]} style={{ marginBottom: 24, padding: '0 24px' }}>
        <Col span={8}>
          <Card 
            size="small" 
            title={
              <span>
                <FilterOutlined style={{ marginRight: 8 }} />
                Filtres
              </span>
            }
          >
            <div style={{ display: 'flex', gap: 8 }}>
              <Select
                style={{ flex: 1 }}
                placeholder="Mois"
                allowClear
                value={filters.mois}
                onChange={(value) => handleFilterChange('mois', value)}
                suffixIcon={<CalendarOutlined />}
              >
                {Array.from({ length: 12 }, (_, i) => (
                  <Option key={i+1} value={i+1}>
                    {new Date(0, i).toLocaleString('default', { month: 'long' })}
                  </Option>
                ))}
              </Select>
              
              <Select
                style={{ flex: 1 }}
                placeholder="Année"
                value={filters.annee}
                onChange={(value) => handleFilterChange('annee', value)}
                suffixIcon={<CalendarOutlined />}
              >
                {Array.from({ length: 5 }, (_, i) => {
                  const year = new Date().getFullYear() - i;
                  return (
                    <Option key={year} value={year}>
                      {year}
                    </Option>
                  );
                })}
              </Select>
              
              <Popconfirm
                title="Réinitialiser les filtres?"
                onConfirm={resetFilters}
                okText="Oui"
                cancelText="Non"
                disabled={!filters.mois && filters.annee === new Date().getFullYear()}
              >
                <Button 
                  icon={<SyncOutlined />} 
                  disabled={!filters.mois && filters.annee === new Date().getFullYear()}
                />
              </Popconfirm>
            </div>
          </Card>
        </Col>
        
        <Col span={16}>
          <Card 
            size="small" 
            title="Statistiques"
            styles={{
              body: { padding: '12px 24px' }
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-around' }}>
              <StatCard 
                title="Total Agents" 
                value={pagination.total} 
                icon={<UserOutlined />} 
                color="#1890ff"
              />
              <StatCard 
                title="Mois Actuel" 
                value={filters.mois || 'Tous'} 
                icon={<CalendarOutlined />} 
                color="#52c41a"
              />
              <StatCard 
                title="Année" 
                value={filters.annee} 
                icon={<CalendarOutlined />} 
                color="#faad14"
              />
            </div>
          </Card>
        </Col>
      </Row>

      <Table
        columns={columns}
        rowKey={(record) => record._id}
        dataSource={data}
        pagination={{
          ...pagination,
          showSizeChanger: true,
          pageSizeOptions: ['10', '20', '50', '100'],
          showTotal: (total, range) => (
            <span style={{ color: '#666', fontWeight: 'normal' }}>
              Affichage {range[0]}-{range[1]} sur {total} agents
            </span>
          )
        }}
        loading={loading}
        onChange={handleTableChange}
        scroll={{ x: true }}
        bordered
        style={{ padding: '0 24px' }}
      />
    </Card>
  );
};

const StatCard = ({ title, value, icon, color }) => (
  <div style={{ textAlign: 'center' }}>
    <div style={{ 
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: 40,
      height: 40,
      borderRadius: '50%',
      backgroundColor: `${color}20`,
      marginBottom: 8
    }}>
      {React.cloneElement(icon, { 
        style: { 
          fontSize: 18,
          color 
        } 
      })}
    </div>
    <div style={{ fontSize: 12, color: '#666' }}>{title}</div>
    <div style={{ 
      fontSize: 18, 
      fontWeight: 500,
      color 
    }}>
      {value}
    </div>
  </div>
);

export default HeuresSupplementairesPage;