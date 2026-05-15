const NotificationModel = require('../models/notification.model');
const { query } = require('../db/connection');

describe('NotificationModel', () => {
  beforeEach(() => {
    query.mockClear();
  });

  it('creates a new notification with the correct SQL and values', async () => {
    const notificationData = {
      notificationType: 'SYSTEM',
      title: 'Welcome',
      message: 'Your notification service is enabled',
      data: { source: 'unit-test' }
    };

    const result = await NotificationModel.create('user-123', notificationData);

    expect(query).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO user_notifications'),
      [
        'user-123',
        'SYSTEM',
        'Welcome',
        'Your notification service is enabled',
        JSON.stringify(notificationData.data)
      ]
    );
    expect(result).toHaveProperty('notification_id');
    expect(result.user_id).toBe('user-123');
  });

  it('fetches notifications by user id', async () => {
    await NotificationModel.getByUserId('user-321', 20, 5);

    expect(query).toHaveBeenCalledWith(
      expect.stringContaining('SELECT notification_id, user_id, notification_type, title, message'),
      ['user-321', 20, 5]
    );
  });

  it('marks a notification as read for the current user', async () => {
    await NotificationModel.markAsRead('notif-123', 'user-321');

    expect(query).toHaveBeenCalledWith(
      expect.stringContaining('UPDATE user_notifications'),
      ['notif-123', 'user-321']
    );
  });

  it('returns notification preferences for the current user', async () => {
    await NotificationModel.getPreferences('user-321');

    expect(query).toHaveBeenCalledWith(
      expect.stringContaining('SELECT preference_id, user_id, email_enabled, sms_enabled'),
      ['user-321']
    );
  });

  it('updates notification preferences for the current user', async () => {
    const preferences = {
      emailEnabled: false,
      smsEnabled: true,
      pushEnabled: false,
      webhookEnabled: true,
      webhookUrl: 'https://example.com/webhook',
      emailAddress: 'test@example.com',
      phoneNumber: '+1234567890',
      doNotDisturbStart: '22:00:00',
      doNotDisturbEnd: '07:00:00',
      quietHoursEnabled: true
    };

    await NotificationModel.updatePreferences('user-321', preferences);

    expect(query).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO notification_preferences'),
      [
        'user-321',
        false,
        true,
        false,
        true,
        'https://example.com/webhook',
        'test@example.com',
        '+1234567890',
        '22:00:00',
        '07:00:00',
        true
      ]
    );
  });

  it('deletes a notification for the current user', async () => {
    await NotificationModel.delete('notif-999', 'user-321');

    expect(query).toHaveBeenCalledWith(
      expect.stringContaining('DELETE FROM user_notifications'),
      ['notif-999', 'user-321']
    );
  });
});
