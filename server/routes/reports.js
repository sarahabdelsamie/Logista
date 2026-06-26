const express = require('express');
const router = express.Router();
const AuditLog = require('../models/AuditLog');
const InventoryItem = require('../models/InventoryItem');
const Meal = require('../models/Meal');
const DailyPlan = require('../models/DailyPlan');
const { protect } = require('../middleware/authMiddleware');
const { roleGuard } = require('../middleware/roleMiddleware');

const adminOnly = roleGuard(['Admin', 'Mezz Manager']);

// @desc    Get dashboard summary report
// @route   GET /api/reports/summary
router.get('/summary', protect, adminOnly, async (req, res) => {
  try {
    const [totalItems, lowStock, outOfStock, totalMeals, totalPlans, approvedPlans] = await Promise.all([
      InventoryItem.countDocuments(),
      InventoryItem.countDocuments({ status: 'Low Stock' }),
      InventoryItem.countDocuments({ status: 'Out of Stock' }),
      Meal.countDocuments({ status: 'published' }),
      DailyPlan.countDocuments(),
      DailyPlan.countDocuments({ status: 'approved' }),
    ]);

    res.json({
      success: true,
      data: { inventory: { totalItems, lowStock, outOfStock }, meals: { totalMeals }, plans: { totalPlans, approvedPlans } },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @desc    Get inventory value report
// @route   GET /api/reports/inventory-value
router.get('/inventory-value', protect, adminOnly, async (req, res) => {
  try {
    const items = await InventoryItem.find();
    const totalValue = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
    const byCategory = {};
    items.forEach((item) => {
      if (!byCategory[item.category]) byCategory[item.category] = 0;
      byCategory[item.category] += item.quantity * item.unitPrice;
    });
    res.json({ success: true, data: { totalValue: Number(totalValue.toFixed(2)), byCategory } });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
