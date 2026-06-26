const express = require('express');
const router = express.Router();
const { getMeals, getMeal, createMeal, updateMeal, deleteMeal } = require('../controllers/mealController');
const { protect } = require('../middleware/authMiddleware');
const { roleGuard } = require('../middleware/roleMiddleware');

const canManageMeals = roleGuard(['Admin', 'Mezz Manager', 'Kitchen Supervisor']);
const adminOnly = roleGuard(['Admin']);

router.get('/', protect, getMeals);
router.post('/', protect, canManageMeals, createMeal);
router.get('/:id', protect, getMeal);
router.put('/:id', protect, canManageMeals, updateMeal);
router.delete('/:id', protect, adminOnly, deleteMeal);

module.exports = router;
