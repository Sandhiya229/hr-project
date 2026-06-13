import 'dotenv/config';
import mongoose from 'mongoose';
import { User } from './src/models/User.js';

await mongoose.connect(process.env.MONGODB_URI);
console.log('Connected to MongoDB');

/*
const existing = await User.findOne({ email: 'admin@company.com' });
if (existing) {
  console.log('Admin user already exists. Email: admin@company.com / Password: Admin@123');
} else {
  await User.create({ email: 'admin@company.com', password: 'Admin@123', role: 'admin' });
  console.log('✅ Admin user created! Email: admin@company.com / Password: Admin@123');
}
*/
console.log('Seed skipped. Use the interactive setup on the login page.');

await mongoose.disconnect();
