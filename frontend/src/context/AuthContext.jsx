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
    const validateTokenAndFetchUser = async () => {
      console.log('AuthContext: Starting token validation...');
      const storedToken = localStorage.getItem('token');
      console.log('AuthContext: Stored token exists:', !!storedToken);
      
      if (storedToken) {
        try {
          const decoded = jwtDecode(storedToken);
          console.log('AuthContext: Token decoded successfully');
          console.log('AuthContext: Token expiration:', new Date(decoded.exp * 1000));
          console.log('AuthContext: Current time:', new Date());
          console.log('AuthContext: Token is valid:', decoded.exp && decoded.exp * 1000 > Date.now());
          
          if (decoded.exp && decoded.exp * 1000 > Date.now()) {
            setToken(storedToken);
            console.log('AuthContext: Token is valid, fetching user profile...');
            // Token is valid, now fetch user profile
            const response = await authAPI.getProfile();
            console.log('AuthContext: User profile fetched:', response.data);
            setUser(response.data.user);
          } else {
            console.log('AuthContext: Token expired, removing from localStorage');
            // Token expired
            localStorage.removeItem('token');
          }
        } catch (error) {
          console.error('AuthContext: Error validating token:', error);
          // Invalid token
          localStorage.removeItem('token');
        }
      }
      console.log('AuthContext: Setting loading to false');
      setLoading(false);
    };

    validateTokenAndFetchUser();
  }, []);

  /**
   * Login function
   * @param {string} token - The JWT token
   * @param {object} userData - The user object from the API
   * @returns {Promise<void>}
   */
  const login = async (token, userData) => {
    console.log('AuthContext: Login function called');
    console.log('AuthContext: Token:', token ? 'exists' : 'missing');
    console.log('AuthContext: User data:', userData);
    
    localStorage.setItem('token', token);
    setToken(token);
    setUser(userData);
    
    console.log('AuthContext: Login completed - token and user set');
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    // Temporarily redirect to dashboard instead of login since login routes are disabled
  };

  // Helper function to check if user is super admin
  const isSuperAdmin = user?.userType === 'superAdmin' || user?.isSuperAdmin === true;
  
  console.log('AuthContext: Current user:', user);
  console.log('AuthContext: User userType:', user?.userType);
  console.log('AuthContext: User isSuperAdmin:', user?.isSuperAdmin);
  console.log('AuthContext: isSuperAdmin calculated:', isSuperAdmin);

  const value = {
    user,
    token,
    isAuthenticated: !!token,
    isSuperAdmin,
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