const express = require('express');
const router = express.Router();
const {
  getDailyPlans, getDailyPlan, createDailyPlan,
  updateDailyPlan, deleteDailyPlan, previewPlan,
} = require('../controllers/dailyPlanController');
const { protect } = require('../middleware/authMiddleware');
const { roleGuard } = require('../middleware/roleMiddleware');

const canManagePlans = roleGuard(['Admin', 'Mezz Manager']);
const adminOnly = roleGuard(['Admin']);

router.post('/preview', protect, previewPlan);
router.get('/', protect, getDailyPlans);
router.post('/', protect, canManagePlans, createDailyPlan);
router.get('/:id', protect, getDailyPlan);
router.put('/:id', protect, canManagePlans, updateDailyPlan);
router.delete('/:id', protect, adminOnly, deleteDailyPlan);

module.exports = router;
