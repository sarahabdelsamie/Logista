const express = require('express');
const router = express.Router();
const {
  getInventoryItems, getInventoryItem, createInventoryItem,
  updateInventoryItem, deleteInventoryItem, stockTransaction,
  getStockAlerts, getInventoryStats,
} = require('../controllers/inventoryController');
const { protect } = require('../middleware/authMiddleware');
const { roleGuard } = require('../middleware/roleMiddleware');

const storeKeeper = roleGuard(['Admin', 'Store Keeper', 'Mezz Manager']);
const adminOnly = roleGuard(['Admin']);

// Special routes first (before /:id to avoid conflicts)
router.get('/alerts', protect, getStockAlerts);
router.get('/stats', protect, getInventoryStats);

router.get('/', protect, getInventoryItems);
router.post('/', protect, storeKeeper, createInventoryItem);
router.get('/:id', protect, getInventoryItem);
router.put('/:id', protect, storeKeeper, updateInventoryItem);
router.delete('/:id', protect, adminOnly, deleteInventoryItem);
router.post('/:id/transaction', protect, storeKeeper, stockTransaction);

module.exports = router;
