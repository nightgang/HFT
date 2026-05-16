/**
 * Notifications service
 * Handles user notifications and preferences
 */

import api from './api';

class NotificationsService {
  /**
   * Get all notifications
   */
  async getAllNotifications(limit = 50, offset = 0) {
    try {
      return await api.get(`/notifications?limit=${limit}&offset=${offset}`);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
      throw error;
    }
  }

  /**
   * Get unread notification count
   */
  async getUnreadCount() {
    try {
      const response = await api.get('/notifications/unread/count');
      return response.data?.count || 0;
    } catch (error) {
      console.error('Failed to fetch unread count:', error);
      return 0;
    }
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId) {
    try {
      return await api.put(`/notifications/${notificationId}/read`, {});
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
      throw error;
    }
  }

  /**
   * Mark all notifications as read
   */
  async markAllAsRead() {
    try {
      return await api.post('/notifications/mark-all-read', {});
    } catch (error) {
      console.error('Failed to mark all as read:', error);
      throw error;
    }
  }

  /**
   * Delete notification
   */
  async deleteNotification(notificationId) {
    try {
      return await api.delete(`/notifications/${notificationId}`);
    } catch (error) {
      console.error('Failed to delete notification:', error);
      throw error;
    }
  }

  /**
   * Delete all notifications
   */
  async deleteAllNotifications() {
    try {
      return await api.post('/notifications/delete-all', {});
    } catch (error) {
      console.error('Failed to delete all notifications:', error);
      throw error;
    }
  }

  /**
   * Get notification preferences
   */
  async getPreferences() {
    try {
      return await api.get('/notifications/preferences');
    } catch (error) {
      console.error('Failed to fetch notification preferences:', error);
      throw error;
    }
  }

  /**
   * Update notification preferences
   */
  async updatePreferences(preferences) {
    try {
      return await api.put('/notifications/preferences', preferences);
    } catch (error) {
      console.error('Failed to update notification preferences:', error);
      throw error;
    }
  }

  /**
   * Send test notification
   */
  async sendTestNotification() {
    try {
      return await api.post('/notifications/test', {});
    } catch (error) {
      console.error('Failed to send test notification:', error);
      throw error;
    }
  }
}

export default new NotificationsService();
