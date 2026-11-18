const User = require('../models/User');
const WorkforceRule = require('../models/WorkforceRule');
const InventoryItem = require('../models/InventoryItem');
const Meal = require('../models/Meal');
const DailyPlan = require('../models/DailyPlan');
const SupplyRequest = require('../models/SupplyRequest');

const DEMO_PASSWORD = 'Demo@123';

const DEMO_ACCOUNTS = [
  {
    role: 'Admin',
    name: 'Demo Administrator',
    email: 'demo.admin@logista.mil',
    password: DEMO_PASSWORD,
    rank: 'Colonel',
    unit: 'HQ Logistics Command',
    badgeColor: 'purple',
    description: 'Full access to user administration, workforce rules, system audit logs, and approval overrides.',
  },
  {
    role: 'Mezz Manager',
    name: 'Demo Mess Manager',
    email: 'demo.manager@logista.mil',
    password: DEMO_PASSWORD,
    rank: 'Major',
    unit: '1st Battalion Mess Hall',
    badgeColor: 'blue',
    description: 'Meal planning, headcount scheduling, workforce calculations, and supply request workflows.',
  },
  {
    role: 'Kitchen Supervisor',
    name: 'Demo Kitchen Supervisor',
    email: 'demo.kitchen@logista.mil',
    password: DEMO_PASSWORD,
    rank: 'Sergeant',
    unit: 'Bravo Mess Hall Galley',
    badgeColor: 'amber',
    description: 'Recipe and ingredient scaling, preparation instructions, meal profiles, and kitchen logs.',
  },
  {
    role: 'Store Keeper',
    name: 'Demo Store Keeper',
    email: 'demo.store@logista.mil',
    password: DEMO_PASSWORD,
    rank: 'Corporal',
    unit: 'Depot Supply Station 4',
    badgeColor: 'emerald',
    description: 'Inventory management, stock issue/restock transactions, and automated low-stock alerts.',
  },
];

let isProvisioning = false;
let isProvisioned = false;

const ensureDemoProvisioned = async () => {
  if (isProvisioned || isProvisioning) return;
  isProvisioning = true;

  try {
    // 1. Provision / Verify Dedicated Demo Accounts
    for (const demo of DEMO_ACCOUNTS) {
      let user = await User.findOne({ email: demo.email }).select('+password');
      if (!user) {
        await User.create({
          name: demo.name,
          email: demo.email,
          password: demo.password,
          role: demo.role,
          rank: demo.rank,
          unit: demo.unit,
          isDemo: true,
          isActive: true,
        });
        console.log(`✅ Demo account provisioned: ${demo.email} (${demo.role})`);
      } else {
        let modified = false;
        if (!user.isDemo) {
          user.isDemo = true;
          modified = true;
        }
        if (!user.isActive) {
          user.isActive = true;
          modified = true;
        }
        const passwordMatches = await user.matchPassword(demo.password);
        if (!passwordMatches) {
          user.password = demo.password; // Triggers pre-save bcrypt hash
          modified = true;
        }
        if (modified) {
          await user.save();
          console.log(`🔄 Demo account refreshed: ${demo.email}`);
        }
      }
    }

    // 2. Ensure Baseline Workforce Rules exist
    const rulesCount = await WorkforceRule.countDocuments();
    if (rulesCount === 0) {
      await WorkforceRule.insertMany([
        { minStudents: 1, maxStudents: 50, kitchen: 3, distribution: 2, cleaning: 2, isProtected: true },
        { minStudents: 51, maxStudents: 100, kitchen: 5, distribution: 3, cleaning: 3, isProtected: true },
        { minStudents: 101, maxStudents: 200, kitchen: 8, distribution: 5, cleaning: 4, isProtected: true },
        { minStudents: 201, maxStudents: 300, kitchen: 10, distribution: 6, cleaning: 5, isProtected: true },
        { minStudents: 301, maxStudents: 500, kitchen: 14, distribution: 8, cleaning: 6, isProtected: true },
        { minStudents: 501, maxStudents: 9999, kitchen: 20, distribution: 12, cleaning: 8, isProtected: true },
      ]);
      console.log('✅ Baseline workforce rules auto-provisioned');
    }

    // 3. Ensure Baseline Inventory Items exist
    const itemsCount = await InventoryItem.countDocuments();
    if (itemsCount === 0) {
      await InventoryItem.insertMany([
        { name: 'Long Grain Basmati Rice', sku: 'GR-001', category: 'Grains & Cereals', unit: 'kg', quantity: 850, unitPrice: 2.10, minStockLevel: 200, isProtected: true },
        { name: 'Standard Wheat Flour', sku: 'GR-002', category: 'Grains & Cereals', unit: 'kg', quantity: 600, unitPrice: 1.45, minStockLevel: 150, isProtected: true },
        { name: 'Boneless Beef Chuck', sku: 'PR-001', category: 'Proteins', unit: 'kg', quantity: 420, unitPrice: 8.50, minStockLevel: 120, isProtected: true },
        { name: 'Whole Chicken Breast', sku: 'PR-002', category: 'Proteins', unit: 'kg', quantity: 380, unitPrice: 5.75, minStockLevel: 100, isProtected: true },
        { name: 'Fresh Grade A Eggs', sku: 'PR-003', category: 'Proteins', unit: 'pcs', quantity: 2400, unitPrice: 0.25, minStockLevel: 500, isProtected: true },
        { name: 'Brown Storage Potatoes', sku: 'VG-001', category: 'Vegetables', unit: 'kg', quantity: 75, unitPrice: 0.95, minStockLevel: 150, status: 'Low Stock', isProtected: true },
        { name: 'Red Cooking Onions', sku: 'VG-002', category: 'Vegetables', unit: 'kg', quantity: 320, unitPrice: 0.85, minStockLevel: 100, status: 'In Stock', isProtected: true },
        { name: 'Fresh Roma Tomatoes', sku: 'VG-003', category: 'Vegetables', unit: 'kg', quantity: 0, unitPrice: 1.60, minStockLevel: 80, status: 'Out of Stock', isProtected: true },
        { name: 'Pure Refined Vegetable Oil', sku: 'OL-001', category: 'Oils & Fats', unit: 'L', quantity: 240, unitPrice: 3.20, minStockLevel: 60, isProtected: true },
        { name: 'Pasteurized Whole Milk', sku: 'DR-001', category: 'Dairy', unit: 'L', quantity: 180, unitPrice: 1.30, minStockLevel: 50, isProtected: true },
        { name: 'Cheddar Cheese Blocks', sku: 'DR-002', category: 'Dairy', unit: 'kg', quantity: 95, unitPrice: 6.80, minStockLevel: 30, isProtected: true },
        { name: 'Coarse Iodized Sea Salt', sku: 'SP-001', category: 'Spices & Condiments', unit: 'kg', quantity: 110, unitPrice: 0.60, minStockLevel: 25, isProtected: true },
        { name: 'Black Ground Pepper', sku: 'SP-002', category: 'Spices & Condiments', unit: 'kg', quantity: 45, unitPrice: 12.00, minStockLevel: 10, isProtected: true },
        { name: 'Military Ration Black Tea', sku: 'BV-001', category: 'Beverages', unit: 'boxes', quantity: 120, unitPrice: 4.50, minStockLevel: 30, isProtected: true },
      ]);
      console.log('✅ Baseline inventory items auto-provisioned');
    }

    // 4. Ensure Baseline Meals exist
    const mealsCount = await Meal.countDocuments();
    if (mealsCount === 0) {
      const rice = await InventoryItem.findOne({ sku: 'GR-001' });
      const beef = await InventoryItem.findOne({ sku: 'PR-001' });
      const chicken = await InventoryItem.findOne({ sku: 'PR-002' });
      const onions = await InventoryItem.findOne({ sku: 'VG-002' });
      const oil = await InventoryItem.findOne({ sku: 'OL-001' });

      if (rice && beef && chicken) {
        await Meal.insertMany([
          {
            name: 'Tactical High-Protein Beef & Rice',
            category: 'Lunch',
            preparationInstructions: 'Brown diced beef chuck in vegetable oil. Add braised onions, mix with parboiled basmati rice, simmer for 25 min.',
            estimatedCalories: 780,
            status: 'published',
            isProtected: true,
            ingredients: [
              { itemId: beef._id, quantityPerStudent: 0.20, unit: 'kg' },
              { itemId: rice._id, quantityPerStudent: 0.15, unit: 'kg' },
              { itemId: onions._id, quantityPerStudent: 0.05, unit: 'kg' },
              { itemId: oil._id, quantityPerStudent: 0.02, unit: 'L' },
            ],
            estimatedCostPerStudent: 2.15,
          },
          {
            name: 'Standard Field Chicken Stew',
            category: 'Dinner',
            preparationInstructions: 'Dice chicken breast, sear in large kettles. Simmer with seasonal vegetables and broth for 40 min.',
            estimatedCalories: 650,
            status: 'published',
            isProtected: true,
            ingredients: [
              { itemId: chicken._id, quantityPerStudent: 0.18, unit: 'kg' },
              { itemId: onions._id, quantityPerStudent: 0.06, unit: 'kg' },
              { itemId: oil._id, quantityPerStudent: 0.02, unit: 'L' },
            ],
            estimatedCostPerStudent: 1.85,
          },
        ]);
        console.log('✅ Baseline meals auto-provisioned');
      }
    }

    isProvisioned = true;
  } catch (err) {
    console.error('❌ Error during demo provisioning:', err.message);
  } finally {
    isProvisioning = false;
  }
};

const getDemoAccountsList = () => {
  return DEMO_ACCOUNTS.map((a) => ({
    role: a.role,
    name: a.name,
    email: a.email,
    password: a.password,
    rank: a.rank,
    unit: a.unit,
    badgeColor: a.badgeColor,
    description: a.description,
  }));
};

module.exports = {
  DEMO_ACCOUNTS,
  DEMO_PASSWORD,
  ensureDemoProvisioned,
  getDemoAccountsList,
};
