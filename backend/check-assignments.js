import 'dotenv/config';
import mongoose from 'mongoose';
import { Project } from './src/models/Project.js';

await mongoose.connect(process.env.MONGODB_URI);
const projects = await Project.find({}).populate('assignedEmployees', 'name email');
console.log(JSON.stringify(projects, null, 2));
await mongoose.disconnect();
