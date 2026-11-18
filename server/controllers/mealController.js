const Meal = require('../models/Meal');
const InventoryItem = require('../models/InventoryItem');
const { createAuditLog } = require('../utils/auditLog');

// Helper: calculate cost per student
const calcMealCost = async (ingredients) => {
  let total = 0;
  for (const ing of ingredients) {
    const item = await InventoryItem.findById(ing.itemId);
    if (item) {
      total += ing.quantityPerStudent * item.unitPrice;
    }
  }
  return Number(total.toFixed(2));
};

// @desc    Get all meals
// @route   GET /api/meals
// @access  Protected
const getMeals = async (req, res) => {
  try {
    const { category, status, search, page = 1, limit = 10 } = req.query;
    const filter = {};

    if (category && category !== 'all') filter.category = category;
    if (status && status !== 'all') filter.status = status;
    if (search) filter.name = { $regex: search, $options: 'i' };

    const skip = (Number(page) - 1) * Number(limit);
    const total = await Meal.countDocuments(filter);
    const meals = await Meal.find(filter)
      .populate('ingredients.itemId', 'name sku unit unitPrice')
      .populate('createdBy', 'name')
      .skip(skip)
      .limit(Number(limit))
      .sort({ createdAt: -1 });

    res.json({ success: true, data: meals, total, page: Number(page), pages: Math.ceil(total / Number(limit)) });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Get single meal
// @route   GET /api/meals/:id
// @access  Protected
const getMeal = async (req, res) => {
  try {
    const meal = await Meal.findById(req.params.id)
      .populate('ingredients.itemId', 'name sku unit unitPrice')
      .populate('createdBy', 'name');
    if (!meal) return res.status(404).json({ success: false, message: 'Meal not found' });
    res.json({ success: true, data: meal });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Create meal
// @route   POST /api/meals
// @access  Admin, Mezz Manager, Kitchen Supervisor
const createMeal = async (req, res) => {
  try {
    const { name, category, preparationInstructions, estimatedCalories, ingredients, status } = req.body;

    const costPerStudent = await calcMealCost(ingredients || []);

    const meal = await Meal.create({
      name, category, preparationInstructions, estimatedCalories,
      ingredients: ingredients || [],
      estimatedCostPerStudent: costPerStudent,
      status: status || 'draft',
      createdBy: req.user._id,
    });

    await createAuditLog({ userId: req.user._id, action: 'Create Meal', module: 'Meals', details: { mealName: name } });

    const populated = await Meal.findById(meal._id).populate('ingredients.itemId', 'name sku unit unitPrice');
    res.status(201).json({ success: true, data: populated });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Update meal
// @route   PUT /api/meals/:id
// @access  Admin, Mezz Manager, Kitchen Supervisor
const updateMeal = async (req, res) => {
  try {
    const { ingredients } = req.body;
    const costPerStudent = ingredients ? await calcMealCost(ingredients) : undefined;

    const updateData = { ...req.body };
    if (costPerStudent !== undefined) updateData.estimatedCostPerStudent = costPerStudent;

    const meal = await Meal.findByIdAndUpdate(req.params.id, updateData, { new: true, runValidators: true })
      .populate('ingredients.itemId', 'name sku unit unitPrice');

    if (!meal) return res.status(404).json({ success: false, message: 'Meal not found' });

    await createAuditLog({ userId: req.user._id, action: 'Update Meal', module: 'Meals', details: { mealId: req.params.id } });

    res.json({ success: true, data: meal });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Delete meal
// @route   DELETE /api/meals/:id
// @access  Admin
const deleteMeal = async (req, res) => {
  try {
    const meal = await Meal.findById(req.params.id);
    if (!meal) return res.status(404).json({ success: false, message: 'Meal not found' });

    if (meal.isProtected) {
      return res.status(403).json({
        success: false,
        message: 'Protected Meal: Baseline demonstration meal profiles cannot be deleted. You can create and delete custom meals.',
      });
    }

    await Meal.findByIdAndDelete(req.params.id);
    await createAuditLog({ userId: req.user._id, action: 'Delete Meal', module: 'Meals', details: { mealId: req.params.id } });
    res.json({ success: true, message: 'Meal deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = { getMeals, getMeal, createMeal, updateMeal, deleteMeal };
