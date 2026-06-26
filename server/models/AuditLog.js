const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    action: { type: String, required: true },
    module: {
      type: String,
      required: true,
      enum: ['Auth', 'Users', 'Inventory', 'Meals', 'DailyPlans', 'SupplyRequests', 'Reports'],
    },
    details: { type: mongoose.Schema.Types.Mixed },
    timestamp: { type: Date, default: Date.now },
  }
);

// Disable updatedAt, only need createdAt-style timestamp
auditLogSchema.set('timestamps', false);

module.exports = mongoose.model('AuditLog', auditLogSchema);
