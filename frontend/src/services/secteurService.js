import axiosInstance from './axiosConfig'

const API_URL = ''

export const secteurService = {
  getAllWithCompetences: () => axiosInstance.get('/secteurs/with-competences')
}
