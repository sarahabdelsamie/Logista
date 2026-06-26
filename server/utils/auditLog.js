const AuditLog = require('../models/AuditLog');

const createAuditLog = async ({ userId, action, module, details }) => {
  try {
    await AuditLog.create({ userId, action, module, details, timestamp: new Date() });
  } catch (err) {
    console.error('Audit log error:', err.message);
  }
};

module.exports = { createAuditLog };
