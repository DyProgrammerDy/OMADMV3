import api from './api';

export const moduleService = {
    async getModules() {
        try {
            const response = await api.get('/modules/available');
            return response.data;
        } catch (error) {
            console.error('Error fetching modules:', error);
            throw new Error('Failed to load modules. Please check backend connection.');
        }
    }
};