import axios from 'axios';
import { toast } from 'react-toastify';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';

// Create axios instance with default config
const axiosInstance = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add request interceptor for auth token
axiosInstance.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Add response interceptor for error handling
axiosInstance.interceptors.response.use(
    (response) => response,
    async (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('token');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

// Generic CRUD operations
const createCrudService = (endpoint) => ({
    getAll: (params) => axiosInstance.get(`/${endpoint}`, { params }),
    getById: (id) => axiosInstance.get(`/${endpoint}/${id}`),
    create: (data) => axiosInstance.post(`/${endpoint}`, data),
    update: (id, data) => axiosInstance.patch(`/${endpoint}/${id}`, data),
    delete: (id) => axiosInstance.delete(`/${endpoint}/${id}`),
    search: (query) => axiosInstance.get(`/${endpoint}/search`, { params: { query } }),
});

// Auth service
export const authAPI = {
    login: (credentials) => axiosInstance.post('/auth/login', credentials),
    register: (userData) => axiosInstance.post('/auth/register', userData),
    logout: () => axiosInstance.post('/auth/logout'),
    refreshToken: () => axiosInstance.post('/auth/refresh-token'),
    setup2FA: () => axiosInstance.post('/auth/2fa/enable'),
    verify2FA: (token) => axiosInstance.post('/auth/2fa/verify', { token }),
    disable2FA: (data) => axiosInstance.post('/auth/2fa/disable', data),
    getProfile: () => axiosInstance.get('/auth/profile'),
    updateProfile: (data) => axiosInstance.patch('/auth/profile', data),
    changePassword: (data) => axiosInstance.post('/auth/change-password', data),
    forgotPassword: (email) => {
        return axios.post(`${API_URL}/auth/forgot-password`, { email });
    },
    resetPassword: (token, password) => {
        return axios.post(`${API_URL}/auth/reset-password`, { token, password });
    },
};

// Patient service
export const patientAPI = createCrudService('patients');

// Doctor service
export const doctorAPI = createCrudService('doctors');

// Appointment service
export const appointmentAPI = {
    ...createCrudService('appointments'),
    getByDateRange: (startDate, endDate) =>
        axiosInstance.get('/appointments/date-range', { params: { startDate, endDate } }),
    getByDoctor: (doctorId) =>
        axiosInstance.get(`/appointments/doctor/${doctorId}`),
    getByPatient: (patientId) =>
        axiosInstance.get(`/appointments/patient/${patientId}`),
};

// Stock service
export const stockAPI = {
    ...createCrudService('stock'),
    getLowStock: () => axiosInstance.get('/stock/low'),
    getExpired: () => axiosInstance.get('/stock/expired'),
};

// Scan service
export const scanAPI = {
    ...createCrudService('scans'),
    getByDoctor: (doctorId) =>
        axiosInstance.get(`/scans/doctor/${doctorId}`),
    getByPatient: (patientId) =>
        axiosInstance.get(`/scans/patient/${patientId}`),
};

// Scan Category service
export const scanCategoryAPI = {
    ...createCrudService('scan-categories'),
    getStats: () => axiosInstance.get('/scan-categories/stats'),
};

// Patient History service
export const patientHistoryAPI = createCrudService('patient-history');

// Export axios instance for custom requests
export { axiosInstance }; 