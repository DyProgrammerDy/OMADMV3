import axios from 'axios';

const apiClient = axios.create({
  baseURL: 'http://localhost:3001/api', // URL base da sua API backend
  headers: {
    'Content-Type': 'application/json',
  },
});

export default apiClient;
