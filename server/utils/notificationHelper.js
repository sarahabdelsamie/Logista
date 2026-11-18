const Notification = require('../models/Notification');
const User = require('../models/User');

/**
 * Create a notification for a specific user
 */
const createNotification = async (userId, message, type = 'info') => {
  try {
    return await Notification.create({
      userId,
      message,
      type,
      isRead: false,
    });
  } catch (err) {
    console.error('Failed to create notification:', err.message);
  }
};

/**
 * Create a notification for all users holding specific roles
 * @param {string[]} roles - e.g. ['Admin', 'Mezz Manager']
 * @param {string} message - Notification text
 * @param {'info' | 'warning' | 'alert'} type - Severity
 */
const notifyRoles = async (roles, message, type = 'info') => {
  try {
    const users = await User.find({ role: { $in: roles }, isActive: true }).select('_id');
    if (!users.length) return;

    const notifications = users.map((u) => ({
      userId: u._id,
      message,
      type,
      isRead: false,
    }));

    return await Notification.insertMany(notifications);
  } catch (err) {
    console.error('Failed to notify roles:', err.message);
  }
};

module.exports = {
  createNotification,
  createNotificationForUser: createNotification,
  notifyRoles,
  createNotificationForRoles: notifyRoles,
};
