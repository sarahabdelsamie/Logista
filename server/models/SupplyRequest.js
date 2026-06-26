const mongoose = require('mongoose');

const supplyRequestSchema = new mongoose.Schema(
  {
    dailyPlanId: { type: mongoose.Schema.Types.ObjectId, ref: 'DailyPlan', required: true },
    requestedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    items: [
      {
        itemId: { type: mongoose.Schema.Types.ObjectId, ref: 'InventoryItem', required: true },
        quantity: { type: Number, required: true, min: 1 },
        _id: false,
      },
    ],
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    notes: { type: String, trim: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('SupplyRequest', supplyRequestSchema);
