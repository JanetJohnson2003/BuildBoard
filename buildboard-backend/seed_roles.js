const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const userSchema = new mongoose.Schema({
  username: String,
  name: String,
  email: { type: String, unique: true },
  password: String,
  role: String,
  emailVerificationToken: String,
});
const User = mongoose.model('User', userSchema);

async function seed() {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/buildboard');
  const salt = await bcrypt.genSalt(10);
  const password = await bcrypt.hash('password123', salt);
  
  await User.updateOne(
    { email: 'admin@buildboard.com' },
    { $set: { username: 'admin_user', name: 'Admin', email: 'admin@buildboard.com', password, role: 'admin' } },
    { upsert: true }
  );

  await User.updateOne(
    { email: 'reviewer@buildboard.com' },
    { $set: { username: 'reviewer_user', name: 'Reviewer', email: 'reviewer@buildboard.com', password, role: 'reviewer' } },
    { upsert: true }
  );
  
  console.log('Seeded roles');
  process.exit(0);
}
seed();
