const mongoose = require('mongoose');

const ingredientRequirementSchema = new mongoose.Schema(
  {
    itemId: { type: mongoose.Schema.Types.ObjectId, ref: 'InventoryItem', required: true },
    totalQty: { type: Number, required: true },
    unit: { type: String, required: true },
  },
  { _id: false }
);

const workforceSchema = new mongoose.Schema(
  {
    kitchen: { type: Number, default: 0 },
    distribution: { type: Number, default: 0 },
    cleaning: { type: Number, default: 0 },
  },
  { _id: false }
);

const dailyPlanSchema = new mongoose.Schema(
  {
    planName: { type: String, required: true, trim: true },
    date: { type: Date, required: true },
    studentCount: { type: Number, required: true, min: 1 },
    meals: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Meal' }],
    ingredientRequirements: [ingredientRequirementSchema],
    workforceRequirements: workforceSchema,
    estimatedTotalCost: { type: Number, default: 0 },
    budgetStatus: { type: String, enum: ['Within Budget', 'Over Budget', 'Pending'], default: 'Pending' },
    status: { type: String, enum: ['draft', 'submitted', 'approved'], default: 'draft' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('DailyPlan', dailyPlanSchema);
