const mongoose = require('mongoose');

const inventoryItemSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    sku: { type: String, required: true, unique: true, trim: true, uppercase: true },
    category: {
      type: String,
      required: true,
      enum: ['Grains & Cereals', 'Proteins', 'Vegetables', 'Fruits', 'Dairy', 'Oils & Fats', 'Spices & Condiments', 'Beverages', 'Other'],
    },
    unit: { type: String, required: true, enum: ['kg', 'g', 'L', 'mL', 'pcs', 'boxes', 'cans', 'bags'] },
    quantity: { type: Number, required: true, min: 0, default: 0 },
    unitPrice: { type: Number, required: true, min: 0 },
    minStockLevel: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      enum: ['In Stock', 'Low Stock', 'Out of Stock'],
      default: 'In Stock',
    },
    isProtected: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Auto-calculate status before save
inventoryItemSchema.pre('save', function (next) {
  if (this.quantity === 0) {
    this.status = 'Out of Stock';
  } else if (this.quantity < this.minStockLevel) {
    this.status = 'Low Stock';
  } else {
    this.status = 'In Stock';
  }
  next();
});

// Also for findOneAndUpdate
inventoryItemSchema.pre('findOneAndUpdate', function (next) {
  const update = this.getUpdate();
  const qty = update.quantity ?? update.$set?.quantity;
  const min = update.minStockLevel ?? update.$set?.minStockLevel;

  if (qty !== undefined && min !== undefined) {
    let status;
    if (qty === 0) status = 'Out of Stock';
    else if (qty < min) status = 'Low Stock';
    else status = 'In Stock';

    if (update.$set) update.$set.status = status;
    else update.status = status;
  }
  next();
});

module.exports = mongoose.model('InventoryItem', inventoryItemSchema);
