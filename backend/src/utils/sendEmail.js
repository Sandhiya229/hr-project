import nodemailer from 'nodemailer';
import { logger } from './logger.js';

/**
 * Send an email using Nodemailer (Gmail SMTP)
 * @param {Object} options Options object containing { email, subject, message }
 */
export const sendEmail = async (options) => {
  try {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      logger.warn("Skipping email dispatch: EMAIL_USER or EMAIL_PASS not configured in .env");
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
    logger.info(`Email successfully sent to ${options.email} via SMTP. Response: ${info.response}`);
  } catch (error) {
    logger.error(`Fatal error sending email to ${options.email}: ${error.message}`);
  }
};
