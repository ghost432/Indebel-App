import axios from 'axios';
import { API_BASE_URL } from '../config';

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return { Authorization: `Bearer ${token}` };
};

export const adminStatsService = {
  getExtraStats: () => {
    return axios.get(`${API_BASE_URL}/admin-stats/extra`, {
      headers: getAuthHeaders()
    });
  }
};
