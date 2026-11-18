const express = require('express');
const router = express.Router();
const AuditLog = require('../models/AuditLog');
const InventoryItem = require('../models/InventoryItem');
const Meal = require('../models/Meal');
const DailyPlan = require('../models/DailyPlan');
const SupplyRequest = require('../models/SupplyRequest');
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

// @desc    Get cost trend over recent daily plans
// @route   GET /api/reports/cost-trend
router.get('/cost-trend', protect, adminOnly, async (req, res) => {
  try {
    const plans = await DailyPlan.find()
      .select('planName date estimatedTotalCost studentCount budgetStatus status')
      .sort({ date: 1 })
      .limit(30);

    const data = plans.map((p) => ({
      id: p._id,
      name: p.planName,
      date: new Date(p.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      cost: p.estimatedTotalCost || 0,
      students: p.studentCount || 0,
      status: p.status,
    }));

    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @desc    Get supply request status breakdown
// @route   GET /api/reports/supply-request-stats
router.get('/supply-request-stats', protect, adminOnly, async (req, res) => {
  try {
    const [pending, approved, rejected, total] = await Promise.all([
      SupplyRequest.countDocuments({ status: 'pending' }),
      SupplyRequest.countDocuments({ status: 'approved' }),
      SupplyRequest.countDocuments({ status: 'rejected' }),
      SupplyRequest.countDocuments(),
    ]);

    res.json({
      success: true,
      data: {
        pending,
        approved,
        rejected,
        total,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @desc    Get top meals by usage in plans
// @route   GET /api/reports/meal-usage
router.get('/meal-usage', protect, adminOnly, async (req, res) => {
  try {
    const plans = await DailyPlan.find().populate('meals', 'name category');
    const usageMap = {};

    plans.forEach((plan) => {
      plan.meals.forEach((m) => {
        if (!m) return;
        const name = m.name;
        if (!usageMap[name]) {
          usageMap[name] = { name, category: m.category, count: 0 };
        }
        usageMap[name].count += 1;
      });
    });

    const data = Object.values(usageMap)
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);

    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @desc    Export inventory as CSV
// @route   GET /api/reports/export/inventory-csv
router.get('/export/inventory-csv', protect, adminOnly, async (req, res) => {
  try {
    const items = await InventoryItem.find().sort({ category: 1, name: 1 });
    let csv = 'SKU,Name,Category,Unit,Quantity,UnitPrice,MinStockLevel,Status,TotalValue\n';
    items.forEach((item) => {
      const totalVal = (item.quantity * item.unitPrice).toFixed(2);
      csv += `"${item.sku}","${item.name.replace(/"/g, '""')}","${item.category}","${item.unit}",${item.quantity},${item.unitPrice},${item.minStockLevel},"${item.status}",${totalVal}\n`;
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="inventory-report.csv"');
    res.send(csv);
  } catch (err) {
    res.status(500).json({ success: false, message: 'Export failed' });
  }
});

// @desc    Export daily plans as CSV
// @route   GET /api/reports/export/plans-csv
router.get('/export/plans-csv', protect, adminOnly, async (req, res) => {
  try {
    const plans = await DailyPlan.find()
      .populate('createdBy', 'name')
      .populate('meals', 'name')
      .sort({ date: -1 });

    let csv = 'PlanName,Date,PersonnelCount,Meals,EstimatedCost,Status,CreatedBy\n';
    plans.forEach((p) => {
      const mealNames = (p.meals || []).map((m) => m.name).join('; ');
      const dateStr = new Date(p.date).toISOString().split('T')[0];
      csv += `"${p.planName}","${dateStr}",${p.studentCount},"${mealNames}",${p.estimatedTotalCost || 0},"${p.status}","${p.createdBy?.name || ''}"\n`;
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="daily-plans-report.csv"');
    res.send(csv);
  } catch (err) {
    res.status(500).json({ success: false, message: 'Export failed' });
  }
});

module.exports = router;