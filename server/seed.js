require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const WorkforceRule = require('./models/WorkforceRule');

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // Create default admin
    const existing = await User.findOne({ email: 'admin@logista.mil' });
    if (!existing) {
      await User.create({
        name: 'System Administrator',
        email: 'admin@logista.mil',
        password: 'Admin@123',
        role: 'Admin',
        rank: 'Colonel',
        unit: 'HQ Unit',
        isActive: true,
      });
      console.log('✅ Admin user created: admin@logista.mil / Admin@123');
    } else {
      console.log('ℹ️  Admin already exists');
    }

    // Create demo users
    const demoUsers = [
      { name: 'Major Hassan Ali',     email: 'manager@logista.mil',    password: 'Pass@123', role: 'Mezz Manager',       rank: 'Major',     unit: 'Alpha Company' },
      { name: 'Sgt. Fatima Nour',     email: 'kitchen@logista.mil',    password: 'Pass@123', role: 'Kitchen Supervisor', rank: 'Sergeant',  unit: 'Bravo Company' },
      { name: 'Cpl. Omar Sherif',     email: 'store@logista.mil',      password: 'Pass@123', role: 'Store Keeper',       rank: 'Corporal',  unit: 'Support Unit'  },
    ];

    for (const u of demoUsers) {
      const ex = await User.findOne({ email: u.email });
      if (!ex) {
        await User.create(u);
        console.log(`✅ Created: ${u.name} (${u.role})`);
      }
    }

    // Seed workforce rules
    const rulesCount = await WorkforceRule.countDocuments();
    if (rulesCount === 0) {
      await WorkforceRule.insertMany([
        { minStudents: 1,   maxStudents: 50,  kitchen: 3, distribution: 2, cleaning: 2 },
        { minStudents: 51,  maxStudents: 100, kitchen: 5, distribution: 3, cleaning: 3 },
        { minStudents: 101, maxStudents: 200, kitchen: 8, distribution: 5, cleaning: 4 },
        { minStudents: 201, maxStudents: 300, kitchen: 10, distribution: 6, cleaning: 5 },
        { minStudents: 301, maxStudents: 500, kitchen: 14, distribution: 8, cleaning: 6 },
        { minStudents: 501, maxStudents: 9999, kitchen: 20, distribution: 12, cleaning: 8 },
      ]);
      console.log('✅ Workforce rules seeded');
    }

    console.log('\n🎉 Seed complete!\n');
    console.log('Login credentials:');
    console.log('  Admin:    admin@logista.mil  / Admin@123');
    console.log('  Manager:  manager@logista.mil / Pass@123');
    console.log('  Kitchen:  kitchen@logista.mil / Pass@123');
    console.log('  Store:    store@logista.mil   / Pass@123');
    process.exit(0);
  } catch (err) {
    console.error('Seed error:', err);
    process.exit(1);
  }
};

seed();
