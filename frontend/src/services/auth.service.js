/**
 * Authentication service
 * Handles user registration, login, logout, and session management
 */

import api from './api';

class AuthService {
  /**
   * Register a new user
   */
  async register(username, email, password, firstName = '', lastName = '', phone = '') {
    try {
      const response = await api.post('/users/register', {
        username,
        email,
        password,
        firstName,
        lastName,
        phone,
      });

      if (response.data?.token) {
        api.setAuthToken(response.data.token);
      }

      return response;
    } catch (error) {
      console.error('Registration failed:', error);
      throw error;
    }
  }

  /**
   * Login user
   */
  async login(identifier, password) {
    try {
      const response = await api.post('/users/login', {
        identifier,
        password,
      });

      if (response.data?.token) {
        api.setAuthToken(response.data.token);
      }

      return response;
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  }

  /**
   * Logout user
   */
  logout() {
    api.setAuthToken(null);
    // Clear any other user data from localStorage if needed
    localStorage.removeItem('userPreferences');
    localStorage.removeItem('uiPreferences');
  }

  /**
   * Get current user profile
   */
  async getProfile() {
    try {
      return await api.get('/users/profile');
    } catch (error) {
      console.error('Failed to fetch profile:', error);
      throw error;
    }
  }

  /**
   * Update user profile
   */
  async updateProfile(updates) {
    try {
      return await api.put('/users/profile', updates);
    } catch (error) {
      console.error('Failed to update profile:', error);
      throw error;
    }
  }

  /**
   * Change password
   */
  async changePassword(currentPassword, newPassword) {
    try {
      return await api.post('/users/change-password', {
        currentPassword,
        newPassword,
      });
    } catch (error) {
      console.error('Failed to change password:', error);
      throw error;
    }
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated() {
    return !!api.getAuthToken();
  }

  /**
   * Get auth token
   */
  getToken() {
    return api.getAuthToken();
  }
}

export default new AuthService();
