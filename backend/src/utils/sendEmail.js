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
  console.log(`📧 Email Request: Attempting to send email to ${options.email}`);
  console.log(`   EMAIL_USER configured: ${!!process.env.EMAIL_USER}`);
  console.log(`   EMAIL_PASS configured: ${!!process.env.EMAIL_PASS}`);
  console.log(`   RESEND_API_KEY configured: ${!!process.env.RESEND_API_KEY}`);

  // 1. Try Nodemailer (Gmail) if credentials exist
  if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
    try {
      console.log(`🔄 Attempting Nodemailer (Gmail SMTP)...`);
      const transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 587,  // TLS port (instead of 465 SSL)
        secure: false,  // TLS not SSL
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
        connectionTimeout: 10000,
        socketTimeout: 10000,
      });

      const mailOptions = {
        from: `"EPMS System" <${process.env.EMAIL_USER}>`,
        to: options.email,
        subject: options.subject,
        text: options.message,
      };

      console.log(`⏳ Sending mail (10s timeout)...`);
      const info = await Promise.race([
        transporter.sendMail(mailOptions),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('SMTP sendMail timeout after 10 seconds')), 10000)
        )
      ]);
      
      const logMsg = `[${new Date().toISOString()}] SUCCESS (Nodemailer): Sent to ${options.email} - Response: ${info.response}\n`;
      fs.appendFileSync(logFilePath, logMsg);
      console.log(`✅ SUCCESS: Email sent to ${options.email} via Gmail SMTP`);
      console.log(`   Response: ${info.response}`);
      logger.info(`Email successfully sent to ${options.email} via SMTP. Response: ${info.response}`);
      return;
    } catch (error) {
      const errorMsg = `[${new Date().toISOString()}] WARNING (Nodemailer): SMTP failed for ${options.email} - Error: ${error.message}\n`;
      fs.appendFileSync(logFilePath, errorMsg);
      console.log(`⚠️  Nodemailer SMTP Error for ${options.email}:`);
      console.log(`   Error: ${error.message}`);
      logger.warn(`Nodemailer SMTP failed to send to ${options.email}: ${error.message}. Trying Resend fallback...`);
    }
  }

  // 2. Fallback to Resend API if API Key exists
  if (process.env.RESEND_API_KEY) {
    try {
      console.log(`🔄 Attempting Resend API...`);
      const resend = new Resend(process.env.RESEND_API_KEY);

      const { data, error } = await resend.emails.send({
        from: 'onboarding@resend.dev',
        to: options.email,
        subject: options.subject,
        text: options.message,
      });

      if (error) {
        const errorMsg = `[${new Date().toISOString()}] ERROR (Resend): Failed to send to ${options.email} - Error: ${JSON.stringify(error)}\n`;
        fs.appendFileSync(logFilePath, errorMsg);
        console.log(`❌ Resend API Error for ${options.email}:`);
        console.log(`   Error: ${JSON.stringify(error)}`);
        logger.error(`Resend API Error sending to ${options.email}: ${JSON.stringify(error)}`);
        return;
      }

      const logMsg = `[${new Date().toISOString()}] SUCCESS (Resend): Sent to ${options.email} - ID: ${data.id}\n`;
      fs.appendFileSync(logFilePath, logMsg);
      console.log(`✅ SUCCESS: Email sent to ${options.email} via Resend`);
      console.log(`   Message ID: ${data.id}`);
      logger.info(`Email successfully sent to ${options.email} via Resend. ID: ${data.id}`);
      return;
    } catch (error) {
      const errorMsg = `[${new Date().toISOString()}] ERROR (Resend): Fatal error sending to ${options.email} - Error: ${error.message}\n`;
      fs.appendFileSync(logFilePath, errorMsg);
      console.log(`❌ FATAL Resend Error for ${options.email}:`);
      console.log(`   Error: ${error.message}`);
      logger.error(`Fatal error sending email via Resend to ${options.email}: ${error.message}`);
    }
  }

  // 3. No email service configured
  const noConfigMsg = `[${new Date().toISOString()}] SKIP: No email configuration for ${options.email}\n`;
  fs.appendFileSync(logFilePath, noConfigMsg);
  console.log(`⚠️  Email NOT sent to ${options.email}`);
  console.log(`   Reason: Neither SMTP nor Resend API Key configured`);
  logger.warn("Skipping email dispatch: Neither SMTP nor Resend API Key configurations are working/configured.");
};
