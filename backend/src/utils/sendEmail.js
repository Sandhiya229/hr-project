import nodemailer from 'nodemailer';
import { Resend } from 'resend';
import { logger } from './logger.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const logFilePath = path.join(__dirname, '../../../email-delivery.log');

/**
 * Send an email using Nodemailer (Gmail SMTP) with Resend fallback
 * @param {Object} options Options object containing { email, subject, message }
 */
export const sendEmail = async (options) => {
  // 1. Try Nodemailer (Gmail) if credentials exist (Allows sending to ANY recipient without domain verification, but blocked on Render Free tier)
  if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
    try {
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
      
      const logMsg = `[${new Date().toISOString()}] SUCCESS (Nodemailer): Sent to ${options.email} - Response: ${info.response}\n`;
      fs.appendFileSync(logFilePath, logMsg);
      logger.info(`Email successfully sent to ${options.email} via SMTP. Response: ${info.response}`);
      return;
    } catch (error) {
      const errorMsg = `[${new Date().toISOString()}] WARNING (Nodemailer): SMTP failed for ${options.email} - Error: ${error.message}\n`;
      fs.appendFileSync(logFilePath, errorMsg);
      logger.warn(`Nodemailer SMTP failed to send to ${options.email}: ${error.message}. Trying Resend fallback...`);
    }
  }

  // 2. Fallback to Resend API if API Key exists (Uses HTTP POST which bypasses Render's port blocks)
  if (process.env.RESEND_API_KEY) {
    try {
      const resend = new Resend(process.env.RESEND_API_KEY);

      // Note: Resend onboarding domain onboarding@resend.dev ONLY allows sending to your own registered email address.
      const { data, error } = await resend.emails.send({
        from: 'onboarding@resend.dev',
        to: options.email,
        subject: options.subject,
        text: options.message,
      });

      if (error) {
        const errorMsg = `[${new Date().toISOString()}] ERROR (Resend): Failed to send to ${options.email} - Error: ${error.message}\n`;
        fs.appendFileSync(logFilePath, errorMsg);
        logger.error(`Resend API Error sending to ${options.email}: ${error.message}`);
        return;
      }

      const logMsg = `[${new Date().toISOString()}] SUCCESS (Resend): Sent to ${options.email} - ID: ${data.id}\n`;
      fs.appendFileSync(logFilePath, logMsg);
      logger.info(`Email successfully sent to ${options.email} via Resend. ID: ${data.id}`);
      return;
    } catch (error) {
      const errorMsg = `[${new Date().toISOString()}] ERROR (Resend): Fatal error sending to ${options.email} - Error: ${error.message}\n`;
      fs.appendFileSync(logFilePath, errorMsg);
      logger.error(`Fatal error sending email via Resend to ${options.email}: ${error.message}`);
    }
  }

  logger.warn("Skipping email dispatch: Neither SMTP nor Resend API Key configurations are working/configured.");
};
