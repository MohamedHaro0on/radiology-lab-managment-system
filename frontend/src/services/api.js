import axios from 'axios';
import { toast } from 'react-toastify';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';

/**
 * API Service class for handling all API requests
 */
class ApiService {
    constructor() {
        this.api = axios.create({
            baseURL: API_URL,
            headers: {
                'Content-Type': 'application/json',
            },
            withCredentials: true,
        });

        this.setupInterceptors();
    }

    setupInterceptors() {
        this.api.interceptors.request.use(
            (config) => {
                const token = localStorage.getItem('token');
                if (token) {
                    config.headers.Authorization = `Bearer ${token}`;
                }
                return config;
            },
            (error) => {
                return Promise.reject(error);
            }
        );

        this.api.interceptors.response.use(
            (response) => response,
            (error) => {
                if (error.response) {
                    const { status } = error.response;

                    // Handle 403 Forbidden (token expired or invalid)
                    if (status === 403) {
                        // Only handle session expiration if we're not already on the login page
                        if (!window.location.pathname.includes('/login')) {
                            // Clear local storage
                            localStorage.removeItem('token');
                            localStorage.removeItem('user');

                            // Show error message
                            toast.error('Your session has expired. Please login again.');

                            // Create a custom error for session expiration
                            const sessionError = new Error('Session expired');
                            sessionError.isSessionExpired = true;

                            // Redirect to login page after a short delay
                            setTimeout(() => {
                                window.location.href = '/login';
                            }, 2000);

                            return Promise.reject(sessionError);
                        }
                    }

                    // Handle other error statuses
                    const message = error.response?.data?.message || 'An error occurred';
                    toast.error(message);
                } else if (error.request) {
                    // Network error
                    toast.error('Network error. Please check your connection.');
                } else {
                    // Other errors
                    toast.error('An unexpected error occurred.');
                }

                return Promise.reject(error);
            }
        );
    }

    /**
     * Make an API request
     * @param {import('axios').AxiosRequestConfig} config - Request configuration
     * @returns {Promise<any>} Response data
     */
    async request(config) {
        try {
            const response = await this.api.request(config);
            return response.data;
        } catch (error) {
            // If it's a session expiration error, let the interceptor handle it
            if (error.response?.status === 403) {
                throw error;
            }
            return this.handleError(error);
        }
    }

    /**
     * Handle API errors
     * @param {any} error - Error object
     * @throws {Object} API error object
     */
    handleError(error) {
        // If it's already an API error object, just rethrow it
        if (error.isApiError) {
            throw error;
        }

        // Extract error message from various possible sources
        let errorMessage = 'An error occurred';
        if (error.response?.data?.message) {
            errorMessage = error.response.data.message;
        } else if (error.message && typeof error.message === 'string') {
            errorMessage = error.message;
        } else if (error.response?.data && typeof error.response.data === 'string') {
            errorMessage = error.response.data;
        } else if (error.response?.data && typeof error.response.data === 'object') {
            // Handle case where response data is an object
            errorMessage = error.response.data.error || error.response.data.message || 'An error occurred';
        } else if (error.response?.status) {
            errorMessage = `Server error (${error.response.status})`;
        }

        // Create a structured error object
        const apiError = {
            isApiError: true,
            message: errorMessage,
            code: error.response?.data?.code || 'UNKNOWN_ERROR',
            status: error.response?.status,
            details: error.response?.data?.details || error.response?.data,
            originalError: error
        };

        // Log the error for debugging
        console.error('API Error:', {
            message: apiError.message,
            code: apiError.code,
            status: apiError.status,
            details: apiError.details
        });

        // Don't show toast here, let the component handle it
        throw apiError;
    }

    // Auth endpoints
    /**
     * Login user
     * @param {{email: string, password: string}} credentials - Login credentials
     * @returns {Promise<{token: string}>} Authentication token
     */
    async login(credentials) {
        return this.request({
            method: 'POST',
            url: '/auth/login',
            data: credentials,
        });
    }

    /**
     * Logout user
     * @returns {Promise<void>}
     */
    async logout() {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
    }

    /**
     * Get user profile
     * @returns {Promise<Object>} User profile
     */
    async getProfile() {
        return this.request({
            method: 'GET',
            url: '/auth/me',
        });
    }

    /**
     * Update user profile
     * @param {Object} data - Profile update data
     * @returns {Promise<Object>} Updated user profile
     */
    async updateProfile(data) {
        return this.request({
            method: 'PUT',
            url: '/auth/me',
            data,
        });
    }

    /**
     * Change user password
     * @param {Object} data - Password change data
     * @returns {Promise<void>}
     */
    async changePassword(data) {
        return this.request({
            method: 'PUT',
            url: '/auth/change-password',
            data,
        });
    }

    // Patients endpoints
    /**
     * Get patients list
     * @param {Object} [params] - Pagination parameters
     * @returns {Promise<Object>} Paginated patients list
     */
    async getPatients(params) {
        return this.request({
            method: 'GET',
            url: '/patients',
            params,
        });
    }

    /**
     * Get patient by ID
     * @param {string} id - Patient ID
     * @returns {Promise<Object>} Patient data
     */
    async getPatient(id) {
        return this.request({
            method: 'GET',
            url: `/patients/${id}`,
        });
    }

    /**
     * Create new patient
     * @param {Object} data - Patient data
     * @returns {Promise<Object>} Created patient
     */
    async createPatient(data) {
        return this.request({
            method: 'POST',
            url: '/patients',
            data,
        });
    }

    /**
     * Update patient
     * @param {string} id - Patient ID
     * @param {Object} data - Update data
     * @returns {Promise<Object>} Updated patient
     */
    async updatePatient(id, data) {
        return this.request({
            method: 'PUT',
            url: `/patients/${id}`,
            data,
        });
    }

    /**
     * Delete patient
     * @param {string} id - Patient ID
     * @returns {Promise<void>}
     */
    async deletePatient(id) {
        return this.request({
            method: 'DELETE',
            url: `/patients/${id}`,
        });
    }

    // Doctors endpoints
    /**
     * Get doctors list
     * @param {Object} [params] - Pagination parameters
     * @returns {Promise<Object>} Paginated doctors list
     */
    async getDoctors(params) {
        return this.request({
            method: 'GET',
            url: '/doctors',
            params,
        });
    }

    /**
     * Get doctor by ID
     * @param {string} id - Doctor ID
     * @returns {Promise<Object>} Doctor data
     */
    async getDoctor(id) {
        return this.request({
            method: 'GET',
            url: `/doctors/${id}`,
        });
    }

    /**
     * Create new doctor
     * @param {Object} data - Doctor data
     * @returns {Promise<Object>} Created doctor
     */
    async createDoctor(data) {
        return this.request({
            method: 'POST',
            url: '/doctors',
            data,
        });
    }

    /**
     * Update doctor
     * @param {string} id - Doctor ID
     * @param {Object} data - Update data
     * @returns {Promise<Object>} Updated doctor
     */
    async updateDoctor(id, data) {
        return this.request({
            method: 'PUT',
            url: `/doctors/${id}`,
            data,
        });
    }

    /**
     * Delete doctor
     * @param {string} id - Doctor ID
     * @returns {Promise<void>}
     */
    async deleteDoctor(id) {
        return this.request({
            method: 'DELETE',
            url: `/doctors/${id}`,
        });
    }

    // Appointments endpoints
    /**
     * Get appointments list
     * @param {Object} [params] - Pagination parameters
     * @returns {Promise<Object>} Paginated appointments list
     */
    async getAppointments(params) {
        return this.request({
            method: 'GET',
            url: '/appointments',
            params,
        });
    }

    /**
     * Get appointment by ID
     * @param {string} id - Appointment ID
     * @returns {Promise<Object>} Appointment data
     */
    async getAppointment(id) {
        return this.request({
            method: 'GET',
            url: `/appointments/${id}`,
        });
    }

    /**
     * Create new appointment
     * @param {Object} data - Appointment data
     * @returns {Promise<Object>} Created appointment
     */
    async createAppointment(data) {
        return this.request({
            method: 'POST',
            url: '/appointments',
            data,
        });
    }

    /**
     * Update appointment
     * @param {string} id - Appointment ID
     * @param {Object} data - Update data
     * @returns {Promise<Object>} Updated appointment
     */
    async updateAppointment(id, data) {
        return this.request({
            method: 'PUT',
            url: `/appointments/${id}`,
            data,
        });
    }

    /**
     * Delete appointment
     * @param {string} id - Appointment ID
     * @returns {Promise<void>}
     */
    async deleteAppointment(id) {
        return this.request({
            method: 'DELETE',
            url: `/appointments/${id}`,
        });
    }

    // Reports endpoints
    /**
     * Get reports list
     * @param {Object} [params] - Pagination parameters
     * @returns {Promise<Object>} Paginated reports list
     */
    async getReports(params) {
        return this.request({
            method: 'GET',
            url: '/reports',
            params,
        });
    }

    /**
     * Get report by ID
     * @param {string} id - Report ID
     * @returns {Promise<Object>} Report data
     */
    async getReport(id) {
        return this.request({
            method: 'GET',
            url: `/reports/${id}`,
        });
    }

    /**
     * Create new report
     * @param {Object} data - Report data
     * @returns {Promise<Object>} Created report
     */
    async createReport(data) {
        return this.request({
            method: 'POST',
            url: '/reports',
            data,
        });
    }

    /**
     * Update report
     * @param {string} id - Report ID
     * @param {Object} data - Update data
     * @returns {Promise<Object>} Updated report
     */
    async updateReport(id, data) {
        return this.request({
            method: 'PUT',
            url: `/reports/${id}`,
            data,
        });
    }

    /**
     * Delete report
     * @param {string} id - Report ID
     * @returns {Promise<void>}
     */
    async deleteReport(id) {
        return this.request({
            method: 'DELETE',
            url: `/reports/${id}`,
        });
    }

    /**
     * Upload report attachment
     * @param {string} id - Report ID
     * @param {File} file - File to upload
     * @returns {Promise<string>} Attachment URL
     */
    async uploadAttachment(id, file) {
        const formData = new FormData();
        formData.append('file', file);

        return this.request({
            method: 'POST',
            url: `/reports/${id}/attachment`,
            data: formData,
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
    }

    // Stock endpoints
    /**
     * Get stock items list
     * @param {Object} [params] - Pagination parameters
     * @returns {Promise<Object>} Paginated stock items list
     */
    async getStockItems(params) {
        return this.request({
            method: 'GET',
            url: '/stock',
            params,
        });
    }

    /**
     * Get stock item by ID
     * @param {string} id - Stock item ID
     * @returns {Promise<Object>} Stock item data
     */
    async getStockItem(id) {
        return this.request({
            method: 'GET',
            url: `/stock/${id}`,
        });
    }

    /**
     * Create new stock item
     * @param {Object} data - Stock item data
     * @returns {Promise<Object>} Created stock item
     */
    async createStockItem(data) {
        return this.request({
            method: 'POST',
            url: '/stock',
            data,
        });
    }

    /**
     * Update stock item
     * @param {string} id - Stock item ID
     * @param {Object} data - Update data
     * @returns {Promise<Object>} Updated stock item
     */
    async updateStockItem(id, data) {
        return this.request({
            method: 'PUT',
            url: `/stock/${id}`,
            data,
        });
    }

    /**
     * Delete stock item
     * @param {string} id - Stock item ID
     * @returns {Promise<void>}
     */
    async deleteStockItem(id) {
        return this.request({
            method: 'DELETE',
            url: `/stock/${id}`,
        });
    }

    /**
     * Get low stock items
     * @returns {Promise<Array>} Low stock items list
     */
    async getLowStock() {
        return this.request({
            method: 'GET',
            url: '/stock/low',
        });
    }

    // Payments endpoints
    /**
     * Get payments list
     * @param {Object} [params] - Pagination parameters
     * @returns {Promise<Object>} Paginated payments list
     */
    async getPayments(params) {
        return this.request({
            method: 'GET',
            url: '/payments',
            params,
        });
    }

    /**
     * Get payment by ID
     * @param {string} id - Payment ID
     * @returns {Promise<Object>} Payment data
     */
    async getPayment(id) {
        return this.request({
            method: 'GET',
            url: `/payments/${id}`,
        });
    }

    /**
     * Create new payment
     * @param {Object} data - Payment data
     * @returns {Promise<Object>} Created payment
     */
    async createPayment(data) {
        return this.request({
            method: 'POST',
            url: '/payments',
            data,
        });
    }

    /**
     * Update payment
     * @param {string} id - Payment ID
     * @param {Object} data - Update data
     * @returns {Promise<Object>} Updated payment
     */
    async updatePayment(id, data) {
        return this.request({
            method: 'PUT',
            url: `/payments/${id}`,
            data,
        });
    }

    /**
     * Delete payment
     * @param {string} id - Payment ID
     * @returns {Promise<void>}
     */
    async deletePayment(id) {
        return this.request({
            method: 'DELETE',
            url: `/payments/${id}`,
        });
    }

    // Settings endpoints
    /**
     * Get settings
     * @returns {Promise<Array>} Settings list
     */
    async getSettings() {
        return this.request({
            method: 'GET',
            url: '/settings',
        });
    }

    /**
     * Update setting
     * @param {string} key - Setting key
     * @param {any} value - Setting value
     * @returns {Promise<Object>} Updated setting
     */
    async updateSetting(key, value) {
        return this.request({
            method: 'PUT',
            url: `/settings/${key}`,
            data: { value },
        });
    }

    // Dashboard endpoints
    /**
     * Get dashboard statistics
     * @returns {Promise<Object>} Dashboard statistics
     */
    async getDashboardStats() {
        return this.request({
            method: 'GET',
            url: '/dashboard/stats',
        });
    }

    // Notifications endpoints
    /**
     * Get notifications list
     * @param {Object} [params] - Pagination parameters
     * @returns {Promise<Object>} Paginated notifications list
     */
    async getNotifications(params) {
        return this.request({
            method: 'GET',
            url: '/notifications',
            params,
        });
    }

    /**
     * Mark notification as read
     * @param {string} id - Notification ID
     * @returns {Promise<void>}
     */
    async markNotificationAsRead(id) {
        return this.request({
            method: 'PUT',
            url: `/notifications/${id}/read`,
        });
    }

    /**
     * Mark all notifications as read
     * @returns {Promise<void>}
     */
    async markAllNotificationsAsRead() {
        return this.request({
            method: 'PUT',
            url: '/notifications/read-all',
        });
    }

    // Audit logs endpoints
    /**
     * Get audit logs
     * @param {Object} [params] - Pagination parameters
     * @returns {Promise<Object>} Paginated audit logs
     */
    async getAuditLogs(params) {
        return this.request({
            method: 'GET',
            url: '/audit-logs',
            params,
        });
    }
}

// Create and export a single instance of the API service
export const authAPI = new ApiService();
export default authAPI; 