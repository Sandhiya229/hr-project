import 'dotenv/config';
import mongoose from 'mongoose';
import { User } from './src/models/User.js';

await mongoose.connect(process.env.MONGODB_URI);
console.log('Connected to MongoDB');

/*
const existing = await User.findOne({ email: 'shatechxitsolutions@gmail.com' });
if (existing) {
  console.log('Admin user already exists. Email: shatechxitsolutions@gmail.com / Password: devsha12');
} else {
  await User.create({ email: 'shatechxitsolutions@gmail.com', password: 'devsha12', role: 'admin' });
  console.log('✅ Admin user created! Email: shatechxitsolutions@gmail.com / Password: devsha12');
}
*/
console.log('Seed skipped. Use the interactive setup on the login page.');

await mongoose.disconnect();
