import React, { useState, useEffect } from 'react';
import { Table, Card, Descriptions, Button, Tag, Spin, message } from 'antd';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { getHeuresByUser } from '../../services/heuresSupplementairesService';

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
            title: 'Date',
            dataIndex: 'date',
            key: 'date',
            render: (date) => new Date(date).toLocaleDateString('fr-FR'),
            sorter: (a, b) => new Date(a.date) - new Date(b.date)
        },
        {
            title: 'Fin normale',
            dataIndex: 'fin_normale',
            key: 'fin_normale'
        },
        {
            title: 'Dernier pointage',
            dataIndex: 'dernier_pointage',
            key: 'dernier_pointage'
        },
        {
            title: 'Durée HS',
            dataIndex: 'duree',
            key: 'duree',
            render: (duree) => <Tag color="orange">{duree}</Tag>
        }
    ];

    useEffect(() => {
        const fetchData = async () => {
            try {
                console.log('Fetching data for user:', userId, 'with filters:', { mois, annee });
                const result = await getHeuresByUser(userId, {
                    mois: location.state?.filters?.mois,
                    annee: location.state?.filters?.annee
                });

                console.log('Data fetched:', result);

                if (result) {
                    setData(result);
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
    }, [userId, navigate, location.state]);

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
            <Descriptions bordered column={2} style={{ marginBottom: 24 }}>
                <Descriptions.Item label="Matricule">{data.matricule}</Descriptions.Item>
                <Descriptions.Item label="Mois/Année">
                    {data.mois && data.annee
                        ? `${data.mois}/${data.annee}`
                        : 'Non spécifié'}
                </Descriptions.Item>
                <Descriptions.Item label="Total HS">
                    <Tag color="red">{data.total_mois || '00h 00m 00s'}</Tag>
                </Descriptions.Item>
            </Descriptions>

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
