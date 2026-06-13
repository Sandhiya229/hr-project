import 'dotenv/config';
import mongoose from 'mongoose';
import { Employee } from './src/models/Employee.js';

await mongoose.connect(process.env.MONGODB_URI);
const employees = await Employee.find({});
console.log(JSON.stringify(employees.map(e => ({ name: e.name, email: e.email })), null, 2));
await mongoose.disconnect();
