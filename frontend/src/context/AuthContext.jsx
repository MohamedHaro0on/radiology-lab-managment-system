import React, { createContext, useContext, useState, useEffect } from 'react';
// import { useNavigate } from 'react-router-dom'; // Temporarily disabled
import { jwtDecode } from 'jwt-decode';
import { authAPI } from '../services/api';
import { toast } from 'react-toastify';
import { useTranslation } from 'react-i18next';

/**
 * @typedef {Object} User
 * @property {string} id - User ID
 * @property {string} username - Username
 * @property {string} email - Email address
 * @property {string} role - User role
 * @property {number} exp - Token expiration timestamp
 */

/**
 * @typedef {Object} AuthContextType
 * @property {User|null} user - Current user object
 * @property {string|null} token - Authentication token
 * @property {boolean} isAuthenticated - Whether user is authenticated
 * @property {function(string, string): Promise<void>} login - Login function
 * @property {function(): void} logout - Logout function
 * @property {boolean} loading - Whether auth state is loading
 */

const AuthContext = createContext(undefined);

/**
 * Hook to use the auth context
 * @returns {AuthContextType}
 * @throws {Error} If used outside of AuthProvider
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

/**
 * Authentication provider component
 * @param {Object} props
 * @param {React.ReactNode} props.children - Child components
 */
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);
  const { t } = useTranslation();

  useEffect(() => {
    // Temporarily simulate authenticated user for development
    const mockUser = {
      id: '68308e45f146969854313e30',
      username: 'admin',
      email: 'admin@example.com',
      isActive: true,
      isSuperAdmin: true,
      privileges: [
        { module: 'users', permissions: ['view', 'create', 'update', 'delete'] },
        { module: 'patients', permissions: ['view', 'create', 'update', 'delete'] },
        { module: 'doctors', permissions: ['view', 'create', 'update', 'delete'] },
        { module: 'appointments', permissions: ['view', 'create', 'update', 'delete'] }
      ],
      exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 hours from now
    };
    
    const mockToken = 'mock-jwt-token-for-development';
    
    // Set mock authentication data
    localStorage.setItem('token', mockToken);
    setToken(mockToken);
    setUser(mockUser);
    setLoading(false);
    
    // Original authentication logic (commented out)
    /*
    const storedToken = localStorage.getItem('token');
    if (storedToken) {
      try {
        const decoded = jwtDecode(storedToken);
        if (decoded.exp && decoded.exp * 1000 > Date.now()) {
          setUser(decoded);
          setToken(storedToken);
        } else {
          localStorage.removeItem('token');
        }
      } catch (error) {
        localStorage.removeItem('token');
      }
    }
    setLoading(false);
    */
  }, []);

  /**
   * Login function
   * @param {string} email - User email
   * @param {string} password - User password
   * @returns {Promise<void>}
   */
  const login = async (email, password) => {
    try {
      const response = await authAPI.login({ email, password });
      const { token: newToken, user: userData } = response;  // Expect both token and user data from login
      
      // Store token and user data
      localStorage.setItem('token', newToken);
      setToken(newToken);
      setUser(userData);
      
      toast.success(t('auth.loginSuccess'));
    } catch (error) {
      toast.error(error.response?.data?.message || t('auth.loginError'));
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    // Temporarily redirect to dashboard instead of login since login routes are disabled
  };

  const value = {
    user,
    token,
    isAuthenticated: !!token,
    login,
    logout,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}; 