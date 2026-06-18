import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { User } from '../models/User.js';
import { Employee } from '../models/Employee.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendEmail } from '../utils/sendEmail.js';
import { logger } from '../utils/logger.js';
import { z } from 'zod';

const generateAccessToken = (userId, role) => {
  return jwt.sign(
    { _id: userId, role },
    process.env.JWT_SECRET,
    { expiresIn: '1d' }
  );
};

// Zod schemas for validation
const loginSchema = z.object({
  email: z.string().min(1, "Email or username is required"),
  password: z.string().min(1, "Password is required"),
});

const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

const resetPasswordSchema = z.object({
  token: z.string().min(1),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

const adminSetupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export const loginUser = asyncHandler(async (req, res) => {
  const result = loginSchema.safeParse(req.body);
  if (!result.success) {
    throw new ApiError(400, "Validation failed", result.error.errors);
  }

  const { email, password } = result.data;

  const user = await User.findOne({ email });
  if (!user) {
    throw new ApiError(404, "User does not exist");
  }

  if (!user.password) {
    throw new ApiError(401, "Please use Google login or reset your password");
  }

  const isPasswordValid = await user.comparePassword(password);
  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid credentials");
  }

  const accessToken = generateAccessToken(user._id, user.role);

  let employeeDetails = null;
  if (user.role === 'employee') {
    employeeDetails = await Employee.findOne({ user: user._id });
  }

  const loggedInUser = {
    _id: user._id,
    email: user.email,
    role: user.role,
    employeeData: employeeDetails
  };

  const options = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .json(new ApiResponse(200, { user: loggedInUser }, "User logged in successfully"));
});

export const logoutUser = asyncHandler(async (req, res) => {
  const options = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    path: "/"
  };

  return res
    .status(200)
    .clearCookie("accessToken", options)
    .json(new ApiResponse(200, {}, "User logged out"));
});

export const getCurrentUser = asyncHandler(async (req, res) => {
  let employeeDetails = null;
  if (req.user.role === 'employee') {
    employeeDetails = await Employee.findOne({ user: req.user._id });
  }

  const currentUserData = {
    _id: req.user._id,
    email: req.user.email,
    role: req.user.role,
    employeeData: employeeDetails
  };

  return res
    .status(200)
    .json(new ApiResponse(200, { user: currentUserData }, "Current user fetched successfully"));
});

export const forgotPassword = asyncHandler(async (req, res) => {
  const result = forgotPasswordSchema.safeParse(req.body);
  if (!result.success) {
    throw new ApiError(400, "Validation failed", result.error.errors);
  }

  const { email } = result.data;

  const user = await User.findOne({ email });
  if (!user) {
    // Don't reveal if user exists or not for security
    throw new ApiError(404, "If this email exists in our system, you will receive a password reset link");
  }

  // Generate password reset token
  const resetToken = user.generatePasswordResetToken();
  await user.save();

  // Create reset password link
  const resetPasswordUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;

  const emailMessage = `
Hi there,

We received a request to reset your password. Click the link below to create a new password:

${resetPasswordUrl}

⏰ This link expires in 15 minutes.

If you didn't request this, you can ignore this email and your password will remain unchanged.

---
Employee Management Portal
  `;

  // For development: Log the reset token to console/server logs
  if (process.env.NODE_ENV === 'development') {
    console.log('🔐 PASSWORD RESET TOKEN (Development Mode Only):');
    console.log(`Email: ${user.email}`);
    console.log(`Reset Token: ${resetToken}`);
    console.log(`Reset Link: ${resetPasswordUrl}`);
    console.log('---');
  }

  try {
    await sendEmail({
      email: user.email,
      subject: "Reset Your Password",
      message: emailMessage,
    });

    return res
      .status(200)
      .json(new ApiResponse(200, 
        { 
          devToken: process.env.NODE_ENV === 'development' ? resetToken : undefined,
          message: "If an account exists with this email, a password reset link has been sent"
        }, 
        "Check your email for password reset instructions"
      ));
  } catch (error) {
    logger.error(`Email sending error: ${error.message}`);
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();
    
    // In development, still allow reset token to be shown
    if (process.env.NODE_ENV === 'development') {
      return res
        .status(200)
        .json(new ApiResponse(200, 
          { 
            devToken: resetToken,
            message: "Email failed to send (development mode). Use token below:"
          }, 
          "Development Mode: Use the token to reset password"
        ));
    }
    
    throw new ApiError(500, "Failed to send reset email. Please try again later.");
  }
});

export const resetPassword = asyncHandler(async (req, res) => {
  const result = resetPasswordSchema.safeParse(req.body);
  if (!result.success) {
    throw new ApiError(400, "Validation failed", result.error.errors);
  }

  const { token, password } = result.data;

  // Hash the token to compare with stored token
  const passwordResetToken = crypto.createHash('sha256').update(token).digest('hex');

  const user = await User.findOne({
    passwordResetToken,
    passwordResetExpires: { $gt: Date.now() }
  });

  if (!user) {
    throw new ApiError(400, "Invalid or expired reset token");
  }

  // Set new password
  user.password = password;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  user.isEmailVerified = true;
  await user.save();

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password reset successfully. You can now login with your new password."));
});

export const googleAuthCallback = asyncHandler(async (req, res) => {
  const { email, name, googleId } = req.body;

  let user = await User.findOne({ email });
  
  if (!user) {
    // Create new user with Google OAuth
    user = await User.create({
      email,
      googleId,
      isEmailVerified: true,
      role: 'employee'
    });
  } else {
    // Link Google ID if not already linked
    if (!user.googleId) {
      user.googleId = googleId;
      user.isEmailVerified = true;
      await user.save();
    }
  }

  const accessToken = generateAccessToken(user._id, user.role);

  let employeeDetails = null;
  if (user.role === 'employee') {
    employeeDetails = await Employee.findOne({ user: user._id });
  }

  const loggedInUser = {
    _id: user._id,
    email: user.email,
    role: user.role,
    employeeData: employeeDetails
  };

  const options = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .json(new ApiResponse(200, { user: loggedInUser }, "Google login successful"));
});

export const checkAdminSetup = asyncHandler(async (req, res) => {
  const adminExists = await User.findOne({ role: 'admin' });
  return res
    .status(200)
    .json(new ApiResponse(200, { isSetup: !!adminExists }, "Admin setup status checked"));
});

export const setupAdmin = asyncHandler(async (req, res) => {
  const adminExists = await User.findOne({ role: 'admin' });
  if (adminExists) {
    throw new ApiError(400, "Admin is already setup. Please login.");
  }

  const result = adminSetupSchema.safeParse(req.body);
  if (!result.success) {
    throw new ApiError(400, "Validation failed", result.error.errors);
  }

  const { email, password } = result.data;

  const admin = await User.create({
    email,
    password,
    role: 'admin',
    isEmailVerified: true
  });

  return res
    .status(201)
    .json(new ApiResponse(201, { email: admin.email }, "Admin setup successfully. You can now login."));
});
