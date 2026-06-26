const DailyPlan = require('../models/DailyPlan');
const Meal = require('../models/Meal');
const InventoryItem = require('../models/InventoryItem');
const WorkforceRule = require('../models/WorkforceRule');
const { createAuditLog } = require('../utils/auditLog');

// Helper: auto-calculate ingredients & workforce for a daily plan
const calculatePlanDetails = async (meals, studentCount) => {
  const ingredientMap = {};
  let totalCost = 0;

  for (const mealId of meals) {
    const meal = await Meal.findById(mealId).populate('ingredients.itemId', 'name unit unitPrice');
    if (!meal) continue;

    for (const ing of meal.ingredients) {
      const totalQty = ing.quantityPerStudent * studentCount;
      const key = ing.itemId._id.toString();
      if (ingredientMap[key]) {
        ingredientMap[key].totalQty += totalQty;
      } else {
        ingredientMap[key] = {
          itemId: ing.itemId._id,
          totalQty,
          unit: ing.unit,
          name: ing.itemId.name,
        };
      }
      totalCost += ing.quantityPerStudent * ing.itemId.unitPrice * studentCount;
    }
  }

  // Workforce lookup
  const rule = await WorkforceRule.findOne({
    minStudents: { $lte: studentCount },
    maxStudents: { $gte: studentCount },
  });

  const workforceRequirements = rule
    ? { kitchen: rule.kitchen, distribution: rule.distribution, cleaning: rule.cleaning }
    : { kitchen: Math.ceil(studentCount / 50), distribution: Math.ceil(studentCount / 100), cleaning: Math.ceil(studentCount / 75) };

  return {
    ingredientRequirements: Object.values(ingredientMap),
    workforceRequirements,
    estimatedTotalCost: Number(totalCost.toFixed(2)),
  };
};

// @desc    Get all daily plans
// @route   GET /api/daily-plans
// @access  Protected
const getDailyPlans = async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const filter = {};
    if (status && status !== 'all') filter.status = status;

    const skip = (Number(page) - 1) * Number(limit);
    const total = await DailyPlan.countDocuments(filter);
    const plans = await DailyPlan.find(filter)
      .populate('createdBy', 'name rank')
      .populate('approvedBy', 'name')
      .populate('meals', 'name category estimatedCostPerStudent')
      .skip(skip)
      .limit(Number(limit))
      .sort({ date: -1 });

    res.json({ success: true, data: plans, total, page: Number(page), pages: Math.ceil(total / Number(limit)) });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Get single daily plan
// @route   GET /api/daily-plans/:id
// @access  Protected
const getDailyPlan = async (req, res) => {
  try {
    const plan = await DailyPlan.findById(req.params.id)
      .populate('createdBy', 'name rank unit')
      .populate('approvedBy', 'name')
      .populate({ path: 'meals', populate: { path: 'ingredients.itemId', select: 'name sku unit unitPrice' } })
      .populate('ingredientRequirements.itemId', 'name sku unit');

    if (!plan) return res.status(404).json({ success: false, message: 'Daily plan not found' });
    res.json({ success: true, data: plan });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Create daily plan
// @route   POST /api/daily-plans
// @access  Admin, Mezz Manager
const createDailyPlan = async (req, res) => {
  try {
    const { planName, date, studentCount, meals, status } = req.body;

    const { ingredientRequirements, workforceRequirements, estimatedTotalCost } = await calculatePlanDetails(meals || [], studentCount);

    const plan = await DailyPlan.create({
      planName, date, studentCount,
      meals: meals || [],
      ingredientRequirements,
      workforceRequirements,
      estimatedTotalCost,
      budgetStatus: 'Within Budget',
      status: status || 'draft',
      createdBy: req.user._id,
    });

    await createAuditLog({ userId: req.user._id, action: 'Create Daily Plan', module: 'DailyPlans', details: { planName } });

    const populated = await DailyPlan.findById(plan._id).populate('meals', 'name category').populate('createdBy', 'name');
    res.status(201).json({ success: true, data: populated });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Update daily plan
// @route   PUT /api/daily-plans/:id
// @access  Admin, Mezz Manager
const updateDailyPlan = async (req, res) => {
  try {
    const { meals, studentCount, status } = req.body;
    const updateData = { ...req.body };

    if (meals || studentCount) {
      const plan = await DailyPlan.findById(req.params.id);
      if (!plan) return res.status(404).json({ success: false, message: 'Plan not found' });

      const mealIds = meals || plan.meals;
      const count = studentCount || plan.studentCount;
      const { ingredientRequirements, workforceRequirements, estimatedTotalCost } = await calculatePlanDetails(mealIds, count);

      updateData.ingredientRequirements = ingredientRequirements;
      updateData.workforceRequirements = workforceRequirements;
      updateData.estimatedTotalCost = estimatedTotalCost;
    }

    // Handle approval
    if (status === 'approved') {
      updateData.approvedBy = req.user._id;
    }

    const plan = await DailyPlan.findByIdAndUpdate(req.params.id, updateData, { new: true, runValidators: true })
      .populate('meals', 'name category')
      .populate('createdBy', 'name');

    if (!plan) return res.status(404).json({ success: false, message: 'Plan not found' });

    await createAuditLog({ userId: req.user._id, action: 'Update Daily Plan', module: 'DailyPlans', details: { planId: req.params.id, status } });

    res.json({ success: true, data: plan });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Delete daily plan
// @route   DELETE /api/daily-plans/:id
// @access  Admin
const deleteDailyPlan = async (req, res) => {
  try {
    const plan = await DailyPlan.findByIdAndDelete(req.params.id);
    if (!plan) return res.status(404).json({ success: false, message: 'Plan not found' });
    await createAuditLog({ userId: req.user._id, action: 'Delete Daily Plan', module: 'DailyPlans', details: { planId: req.params.id } });
    res.json({ success: true, message: 'Daily plan deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Preview plan calculations (without saving)
// @route   POST /api/daily-plans/preview
// @access  Protected
const previewPlan = async (req, res) => {
  try {
    const { meals, studentCount } = req.body;
    const result = await calculatePlanDetails(meals || [], studentCount || 0);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = { getDailyPlans, getDailyPlan, createDailyPlan, updateDailyPlan, deleteDailyPlan, previewPlan };
