import 'dotenv/config';
import mongoose from 'mongoose';
import { User } from './src/models/User.js';

await mongoose.connect(process.env.MONGODB_URI);
const users = await User.find({}, { password: 0 });
console.log(JSON.stringify(users, null, 2));
await mongoose.disconnect();
