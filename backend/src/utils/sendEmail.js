import nodemailer from 'nodemailer';
import { logger } from './logger.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const logFilePath = path.join(__dirname, '../../../email-delivery.log');

/**
 * Send an email using Nodemailer (Gmail SMTP)
 * @param {Object} options Options object containing { email, subject, message }
 */
export const sendEmail = async (options) => {
  try {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      const warningMsg = `[${new Date().toISOString()}] WARNING: Skipping email dispatch. EMAIL_USER or EMAIL_PASS not configured in environment variables.\n`;
      fs.appendFileSync(logFilePath, warningMsg);
      logger.warn("Skipping email dispatch: EMAIL_USER or EMAIL_PASS not configured.");
      return;
    }

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      from: `"EPMS System" <${process.env.EMAIL_USER}>`,
      to: options.email,
      subject: options.subject,
      text: options.message,
    };

    const info = await transporter.sendMail(mailOptions);
    
    // Log to file
    const logMsg = `[${new Date().toISOString()}] SUCCESS: Sent to ${options.email} - Response: ${info.response}\n`;
    fs.appendFileSync(logFilePath, logMsg);
    
    logger.info(`Email successfully sent to ${options.email} via SMTP. Response: ${info.response}`);
  } catch (error) {
    // Log to file
    const errorMsg = `[${new Date().toISOString()}] ERROR: Failed to send to ${options.email} - Error: ${error.message}\n`;
    fs.appendFileSync(logFilePath, errorMsg);
    
    logger.error(`Fatal error sending email to ${options.email}: ${error.message}`);
  }
};
