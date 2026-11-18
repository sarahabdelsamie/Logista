const express = require('express');
const router = express.Router();
const WorkforceRule = require('../models/WorkforceRule');
const { protect } = require('../middleware/authMiddleware');
const { roleGuard } = require('../middleware/roleMiddleware');

const adminOnly = roleGuard(['Admin']);

// @desc    Get all workforce rules
// @route   GET /api/workforce-rules
// @access  Admin
router.get('/', protect, adminOnly, async (req, res) => {
  try {
    const rules = await WorkforceRule.find().sort({ minStudents: 1 });
    res.json({ success: true, data: rules });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @desc    Create workforce rule
// @route   POST /api/workforce-rules
// @access  Admin
router.post('/', protect, adminOnly, async (req, res) => {
  try {
    const rule = await WorkforceRule.create(req.body);
    res.status(201).json({ success: true, data: rule });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @desc    Update workforce rule
// @route   PUT /api/workforce-rules/:id
// @access  Admin
router.put('/:id', protect, adminOnly, async (req, res) => {
  try {
    const rule = await WorkforceRule.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!rule) return res.status(404).json({ success: false, message: 'Workforce rule not found' });
    res.json({ success: true, data: rule });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @desc    Delete workforce rule
// @route   DELETE /api/workforce-rules/:id
// @access  Admin
router.delete('/:id', protect, adminOnly, async (req, res) => {
  try {
    const rule = await WorkforceRule.findById(req.params.id);
    if (!rule) return res.status(404).json({ success: false, message: 'Workforce rule not found' });

    if (rule.isProtected) {
      return res.status(403).json({
        success: false,
        message: 'Protected Rule: Baseline workforce rules cannot be deleted. You can create and delete custom rules.',
      });
    }

    await WorkforceRule.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Workforce rule deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
