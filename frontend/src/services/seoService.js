import axios from 'axios';
import { API_BASE_URL } from '../config';

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return { Authorization: `Bearer ${token}` };
};

export const seoService = {
  getSeoSettings: () => {
    return axios.get(`${API_BASE_URL}/seo`, {
      headers: getAuthHeaders()
    });
  },

  updateSeoSettings: (data) => {
    return axios.put(`${API_BASE_URL}/seo`, data, {
      headers: getAuthHeaders()
    });
  }
};
