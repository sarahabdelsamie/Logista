const express = require('express');
const router = express.Router();
const SupplyRequest = require('../models/SupplyRequest');
const { protect } = require('../middleware/authMiddleware');
const { roleGuard } = require('../middleware/roleMiddleware');
const { createAuditLog } = require('../utils/auditLog');
const { createNotificationForUser } = require('../utils/notificationHelper');

const adminManager = roleGuard(['Admin', 'Mezz Manager']);

router.get('/', protect, async (req, res) => {
  try {
    const requests = await SupplyRequest.find()
      .populate('dailyPlanId', 'planName date')
      .populate('requestedBy', 'name rank')
      .populate('items.itemId', 'name sku unit')
      .sort({ createdAt: -1 });
    res.json({ success: true, data: requests });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.post('/', protect, async (req, res) => {
  try {
    const request = await SupplyRequest.create({ ...req.body, requestedBy: req.user._id });
    await createAuditLog({
      userId: req.user._id,
      action: 'Create Supply Request',
      module: 'SupplyRequests',
      details: { requestId: request._id, dailyPlanId: request.dailyPlanId },
    });
    res.status(201).json({ success: true, data: request });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.put('/:id', protect, adminManager, async (req, res) => {
  try {
    const { status, notes } = req.body;
    const request = await SupplyRequest.findByIdAndUpdate(
      req.params.id,
      { status, notes, reviewedBy: req.user._id },
      { new: true }
    );
    if (!request) return res.status(404).json({ success: false, message: 'Request not found' });
    await createAuditLog({ userId: req.user._id, action: `Supply Request ${status}`, module: 'SupplyRequests', details: { requestId: req.params.id } });

    // Notify the requester when their supply request is approved or rejected
    if (status === 'approved' || status === 'rejected') {
      await createNotificationForUser(
        request.requestedBy,
        `Your supply request has been ${status}.`,
        status === 'approved' ? 'info' : 'warning'
      );
    }

    res.json({ success: true, data: request });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.delete('/:id', protect, adminManager, async (req, res) => {
  try {
    await SupplyRequest.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Supply request deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
