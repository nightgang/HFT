/**
 * User service
 * Handles user-related operations
 */

import api from './api';

class UserService {
  /**
   * Get all users (admin only)
   */
  async getAllUsers(limit = 50, offset = 0) {
    try {
      return await api.get(`/users?limit=${limit}&offset=${offset}`);
    } catch (error) {
      console.error('Failed to fetch users:', error);
      throw error;
    }
  }

  /**
   * Get user by ID
   */
  async getUserById(userId) {
    try {
      return await api.get(`/users/${userId}`);
    } catch (error) {
      console.error('Failed to fetch user:', error);
      throw error;
    }
  }

  /**
   * Get current user profile
   */
  async getCurrentProfile() {
    try {
      return await api.get('/users/profile');
    } catch (error) {
      console.error('Failed to fetch current profile:', error);
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
   * Update user preferences
   */
  async updatePreferences(preferences) {
    try {
      return await api.put('/users/preferences', preferences);
    } catch (error) {
      console.error('Failed to update preferences:', error);
      throw error;
    }
  }

  /**
   * Get user preferences
   */
  async getPreferences() {
    try {
      return await api.get('/users/preferences');
    } catch (error) {
      console.error('Failed to fetch preferences:', error);
      throw error;
    }
  }

  /**
   * Delete user account
   */
  async deleteAccount(password) {
    try {
      return await api.delete('/users/account', {
        body: JSON.stringify({ password }),
      });
    } catch (error) {
      console.error('Failed to delete account:', error);
      throw error;
    }
  }

  /**
   * Request password reset
   */
  async requestPasswordReset(email) {
    try {
      return await api.post('/users/request-reset', { email });
    } catch (error) {
      console.error('Failed to request password reset:', error);
      throw error;
    }
  }

  /**
   * Reset password with token
   */
  async resetPassword(token, newPassword) {
    try {
      return await api.post('/users/reset-password', {
        token,
        newPassword,
      });
    } catch (error) {
      console.error('Failed to reset password:', error);
      throw error;
    }
  }
}

export default new UserService();
