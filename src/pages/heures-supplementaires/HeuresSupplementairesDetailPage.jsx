import React, { useState, useEffect } from 'react';
import { Table, Card, Descriptions, Button, Tag, Spin, message } from 'antd';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { getHeuresByUser } from '../../services/heuresSupplementairesService';
import { CalendarOutlined, ClockCircleOutlined, FieldTimeOutlined, HourglassOutlined } from '@ant-design/icons';

const HeuresSupplementairesDetailPage = () => {
    const { userId } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    // Récupérer les filtres depuis l'état de navigation
    const { mois, annee } = location.state?.filters || {};

    const columns = [
        {
            title: (
                <span>
                    <CalendarOutlined style={{ color: '#1890ff', marginRight: 8 }} />
                    Date
                </span>
            ),
            dataIndex: 'date',
            key: 'date',
            render: (date) => new Date(date).toLocaleDateString('fr-FR'),
            sorter: (a, b) => new Date(a.date) - new Date(b.date)
        },
        {
            title: (
                <span>
                    <FieldTimeOutlined style={{ color: '#52c41a', marginRight: 8 }} />
                    Fin normale
                </span>
            ),
            dataIndex: 'fin_normale',
            key: 'fin_normale'
        },
        {
            title: (
                <span>
                    <ClockCircleOutlined style={{ color: '#faad14', marginRight: 8 }} />
                    Dernier pointage
                </span>
            ),
            dataIndex: 'dernier_pointage',
            key: 'dernier_pointage'
        },
        {
            title: (
                <span>
                    <HourglassOutlined style={{ color: '#f5222d', marginRight: 8 }} />
                    Durée HS
                </span>
            ),
            dataIndex: 'duree',
            key: 'duree',
            render: (duree) => <Tag color="orange">{duree}</Tag>
        }
    ];

    useEffect(() => {
        const fetchData = async () => {
            try {
                console.log('Fetching data for user:', userId, 'with filters:', { mois, annee });
                const result = await getHeuresByUser(userId, { mois, annee });

                console.log('Data fetched:', result);

                if (result && result.length > 0) {
                    setData(result[0]); // Prendre le premier document du tableau
                } else {
                    message.warning('Aucune donnée disponible pour cette période');
                    navigate('/heures-supplementaires');
                }
            } catch (error) {
                console.error('Error fetching data:', error);
                message.error('Erreur lors du chargement des détails');
                navigate('/heures-supplementaires');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [userId, mois, annee, navigate, location.state]);

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '50px' }}>
                <Spin size="large" />
            </div>
        );
    }

    if (!data) {
        return <div>Aucune donnée disponible</div>;
    }

    console.log('Data to render:', data);

    return (
        <Card
            title={`Détails des heures supplémentaires - ${data.nom} ${data.prenom}`}
            extra={
                <Button type="primary" onClick={() => navigate(-1)}>
                    Retour
                </Button>
            }
        >
            <Table
                columns={columns}
                dataSource={data.details || []}
                rowKey={(record) => record._id || record.date}
                loading={loading}
                pagination={false}
                bordered
                locale={{ emptyText: 'Aucune heure supplémentaire enregistrée' }}
            />
        </Card>
    );
};

export default HeuresSupplementairesDetailPage;
