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

// Add request interceptor for auth token and language
axiosInstance.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        // Add Accept-Language header based on current language
        const currentLanguage = localStorage.getItem('i18nextLng') || 'en';
        config.headers['Accept-Language'] = currentLanguage;

        return config;
    },
    (error) => Promise.reject(error)
);

// Add response interceptor for error handling
axiosInstance.interceptors.response.use(
    (response) => response,
    async (error) => {
        // Don't redirect on 401 for login requests
        if (error.response?.status === 401 && !error.config?.url?.includes('/auth/login')) {
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
    update: (id, data) => axiosInstance.put(`/${endpoint}/${id}`, data),
    delete: (id) => axiosInstance.delete(`/${endpoint}/${id}`),
    search: (query) => axiosInstance.get(`/${endpoint}`, { params: { search: query } }),
});

// Auth service
export const authAPI = {
    login: (credentials) => axiosInstance.post('/auth/login', credentials),
    register: (userData) => axiosInstance.post('/auth/register', userData),
    verifyRegistration2FA: (data) => axiosInstance.post('/auth/register/verify-2fa', data),
    verifyLogin2FA: (data) => axiosInstance.post('/auth/login/2fa', data),
    logout: () => axiosInstance.post('/auth/logout'),
    refreshToken: () => axiosInstance.post('/auth/refresh-token'),
    setup2FA: () => axiosInstance.post('/auth/2fa/enable'),
    verify2FA: (token) => axiosInstance.post('/auth/2fa/verify', { token }),
    disable2FA: (data) => axiosInstance.post('/auth/2fa/disable', data),
    getProfile: () => axiosInstance.get('/auth/me'),
    updateProfile: (data) => axiosInstance.patch('/auth/me', data),
    changePassword: (data) => axiosInstance.post('/auth/change-password', data),
    forgotPassword: (email) => {
        return axios.post(`${API_URL}/auth/forgot-password`, { email });
    },
    resetPassword: (token, password) => {
        return axios.post(`${API_URL}/auth/reset-password`, { token, password });
    },
};

// User service
export const userAPI = {
    getAll: (params) => axiosInstance.get('/users', { params }),
    getById: (id) => axiosInstance.get(`/users/${id}`),
    update: (id, data) => axiosInstance.patch(`/users/${id}`, data),
    delete: (id) => axiosInstance.delete(`/users/${id}`),
    grantPrivileges: (userId, data) => axiosInstance.post(`/users/${userId}/privileges`, data),
    revokePrivileges: (userId, data) => axiosInstance.delete(`/users/${userId}/privileges`, { data }),
    getRadiologists: (params = {}) => userAPI.getAll({ ...params, userType: 'radiologist' }),
};

// Meta service
export const metaAPI = {
    getPrivilegeModules: () => axiosInstance.get('/meta/privileges'),
};

// Audit service
export const auditAPI = {
    getAppointmentLogs: (params) => axiosInstance.get('/audit/appointments', { params }),
    getAuditStats: (params) => axiosInstance.get('/audit/stats', { params }),
};

// Dashboard service
export const dashboardAPI = {
    getAnalytics: () => axiosInstance.get('/dashboard/analytics'),
    getAppointmentStats: (period = 'week') => axiosInstance.get('/dashboard/appointment-stats', { params: { period } }),
};

// Patient service
export const patientAPI = createCrudService('patients');

// Doctor service
export const doctorAPI = createCrudService('doctors');

// Appointment service
export const appointmentAPI = {
    getAllAppointments: (params) => axiosInstance.get('/appointments', { params }),
    getAppointmentById: (id) => axiosInstance.get(`/appointments/${id}`),
    createAppointment: (appointmentData) => axiosInstance.post('/appointments', appointmentData),
    updateAppointment: (id, appointmentData) => axiosInstance.patch(`/appointments/${id}`, appointmentData),
    updateAppointmentStatus: (id, statusData) => {
        // Handle file upload for status updates
        const formData = new FormData();
        formData.append('status', statusData.status);
        if (statusData.notes) {
            formData.append('notes', statusData.notes);
        }
        if (statusData.pdfFile) {
            formData.append('pdfFile', statusData.pdfFile);
        }

        return axiosInstance.patch(`/appointments/${id}/status`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });
    },
    deleteAppointment: (id) => axiosInstance.delete(`/appointments/${id}`),
    getAppointmentHistory: (id) => axiosInstance.get(`/appointments/${id}/history`),
    getByDateRange: (startDate, endDate) =>
        axiosInstance.get('/appointments/date-range', { params: { startDate, endDate } }),
    getByDoctor: (doctorId) =>
        axiosInstance.get(`/appointments/doctor/${doctorId}`),
    getByPatient: (patientId) =>
        axiosInstance.get(`/appointments/patient/${patientId}`),
};

// Stock service
export const stockAPI = {
    getAll: (params) => axiosInstance.get('/stock', { params }),
    getById: (id) => axiosInstance.get(`/stock/${id}`),
    create: (data) => axiosInstance.post('/stock', data),
    update: (id, data) => axiosInstance.patch(`/stock/${id}`, data),
    delete: (id) => axiosInstance.delete(`/stock/${id}`),
    search: (query) => axiosInstance.get('/stock', { params: { search: query } }),
    getLowStock: (params) => axiosInstance.get('/stock', { params: { ...params, lowStock: 'true' } }),
    getExpired: (params) => axiosInstance.get('/stock', { params: { ...params, expired: 'true' } }),
    updateQuantity: (id, data) => axiosInstance.patch(`/stock/${id}/quantity`, data),
};

// Scan service
export const scanAPI = {
    ...createCrudService('scans'),
    update: (id, data) => axiosInstance.patch(`/scans/${id}`, data),
    getByDoctor: (doctorId) =>
        axiosInstance.get(`/scans/doctor/${doctorId}`),
    getByPatient: (patientId) =>
        axiosInstance.get(`/scans/patient/${patientId}`),
    addImage: (id, data) => axiosInstance.post(`/scans/${id}/images`, data),
    removeImage: (id, imageId) => axiosInstance.delete(`/scans/${id}/images/${imageId}`),
    checkStockAvailability: (id) => axiosInstance.get(`/scans/${id}/stock-availability`),
};

// Scan Category service
export const scanCategoryAPI = {
    ...createCrudService('scan-categories'),
    getStats: () => axiosInstance.get('/scan-categories/stats'),
};

// Patient History service
export const patientHistoryAPI = {
    ...createCrudService('patient-history'),
    getByPatientId: (patientId) => axiosInstance.get(`/patient-history/patient/${patientId}`),
};

// Export axios instance for custom requests
export { axiosInstance };

// Branch service
export const branchAPI = createCrudService('branches');

// Representative service
export const representativeAPI = {
    getAllRepresentatives: (params) => axiosInstance.get('/representatives', { params }),
    getRepresentativeById: (id) => axiosInstance.get(`/representatives/${id}`),
    createRepresentative: (data) => axiosInstance.post('/representatives', data),
    updateRepresentative: (id, data) => axiosInstance.put(`/representatives/${id}`, data),
    deleteRepresentative: (id) => axiosInstance.delete(`/representatives/${id}`),
    getTopRepresentatives: (params) => axiosInstance.get('/representatives/top/representatives', { params }),
    getRepresentativeStats: (id) => axiosInstance.get(`/representatives/${id}/stats`),
    recalculateCounts: (id) => axiosInstance.post(`/representatives/${id}/recalculate`),
    getRepresentativesForDropdown: () => axiosInstance.get('/representatives/dropdown/representatives'),
};