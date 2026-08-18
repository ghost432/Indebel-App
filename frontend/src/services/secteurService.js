import axios from 'axios'
import { API_BASE_URL } from '../config'

const API_URL = API_BASE_URL

export const secteurService = {
  getAllWithCompetences: () => axios.get(`${API_URL}/secteurs/with-competences`)
}
