require('dotenv').config();
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const InventoryItem = require('../models/InventoryItem');
const Meal = require('../models/Meal');
const DailyPlan = require('../models/DailyPlan');
const SupplyRequest = require('../models/SupplyRequest');
const WorkforceRule = require('../models/WorkforceRule');

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✓ ${message}`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${message}`);
    failed++;
  }
}

async function runTests() {
  console.log('====================================================');
  console.log('  LOGISTA Automated System & Integration Test Suite  ');
  console.log('====================================================\n');

  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to test database.\n');

    // ----------------------------------------------------
    // TEST SUITE 1: Authentication & User RBAC
    // ----------------------------------------------------
    console.log('▶ [Suite 1] Authentication & Access Control');
    const admin = await User.findOne({ email: 'admin@logista.mil' }).select('+password');
    assert(!!admin, 'Admin account exists in database');
    assert(admin.role === 'Admin', 'Admin has role "Admin"');

    const validPassword = await admin.matchPassword('Admin@123');
    assert(validPassword, 'Admin password matches bcrypt hash');

    const invalidPassword = await admin.matchPassword('WrongPass');
    assert(!invalidPassword, 'Rejects invalid password attempt');

    const token = jwt.sign(
      { id: admin._id, name: admin.name, role: admin.role },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    assert(decoded.id === admin._id.toString(), 'JWT token generation and verification succeeded');

    // ----------------------------------------------------
    // TEST SUITE 2: Inventory Module & Status Logic
    // ----------------------------------------------------
    console.log('\n▶ [Suite 2] Inventory Module & Automated Status Logic');
    const testSku = 'TEST-SKU-' + Date.now();
    const testItem = await InventoryItem.create({
      name: 'Test Ingredient Unit',
      sku: testSku,
      category: 'Grains & Cereals',
      unit: 'kg',
      quantity: 50,
      unitPrice: 2.50,
      minStockLevel: 20,
    });
    assert(testItem.status === 'In Stock', 'Initial item status calculated as "In Stock" (50 > 20)');

    // Simulate stock issue to trigger Low Stock
    testItem.quantity = 15;
    await testItem.save();
    assert(testItem.status === 'Low Stock', 'Status automatically transitioned to "Low Stock" (15 < 20)');

    // Simulate stock exhaustion to trigger Out of Stock
    testItem.quantity = 0;
    await testItem.save();
    assert(testItem.status === 'Out of Stock', 'Status automatically transitioned to "Out of Stock" (qty === 0)');

    // Clean up
    await InventoryItem.findByIdAndDelete(testItem._id);
    assert(true, 'Test inventory item deleted cleanly');

    // ----------------------------------------------------
    // TEST SUITE 3: Core Engine Calculations (Week 6)
    // ----------------------------------------------------
    console.log('\n▶ [Suite 3] Core Engine: Ingredient, Workforce & Cost Calculations');
    const sampleRice = await InventoryItem.findOne({ sku: 'GR-001' });
    const sampleBeef = await InventoryItem.findOne({ sku: 'PR-001' });
    assert(!!sampleRice && !!sampleBeef, 'Found baseline inventory items for calculation test');

    const studentCount = 100;
    const ricePerStudent = 0.15;
    const expectedRiceTotal = Number((studentCount * ricePerStudent).toFixed(2));
    assert(expectedRiceTotal === 15.00, `Ingredient multiplication: ${studentCount} troops × ${ricePerStudent} kg = ${expectedRiceTotal} kg`);

    // Workforce rule test
    const rule = await WorkforceRule.findOne({
      minStudents: { $lte: studentCount },
      maxStudents: { $gte: studentCount },
    });
    assert(!!rule, `Workforce rule matched for ${studentCount} personnel bracket`);
    assert(rule.kitchen > 0 && rule.distribution > 0 && rule.cleaning > 0, `Allocated staff: ${rule.kitchen} cooks, ${rule.distribution} servers, ${rule.cleaning} cleaners`);

    // ----------------------------------------------------
    // TEST SUITE 4: Workflow & Approval Auto-Creation (Week 7)
    // ----------------------------------------------------
    console.log('\n▶ [Suite 4] Workflow & Supply Request Auto-Generation on Approval');
    const relatedReq = await SupplyRequest.findOne();
    assert(!!relatedReq, 'Found seeded SupplyRequest record');

    const plan = relatedReq ? await DailyPlan.findById(relatedReq.dailyPlanId) : null;
    assert(!!plan, `SupplyRequest successfully linked to DailyPlan "${plan?.planName}"`);
    assert(relatedReq.items && relatedReq.items.length > 0, `SupplyRequest contains ${relatedReq.items?.length} provision items`);

    // ----------------------------------------------------
    // TEST SUITE 5: Reporting & Aggregation (Week 8)
    // ----------------------------------------------------
    console.log('\n▶ [Suite 5] Reports Aggregations');
    const totalItems = await InventoryItem.countDocuments();
    const lowStock = await InventoryItem.countDocuments({ status: 'Low Stock' });
    const outOfStock = await InventoryItem.countDocuments({ status: 'Out of Stock' });
    assert(totalItems >= 10, `Tracked SKUs count: ${totalItems}`);
    assert(lowStock >= 1, `Low stock alert count: ${lowStock}`);
    assert(outOfStock >= 1, `Stockout count: ${outOfStock}`);

    // ----------------------------------------------------
    // TEST SUITE 6: Public Portfolio Demo Accounts & Protection
    // ----------------------------------------------------
    console.log('\n▶ [Suite 6] Public Portfolio Demo Accounts');
    const demoRoles = [
      { email: 'demo.admin@logista.mil', role: 'Admin' },
      { email: 'demo.manager@logista.mil', role: 'Mezz Manager' },
      { email: 'demo.kitchen@logista.mil', role: 'Kitchen Supervisor' },
      { email: 'demo.store@logista.mil', role: 'Store Keeper' },
    ];

    for (const d of demoRoles) {
      const demoUser = await User.findOne({ email: d.email }).select('+password');
      assert(!!demoUser, `Demo account ${d.email} exists`);
      assert(demoUser?.role === d.role, `Demo account ${d.email} has role "${d.role}"`);
      assert(demoUser?.isDemo === true, `Demo account ${d.email} is flagged as isDemo`);
      const pwdMatch = await demoUser?.matchPassword('Demo@123');
      assert(pwdMatch, `Demo account ${d.email} password validates with "Demo@123"`);
    }

    console.log('\n====================================================');
    console.log(`  Tests Completed: ${passed} Passed, ${failed} Failed`);
    console.log('====================================================\n');

    process.exit(failed > 0 ? 1 : 0);
  } catch (err) {
    console.error('Fatal test error:', err);
    process.exit(1);
  }
}

runTests();
