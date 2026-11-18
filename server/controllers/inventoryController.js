const InventoryItem = require('../models/InventoryItem');
const AuditLog = require('../models/AuditLog');
const { createAuditLog } = require('../utils/auditLog');
const { createNotificationForRoles } = require('../utils/notificationHelper');

// Helper: recalculate status
const calcStatus = (qty, minStockLevel) => {
  if (qty === 0) return 'Out of Stock';
  if (qty < minStockLevel) return 'Low Stock';
  return 'In Stock';
};

// @desc    Get all inventory items
// @route   GET /api/inventory
// @access  Protected
const getInventoryItems = async (req, res) => {
  try {
    const { category, status, search, page = 1, limit = 10 } = req.query;
    const filter = {};

    if (category && category !== 'all') filter.category = category;
    if (status && status !== 'all') filter.status = status;
    if (search) filter.name = { $regex: search, $options: 'i' };

    const skip = (Number(page) - 1) * Number(limit);
    const total = await InventoryItem.countDocuments(filter);
    const items = await InventoryItem.find(filter).skip(skip).limit(Number(limit)).sort({ createdAt: -1 });

    res.json({ success: true, data: items, total, page: Number(page), pages: Math.ceil(total / Number(limit)) });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Get single inventory item
// @route   GET /api/inventory/:id
// @access  Protected
const getInventoryItem = async (req, res) => {
  try {
    const item = await InventoryItem.findById(req.params.id);
    if (!item) return res.status(404).json({ success: false, message: 'Item not found' });
    res.json({ success: true, data: item });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Create inventory item
// @route   POST /api/inventory
// @access  Admin, Store Keeper
const createInventoryItem = async (req, res) => {
  try {
    const item = await InventoryItem.create(req.body);
    await createAuditLog({ userId: req.user._id, action: 'Create Inventory Item', module: 'Inventory', details: { sku: item.sku } });
    res.status(201).json({ success: true, data: item });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'SKU already exists' });
    }
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Update inventory item
// @route   PUT /api/inventory/:id
// @access  Admin, Store Keeper
const updateInventoryItem = async (req, res) => {
  try {
    const updateData = { ...req.body };
    const qty = updateData.quantity;
    const min = updateData.minStockLevel;

    if (qty !== undefined && min !== undefined) {
      updateData.status = calcStatus(qty, min);
    }

    const item = await InventoryItem.findByIdAndUpdate(req.params.id, updateData, { new: true, runValidators: true });
    if (!item) return res.status(404).json({ success: false, message: 'Item not found' });

    await createAuditLog({ userId: req.user._id, action: 'Update Inventory Item', module: 'Inventory', details: { sku: item.sku } });

    res.json({ success: true, data: item });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Delete inventory item
// @route   DELETE /api/inventory/:id
// @access  Admin
const deleteInventoryItem = async (req, res) => {
  try {
    const item = await InventoryItem.findByIdAndDelete(req.params.id);
    if (!item) return res.status(404).json({ success: false, message: 'Item not found' });

    await createAuditLog({ userId: req.user._id, action: 'Delete Inventory Item', module: 'Inventory', details: { sku: item.sku } });

    res.json({ success: true, message: 'Item deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Stock transaction (issue or restock)
// @route   POST /api/inventory/:id/transaction
// @access  Protected
const stockTransaction = async (req, res) => {
  try {
    const { type, quantity, notes } = req.body;

    if (!['issue', 'restock'].includes(type)) {
      return res.status(400).json({ success: false, message: 'Type must be "issue" or "restock"' });
    }
    if (!quantity || quantity <= 0) {
      return res.status(400).json({ success: false, message: 'Quantity must be positive' });
    }

    const item = await InventoryItem.findById(req.params.id);
    if (!item) return res.status(404).json({ success: false, message: 'Item not found' });

    if (type === 'issue') {
      if (quantity > item.quantity) {
        return res.status(400).json({ success: false, message: `Cannot issue ${quantity} — only ${item.quantity} available` });
      }
      item.quantity -= quantity;
    } else {
      item.quantity += quantity;
    }

    // Status recalculated by pre-save hook
    await item.save();

    await createAuditLog({
      userId: req.user._id,
      action: `Stock ${type === 'issue' ? 'Issue' : 'Restock'}`,
      module: 'Inventory',
      details: { sku: item.sku, type, quantity, notes, newQuantity: item.quantity },
    });

    // Notify Admin & Store Keeper if the item is now Low Stock or Out of Stock
    if (item.status === 'Out of Stock') {
      await createNotificationForRoles(
        ['Admin', 'Store Keeper'],
        `Inventory alert: "${item.name}" (SKU: ${item.sku}) is now Out of Stock.`,
        'alert'
      );
    } else if (item.status === 'Low Stock') {
      await createNotificationForRoles(
        ['Admin', 'Store Keeper'],
        `Inventory alert: "${item.name}" (SKU: ${item.sku}) is now Low Stock (${item.quantity} remaining).`,
        'warning'
      );
    }

    res.json({ success: true, data: item, transaction: { type, quantity, notes, performedBy: req.user.name, date: new Date() } });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Get stock alerts (Low Stock + Out of Stock)
// @route   GET /api/inventory/alerts
// @access  Protected
const getStockAlerts = async (req, res) => {
  try {
    const alerts = await InventoryItem.find({ status: { $ne: 'In Stock' } }).sort({ status: 1 });
    res.json({ success: true, data: alerts, count: alerts.length });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Get inventory stats (KPI)
// @route   GET /api/inventory/stats
// @access  Protected
const getInventoryStats = async (req, res) => {
  try {
    const total = await InventoryItem.countDocuments();
    const lowStock = await InventoryItem.countDocuments({ status: 'Low Stock' });
    const outOfStock = await InventoryItem.countDocuments({ status: 'Out of Stock' });

    res.json({ success: true, data: { total, lowStock, outOfStock, inStock: total - lowStock - outOfStock } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Get stock transactions history
// @route   GET /api/inventory/transactions
// @access  Protected
const getStockTransactions = async (req, res) => {
  try {
    const { page = 1, limit = 15, type } = req.query;
    const filter = { module: 'Inventory' };

    if (type === 'issue') {
      filter.action = 'Stock Issue';
    } else if (type === 'restock') {
      filter.action = 'Stock Restock';
    } else {
      filter.action = { $in: ['Stock Issue', 'Stock Restock'] };
    }

    const skip = (Number(page) - 1) * Number(limit);
    const total = await AuditLog.countDocuments(filter);
    const logs = await AuditLog.find(filter)
      .populate('userId', 'name email role rank')
      .skip(skip)
      .limit(Number(limit))
      .sort({ timestamp: -1 });

    res.json({
      success: true,
      data: logs,
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = {
  getInventoryItems,
  getInventoryItem,
  createInventoryItem,
  updateInventoryItem,
  deleteInventoryItem,
  stockTransaction,
  getStockAlerts,
  getInventoryStats,
  getStockTransactions,
};
