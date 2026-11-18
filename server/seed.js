require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const WorkforceRule = require('./models/WorkforceRule');
const InventoryItem = require('./models/InventoryItem');
const Meal = require('./models/Meal');
const DailyPlan = require('./models/DailyPlan');
const SupplyRequest = require('./models/SupplyRequest');
const Notification = require('./models/Notification');
const AuditLog = require('./models/AuditLog');

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // 1. Users
    const defaultAdmin = await User.findOne({ email: 'admin@logista.mil' });
    let adminUser = defaultAdmin;
    if (!defaultAdmin) {
      adminUser = await User.create({
        name: 'System Administrator',
        email: 'admin@logista.mil',
        password: 'Admin@123',
        role: 'Admin',
        rank: 'Colonel',
        unit: 'HQ Command',
        isActive: true,
      });
      console.log('✅ Admin user created: admin@logista.mil / Admin@123');
    }

    const demoUsers = [
      { name: 'Major Hassan Ali', email: 'manager@logista.mil', password: 'Pass@123', role: 'Mezz Manager', rank: 'Major', unit: 'Alpha Battalion' },
      { name: 'Sgt. Fatima Nour', email: 'kitchen@logista.mil', password: 'Pass@123', role: 'Kitchen Supervisor', rank: 'Sergeant', unit: 'Bravo Mess Hall' },
      { name: 'Cpl. Omar Sherif', email: 'store@logista.mil', password: 'Pass@123', role: 'Store Keeper', rank: 'Corporal', unit: 'Logistics Depot' },
    ];

    let managerUser = null;
    let kitchenUser = null;
    let storeUser = null;

    for (const u of demoUsers) {
      let ex = await User.findOne({ email: u.email });
      if (!ex) {
        ex = await User.create(u);
        console.log(`✅ Created: ${u.name} (${u.role})`);
      }
      if (u.role === 'Mezz Manager') managerUser = ex;
      if (u.role === 'Kitchen Supervisor') kitchenUser = ex;
      if (u.role === 'Store Keeper') storeUser = ex;
    }

    // 2. Workforce Rules
    const rulesCount = await WorkforceRule.countDocuments();
    if (rulesCount === 0) {
      await WorkforceRule.insertMany([
        { minStudents: 1, maxStudents: 50, kitchen: 3, distribution: 2, cleaning: 2 },
        { minStudents: 51, maxStudents: 100, kitchen: 5, distribution: 3, cleaning: 3 },
        { minStudents: 101, maxStudents: 200, kitchen: 8, distribution: 5, cleaning: 4 },
        { minStudents: 201, maxStudents: 300, kitchen: 10, distribution: 6, cleaning: 5 },
        { minStudents: 301, maxStudents: 500, kitchen: 14, distribution: 8, cleaning: 6 },
        { minStudents: 501, maxStudents: 9999, kitchen: 20, distribution: 12, cleaning: 8 },
      ]);
      console.log('✅ Workforce rules seeded');
    }

    // 3. Inventory Items
    const itemCount = await InventoryItem.countDocuments();
    let items = [];
    if (itemCount < 5) {
      await InventoryItem.insertMany([
        { name: 'Long Grain Basmati Rice', sku: 'GR-001', category: 'Grains & Cereals', unit: 'kg', quantity: 850, unitPrice: 2.10, minStockLevel: 200 },
        { name: 'Standard Wheat Flour', sku: 'GR-002', category: 'Grains & Cereals', unit: 'kg', quantity: 600, unitPrice: 1.45, minStockLevel: 150 },
        { name: 'Boneless Beef Chuck', sku: 'PR-001', category: 'Proteins', unit: 'kg', quantity: 420, unitPrice: 8.50, minStockLevel: 120 },
        { name: 'Whole Chicken Breast', sku: 'PR-002', category: 'Proteins', unit: 'kg', quantity: 380, unitPrice: 5.75, minStockLevel: 100 },
        { name: 'Fresh Grade A Eggs', sku: 'PR-003', category: 'Proteins', unit: 'pcs', quantity: 2400, unitPrice: 0.25, minStockLevel: 500 },
        { name: 'Brown Storage Potatoes', sku: 'VG-001', category: 'Vegetables', unit: 'kg', quantity: 75, unitPrice: 0.95, minStockLevel: 150, status: 'Low Stock' },
        { name: 'Red Cooking Onions', sku: 'VG-002', category: 'Vegetables', unit: 'kg', quantity: 320, unitPrice: 0.85, minStockLevel: 100, status: 'In Stock' },
        { name: 'Fresh Roma Tomatoes', sku: 'VG-003', category: 'Vegetables', unit: 'kg', quantity: 0, unitPrice: 1.60, minStockLevel: 80, status: 'Out of Stock' },
        { name: 'Pure Refined Vegetable Oil', sku: 'OL-001', category: 'Oils & Fats', unit: 'L', quantity: 240, unitPrice: 3.20, minStockLevel: 60 },
        { name: 'Pasteurized Whole Milk', sku: 'DR-001', category: 'Dairy', unit: 'L', quantity: 180, unitPrice: 1.30, minStockLevel: 50 },
        { name: 'Cheddar Cheese Blocks', sku: 'DR-002', category: 'Dairy', unit: 'kg', quantity: 95, unitPrice: 6.80, minStockLevel: 30 },
        { name: 'Coarse Iodized Sea Salt', sku: 'SP-001', category: 'Spices & Condiments', unit: 'kg', quantity: 110, unitPrice: 0.60, minStockLevel: 25 },
        { name: 'Black Ground Pepper', sku: 'SP-002', category: 'Spices & Condiments', unit: 'kg', quantity: 45, unitPrice: 12.00, minStockLevel: 10 },
        { name: 'Military Ration Black Tea', sku: 'BV-001', category: 'Beverages', unit: 'boxes', quantity: 120, unitPrice: 4.50, minStockLevel: 30 },
      ]);
      console.log('✅ Inventory items seeded (with healthy, low stock, and out of stock states)');
    }
    items = await InventoryItem.find();

    // Helper map
    const itemMap = {};
    items.forEach((it) => { itemMap[it.sku] = it; });

    // 4. Meal Profiles
    const mealCount = await Meal.countDocuments();
    let meals = [];
    if (mealCount < 3 && itemMap['GR-001'] && itemMap['PR-001']) {
      await Meal.insertMany([
        {
          name: 'Tactical Beef Stew & Basmati Rice',
          category: 'Lunch',
          preparationInstructions: 'Brown chuck beef with onions and ground pepper. Simmer with chopped potatoes for 90 minutes. Serve hot over steamed Basmati rice.',
          estimatedCalories: 780,
          estimatedCostPerStudent: 3.45,
          status: 'published',
          createdBy: managerUser?._id || adminUser._id,
          ingredients: [
            { itemId: itemMap['PR-001']._id, quantityPerStudent: 0.25, unit: 'kg' },
            { itemId: itemMap['GR-001']._id, quantityPerStudent: 0.15, unit: 'kg' },
            { itemId: itemMap['VG-001']._id, quantityPerStudent: 0.12, unit: 'kg' },
            { itemId: itemMap['VG-002']._id, quantityPerStudent: 0.05, unit: 'kg' },
            { itemId: itemMap['OL-001']._id, quantityPerStudent: 0.02, unit: 'L' },
          ],
        },
        {
          name: 'High-Protein Breakfast Rations',
          category: 'Breakfast',
          preparationInstructions: 'Scramble fresh eggs with butter and cheddar cheese. Serve alongside toasted wheat flour bread and whole milk.',
          estimatedCalories: 620,
          estimatedCostPerStudent: 1.85,
          status: 'published',
          createdBy: kitchenUser?._id || adminUser._id,
          ingredients: [
            { itemId: itemMap['PR-003']._id, quantityPerStudent: 3, unit: 'pcs' },
            { itemId: itemMap['DR-002']._id, quantityPerStudent: 0.04, unit: 'kg' },
            { itemId: itemMap['DR-001']._id, quantityPerStudent: 0.25, unit: 'L' },
            { itemId: itemMap['GR-002']._id, quantityPerStudent: 0.08, unit: 'kg' },
          ],
        },
        {
          name: 'Roast Herb Chicken & Savory Potatoes',
          category: 'Dinner',
          preparationInstructions: 'Marinate chicken breast with vegetable oil, pepper, and sea salt. Roast with potato wedges at 200C until golden.',
          estimatedCalories: 710,
          estimatedCostPerStudent: 2.90,
          status: 'published',
          createdBy: managerUser?._id || adminUser._id,
          ingredients: [
            { itemId: itemMap['PR-002']._id, quantityPerStudent: 0.28, unit: 'kg' },
            { itemId: itemMap['VG-001']._id, quantityPerStudent: 0.18, unit: 'kg' },
            { itemId: itemMap['OL-001']._id, quantityPerStudent: 0.02, unit: 'L' },
            { itemId: itemMap['SP-001']._id, quantityPerStudent: 0.01, unit: 'kg' },
          ],
        },
        {
          name: 'Field Operation Energy Biscuits & Tea',
          category: 'Snack',
          preparationInstructions: 'High-density baked wheat biscuits accompanied by hot black tea sweetened with standard issue sugar.',
          estimatedCalories: 350,
          estimatedCostPerStudent: 0.95,
          status: 'published',
          createdBy: kitchenUser?._id || adminUser._id,
          ingredients: [
            { itemId: itemMap['GR-002']._id, quantityPerStudent: 0.10, unit: 'kg' },
            { itemId: itemMap['BV-001']._id, quantityPerStudent: 0.02, unit: 'boxes' },
          ],
        },
      ]);
      console.log('✅ Realistic military meal profiles seeded');
    }
    meals = await Meal.find();

    // 5. Daily Plans (Draft, Submitted, Approved)
    const planCount = await DailyPlan.countDocuments();
    if (planCount < 3 && meals.length >= 2) {
      const today = new Date();
      const tomorrow = new Date(Date.now() + 86400000);
      const pastDay = new Date(Date.now() - 86400000);

      // Plan 1: Approved
      const plan1 = await DailyPlan.create({
        planName: 'Battalion Standard Rotation Alpha',
        date: pastDay,
        studentCount: 250,
        meals: [meals[0]._id, meals[1]._id],
        ingredientRequirements: [
          { itemId: itemMap['PR-001']._id, totalQty: 62.5, unit: 'kg' },
          { itemId: itemMap['GR-001']._id, totalQty: 37.5, unit: 'kg' },
          { itemId: itemMap['PR-003']._id, totalQty: 750, unit: 'pcs' },
        ],
        workforceRequirements: { kitchen: 10, distribution: 6, cleaning: 5 },
        estimatedTotalCost: 1325.00,
        budgetStatus: 'Within Budget',
        status: 'approved',
        createdBy: managerUser?._id || adminUser._id,
        approvedBy: adminUser._id,
      });

      // Plan 2: Submitted (Awaiting Approval)
      const plan2 = await DailyPlan.create({
        planName: 'Field Exercise Full Day Provisioning',
        date: today,
        studentCount: 180,
        meals: [meals[1]._id, meals[2]._id, meals[3]._id],
        ingredientRequirements: [
          { itemId: itemMap['PR-002']._id, totalQty: 50.4, unit: 'kg' },
          { itemId: itemMap['PR-003']._id, totalQty: 540, unit: 'pcs' },
          { itemId: itemMap['VG-001']._id, totalQty: 32.4, unit: 'kg' },
        ],
        workforceRequirements: { kitchen: 8, distribution: 5, cleaning: 4 },
        estimatedTotalCost: 1026.00,
        budgetStatus: 'Within Budget',
        status: 'submitted',
        createdBy: managerUser?._id || adminUser._id,
      });

      // Plan 3: Draft
      await DailyPlan.create({
        planName: 'Weekend Light Rations Cycle',
        date: tomorrow,
        studentCount: 80,
        meals: [meals[0]._id],
        ingredientRequirements: [
          { itemId: itemMap['PR-001']._id, totalQty: 20, unit: 'kg' },
          { itemId: itemMap['GR-001']._id, totalQty: 12, unit: 'kg' },
        ],
        workforceRequirements: { kitchen: 5, distribution: 3, cleaning: 3 },
        estimatedTotalCost: 276.00,
        budgetStatus: 'Within Budget',
        status: 'draft',
        createdBy: kitchenUser?._id || adminUser._id,
      });

      // 6. Auto Supply Request for Plan 1
      await SupplyRequest.create({
        dailyPlanId: plan1._id,
        requestedBy: managerUser?._id || adminUser._id,
        reviewedBy: adminUser._id,
        items: [
          { itemId: itemMap['PR-001']._id, quantity: 63 },
          { itemId: itemMap['GR-001']._id, quantity: 38 },
          { itemId: itemMap['PR-003']._id, quantity: 750 },
        ],
        status: 'approved',
        notes: 'Fulfill immediately for morning meal prep line.',
      });

      // Pending Supply Request for Plan 2
      await SupplyRequest.create({
        dailyPlanId: plan2._id,
        requestedBy: kitchenUser?._id || adminUser._id,
        items: [
          { itemId: itemMap['PR-002']._id, quantity: 51 },
          { itemId: itemMap['PR-003']._id, quantity: 540 },
          { itemId: itemMap['VG-001']._id, quantity: 33 },
        ],
        status: 'pending',
        notes: 'Awaiting command authorization before kitchen staging.',
      });

      console.log('✅ Daily plans and supply requisitions seeded');
    }

    // 7. Seed Notifications
    const notifCount = await Notification.countDocuments();
    if (notifCount === 0 && adminUser) {
      await Notification.insertMany([
        {
          userId: adminUser._id,
          message: 'Daily plan "Field Exercise Full Day Provisioning" submitted by Major Hassan Ali requires command authorization.',
          type: 'info',
          isRead: false,
        },
        {
          userId: adminUser._id,
          message: 'Stock Alert: "Fresh Roma Tomatoes" (SKU: VG-003) is completely Out of Stock.',
          type: 'alert',
          isRead: false,
        },
        {
          userId: adminUser._id,
          message: 'Inventory Warning: "Brown Storage Potatoes" has fallen below safety buffer (75 kg remaining).',
          type: 'warning',
          isRead: false,
        },
      ]);
      console.log('✅ Operational notifications seeded');
    }

    // 8. Seed Audit Logs
    const auditCount = await AuditLog.countDocuments();
    if (auditCount === 0 && adminUser) {
      await AuditLog.insertMany([
        {
          userId: adminUser._id,
          action: 'System Initialization',
          module: 'Auth',
          details: { status: 'Database collections initialized with military baseline parameters.' },
          timestamp: new Date(Date.now() - 3600000 * 24),
        },
        {
          userId: storeUser?._id || adminUser._id,
          action: 'Stock Restock',
          module: 'Inventory',
          details: { sku: 'GR-001', type: 'restock', quantity: 250, newQuantity: 850, notes: 'Direct delivery from Central Quartermaster.' },
          timestamp: new Date(Date.now() - 3600000 * 12),
        },
        {
          userId: storeUser?._id || adminUser._id,
          action: 'Stock Issue',
          module: 'Inventory',
          details: { sku: 'PR-001', type: 'issue', quantity: 40, newQuantity: 420, notes: 'Dispatched to Bravo Mess Hall.' },
          timestamp: new Date(Date.now() - 3600000 * 6),
        },
        {
          userId: managerUser?._id || adminUser._id,
          action: 'Create Daily Plan',
          module: 'DailyPlans',
          details: { planName: 'Battalion Standard Rotation Alpha' },
          timestamp: new Date(Date.now() - 3600000 * 5),
        },
      ]);
      console.log('✅ Audit history seeded');
    }

    console.log('\n🎉 Comprehensive military mess seed complete!\n');
    console.log('Demo Logins:');
    console.log('  Admin:               admin@logista.mil   / Admin@123 (HQ Commander)');
    console.log('  Mezz Manager:        manager@logista.mil / Pass@123  (Major Hassan Ali)');
    console.log('  Kitchen Supervisor:  kitchen@logista.mil / Pass@123  (Sgt. Fatima Nour)');
    console.log('  Store Keeper:        store@logista.mil   / Pass@123  (Cpl. Omar Sherif)');
    process.exit(0);
  } catch (err) {
    console.error('Seed error:', err);
    process.exit(1);
  }
};

seed();
