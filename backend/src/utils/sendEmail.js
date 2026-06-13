import nodemailer from 'nodemailer';
import { logger } from './logger.js';

/**
 * Send an email using Nodemailer
 * @param {Object} options Options object containing { email, subject, message }
 */
export const sendEmail = async (options) => {
  try {
    // Check if credentials exist to prevent crashing if user hasn't set them up yet
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      logger.warn("Skipping email dispatch: EMAIL_USER or EMAIL_PASS is not configured in .env");
      return;
    }

    // 1. Create a transporter
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    // 2. Define the email options
    const mailOptions = {
      from: `EPMS Admin <${process.env.EMAIL_USER}>`,
      to: options.email,
      subject: options.subject,
      text: options.message,
      html: options.html, // Optional HTML version
    };

    // 3. Actually send the email
    await transporter.sendMail(mailOptions);
    logger.info(`Email successfully sent to ${options.email}`);
  } catch (error) {
    logger.error(`Error sending email to ${options.email}: ${error.message}`);
    // We don't throw here so that the employee creation process doesn't completely fail just because of an email error
  }
};
