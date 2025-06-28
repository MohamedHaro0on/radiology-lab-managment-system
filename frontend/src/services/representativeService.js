import { axiosInstance } from './api';

export const representativeService = {
    // Get all representatives with pagination and filtering
    getAllRepresentatives: async (params = {}) => {
        const response = await axiosInstance.get('/representatives', { params });
        return response.data;
    },

    // Get representative by ID
    getRepresentativeById: async (id) => {
        const response = await axiosInstance.get(`/representatives/${id}`);
        return response.data;
    },

    // Create new representative
    createRepresentative: async (data) => {
        const response = await axiosInstance.post('/representatives', data);
        return response.data;
    },

    // Update representative
    updateRepresentative: async (id, data) => {
        const response = await axiosInstance.put(`/representatives/${id}`, data);
        return response.data;
    },

    // Delete representative
    deleteRepresentative: async (id) => {
        const response = await axiosInstance.delete(`/representatives/${id}`);
        return response.data;
    },

    // Get top representatives
    getTopRepresentatives: async (limit = 10) => {
        const response = await axiosInstance.get('/representatives/top/representatives', {
            params: { limit }
        });
        return response.data;
    },

    // Get representative statistics
    getRepresentativeStats: async (id) => {
        const response = await axiosInstance.get(`/representatives/${id}/stats`);
        return response.data;
    },

    // Recalculate representative counts
    recalculateCounts: async (id) => {
        const response = await axiosInstance.post(`/representatives/${id}/recalculate`);
        return response.data;
    },

    // Get representatives for dropdown (active only)
    getRepresentativesForDropdown: async () => {
        const response = await axiosInstance.get('/representatives/dropdown/representatives');
        return response.data;
    }
}; 