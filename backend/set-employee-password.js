import 'dotenv/config';
import mongoose from 'mongoose';
import { User } from './src/models/User.js';
import bcrypt from 'bcrypt';

await mongoose.connect(process.env.MONGODB_URI);
const hashedPassword = await bcrypt.hash('Employee@123', 10);
const result = await User.updateOne(
  { email: 'sandhiyaviswanathan2004@gmail.com' },
  { password: hashedPassword }
);
console.log(`Updated ${result.modifiedCount} user(s).`);
await mongoose.disconnect();
