const express = require('express');
const router = express.Router();
const AuditLog = require('../models/AuditLog');
const { protect } = require('../middleware/authMiddleware');
const { roleGuard } = require('../middleware/roleMiddleware');

// GET /api/audit-logs
router.get('/', protect, roleGuard(['Admin']), async (req, res) => {
  try {
    const { module, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (module) filter.module = module;

    const skip = (Number(page) - 1) * Number(limit);
    const total = await AuditLog.countDocuments(filter);
    const logs = await AuditLog.find(filter)
      .populate('userId', 'name email role')
      .skip(skip)
      .limit(Number(limit))
      .sort({ timestamp: -1 });

    res.json({ success: true, data: logs, total, page: Number(page), pages: Math.ceil(total / Number(limit)) });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
