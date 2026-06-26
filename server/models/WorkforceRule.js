const mongoose = require('mongoose');

const workforceRuleSchema = new mongoose.Schema(
  {
    minStudents: { type: Number, required: true },
    maxStudents: { type: Number, required: true },
    kitchen: { type: Number, required: true },
    distribution: { type: Number, required: true },
    cleaning: { type: Number, required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('WorkforceRule', workforceRuleSchema);
