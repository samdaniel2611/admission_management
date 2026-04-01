require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Institution = require('./models/Institution');
const AcademicYear = require('./models/AcademicYear');

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB');

  // Create admin user
  const adminExists = await User.findOne({ email: 'admin@edumerge.com' });
  if (!adminExists) {
    await User.create({
      name: 'Super Admin',
      email: 'admin@edumerge.com',
      password: 'Admin@123',
      role: 'admin'
    });
    console.log('✅ Admin user created: admin@edumerge.com / Admin@123');
  }

  // Create officer
  const officerExists = await User.findOne({ email: 'officer@edumerge.com' });
  if (!officerExists) {
    await User.create({
      name: 'Admission Officer',
      email: 'officer@edumerge.com',
      password: 'Officer@123',
      role: 'admission_officer'
    });
    console.log('✅ Officer created: officer@edumerge.com / Officer@123');
  }

  // Create management user
  const mgmtExists = await User.findOne({ email: 'mgmt@edumerge.com' });
  if (!mgmtExists) {
    await User.create({
      name: 'Management User',
      email: 'mgmt@edumerge.com',
      password: 'Mgmt@123',
      role: 'management'
    });
    console.log('✅ Management user created: mgmt@edumerge.com / Mgmt@123');
  }

  // Create academic year
  const yearExists = await AcademicYear.findOne({ year: '2025-26' });
  if (!yearExists) {
    await AcademicYear.create({
      year: '2025-26',
      startDate: new Date('2025-07-01'),
      endDate: new Date('2026-06-30'),
      isActive: true,
      isCurrent: true
    });
    console.log('✅ Academic year 2025-26 created');
  }

  // Create institution
  const instExists = await Institution.findOne({ code: 'REVA' });
  if (!instExists) {
    await Institution.create({
      name: 'Reva University',
      code: 'REVA',
      address: 'Rukmini Knowledge Park, Kattigenahalli, Bangalore',
      phone: '080-46966966',
      email: 'admissions@reva.edu.in',
      website: 'https://reva.edu.in',
      jkTotalLimit: 10
    });
    console.log('✅ Sample institution created');
  }

  console.log('\n🎉 Seed complete! Login credentials:');
  console.log('  Admin:   admin@edumerge.com / Admin@123');
  console.log('  Officer: officer@edumerge.com / Officer@123');
  console.log('  Mgmt:    mgmt@edumerge.com / Mgmt@123');

  await mongoose.disconnect();
}

seed().catch(console.error);
