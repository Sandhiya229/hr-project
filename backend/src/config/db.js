import mongoose from 'mongoose';
import { logger } from '../utils/logger.js';
import { User } from '../models/User.js';

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    logger.info(`MongoDB Connected: ${conn.connection.host}`);
    
    // Auto-seed default admin
    const adminEmail = 'admin@gmail.com';
    const adminPassword = 'shatechx';

    // Delete any other admin accounts to ensure only the default admin exists
    await User.deleteMany({ role: 'admin', email: { $ne: adminEmail } });

    const admin = await User.findOne({ email: adminEmail, role: 'admin' });
    if (!admin) {
      await User.create({
        email: adminEmail,
        password: adminPassword,
        role: 'admin',
        isEmailVerified: true
      });
      logger.info(`✅ Admin created: ${adminEmail}`);
    } else {
      admin.password = adminPassword;
      await admin.save();
      logger.info(`✅ Admin credentials verified: ${adminEmail}`);
    }
  } catch (error) {
    logger.error(`Error connecting to MongoDB: ${error.message}`);
    process.exit(1);
  }
};

export default connectDB;
