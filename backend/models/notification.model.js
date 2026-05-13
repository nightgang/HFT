const { query } = require('../db/connection');
const logger = require('../utils/logger');

class NotificationModel {
  // Create a notification
  static async create(userId, notificationData) {
    const {
      notificationType,
      title,
      message,
      data = {}
    } = notificationData;

    const sql = `
      INSERT INTO user_notifications (user_id, notification_type, title, message, data)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING notification_id, user_id, notification_type, title, message, is_read, created_at, read_at, data
    `;

    const values = [userId, notificationType, title, message, JSON.stringify(data)];

    try {
      const result = await query(sql, values);
      logger.info(`Notification created: ${result.rows[0].notification_id}`);
      return result.rows[0];
    } catch (error) {
      logger.error('Error creating notification:', error);
      throw error;
    }
  }

  // Get notifications for user
  static async getByUserId(userId, limit = 50, offset = 0) {
    const sql = `
      SELECT notification_id, user_id, notification_type, title, message, is_read, created_at, read_at, data
      FROM user_notifications
      WHERE user_id = $1
      ORDER BY created_at DESC
      LIMIT $2 OFFSET $3
    `;

    try {
      const result = await query(sql, [userId, limit, offset]);
      return result.rows;
    } catch (error) {
      logger.error('Error fetching notifications:', error);
      throw error;
    }
  }

  // Mark notification as read
  static async markAsRead(notificationId, userId) {
    const sql = `
      UPDATE user_notifications
      SET is_read = true, read_at = CURRENT_TIMESTAMP
      WHERE notification_id = $1 AND user_id = $2
      RETURNING notification_id, is_read, read_at
    `;

    try {
      const result = await query(sql, [notificationId, userId]);
      if (result.rows.length === 0) {
        throw new Error('Notification not found or unauthorized');
      }
      return result.rows[0];
    } catch (error) {
      logger.error('Error marking notification as read:', error);
      throw error;
    }
  }

  // Get unread count for user
  static async getUnreadCount(userId) {
    const sql = `
      SELECT COUNT(*) as unread_count
      FROM user_notifications
      WHERE user_id = $1 AND is_read = false
    `;

    try {
      const result = await query(sql, [userId]);
      return result.rows[0].unread_count;
    } catch (error) {
      logger.error('Error fetching unread count:', error);
      throw error;
    }
  }

  // Get notification preferences for user
  static async getPreferences(userId) {
    const sql = `
      SELECT preference_id, user_id, email_enabled, sms_enabled, push_enabled, webhook_enabled, webhook_url, 
             email_address, phone_number, do_not_disturb_start, do_not_disturb_end, quiet_hours_enabled
      FROM notification_preferences
      WHERE user_id = $1
    `;

    try {
      const result = await query(sql, [userId]);
      return result.rows[0] || null;
    } catch (error) {
      logger.error('Error fetching notification preferences:', error);
      throw error;
    }
  }

  // Update notification preferences
  static async updatePreferences(userId, preferencesData) {
    const {
      emailEnabled,
      smsEnabled,
      pushEnabled,
      webhookEnabled,
      webhookUrl,
      emailAddress,
      phoneNumber,
      doNotDisturbStart,
      doNotDisturbEnd,
      quietHoursEnabled
    } = preferencesData;

    const sql = `
      INSERT INTO notification_preferences (user_id, email_enabled, sms_enabled, push_enabled, webhook_enabled, 
                                           webhook_url, email_address, phone_number, do_not_disturb_start, 
                                           do_not_disturb_end, quiet_hours_enabled)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      ON CONFLICT (user_id)
      DO UPDATE SET
        email_enabled = COALESCE($2, email_enabled),
        sms_enabled = COALESCE($3, sms_enabled),
        push_enabled = COALESCE($4, push_enabled),
        webhook_enabled = COALESCE($5, webhook_enabled),
        webhook_url = COALESCE($6, webhook_url),
        email_address = COALESCE($7, email_address),
        phone_number = COALESCE($8, phone_number),
        do_not_disturb_start = COALESCE($9, do_not_disturb_start),
        do_not_disturb_end = COALESCE($10, do_not_disturb_end),
        quiet_hours_enabled = COALESCE($11, quiet_hours_enabled),
        updated_at = CURRENT_TIMESTAMP
      RETURNING preference_id, user_id, email_enabled, sms_enabled, push_enabled, webhook_enabled, webhook_url, 
               email_address, phone_number, do_not_disturb_start, do_not_disturb_end, quiet_hours_enabled, updated_at
    `;

    const values = [
      userId, emailEnabled, smsEnabled, pushEnabled, webhookEnabled, webhookUrl,
      emailAddress, phoneNumber, doNotDisturbStart, doNotDisturbEnd, quietHoursEnabled
    ];

    try {
      const result = await query(sql, values);
      logger.info(`Notification preferences updated for user: ${userId}`);
      return result.rows[0];
    } catch (error) {
      logger.error('Error updating notification preferences:', error);
      throw error;
    }
  }

  // Delete notification
  static async delete(notificationId, userId) {
    const sql = `
      DELETE FROM user_notifications
      WHERE notification_id = $1 AND user_id = $2
      RETURNING notification_id
    `;

    try {
      const result = await query(sql, [notificationId, userId]);
      if (result.rows.length === 0) {
        throw new Error('Notification not found or unauthorized');
      }
      return result.rows[0];
    } catch (error) {
      logger.error('Error deleting notification:', error);
      throw error;
    }
  }
}

module.exports = NotificationModel;
