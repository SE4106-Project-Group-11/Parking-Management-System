// scripts/fixViolationUserIds.js
// Run this script to update all violation documents to use the correct nonemployee userId

const mongoose = require('mongoose');
const Violation = require('../models/Violation');
const NonEmployee = require('../models/NonEmployee');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/CarPark';

async function fixUserIds() {
  await mongoose.connect(MONGO_URI);

  // Find the correct nonemployee user
  const nonEmployee = await NonEmployee.findOne({ email: 'vsrrajakaruana@gmail.com' });
  if (!nonEmployee) {
    console.error('NonEmployee not found!');
    process.exit(1);
  }

  // Update all violations for this user
  const result = await Violation.updateMany(
    { userType: 'nonemployee' },
    { $set: { userId: nonEmployee._id } }
  );

  console.log(`Updated ${result.modifiedCount || result.nModified} violation(s) to use userId: ${nonEmployee._id}`);
  await mongoose.disconnect();
}

fixUserIds().catch(err => {
  console.error('Error updating violation userIds:', err);
  process.exit(1);
});
