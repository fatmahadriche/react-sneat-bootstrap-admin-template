// heuresSupplementairesService.js
import api from '../api/api';

export const getHeuresSupplementaires = async (params = {}) => {
  const { page = 1, limit = 10, mois, annee } = params;
  const response = await api.get('/api/heures-supp/', {
    params: { page, limit, mois, annee }
  });
  return response.data;
};

// heuresSupplementairesService.js
// heuresSupplementairesService.js
export const getHeuresByUser = async (userId, params = {}) => {
    const response = await api.get(`/api/heures-supp/user/${userId}`, {
        params: { 
            mois: params.mois,
            annee: params.annee 
        }
    });
    return response.data;
};

export const exportHeuresSupplementaires = async (params = {}) => {
  const response = await api.get('/heures-supplementaires/export', {
    params,
    responseType: 'blob'
  });
  return response.data;
};