import { google } from 'googleapis';
import { logger } from './logger.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Resolve __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const logFilePath = path.join(__dirname, '../../../email-delivery.log');

/**
 * Send an email using Gmail API (OAuth2).
 * Required environment variables:
 *   GMAIL_CLIENT_ID, GMAIL_CLIENT_SECRET, GMAIL_REFRESH_TOKEN, GMAIL_USER
 * @param {Object} options - { email, subject, message, fromName (optional) }
 */
export const sendEmail = async (options) => {
  console.log(`📧 Email Request: Attempting to send email to ${options.email}`);

  const { GMAIL_CLIENT_ID, GMAIL_CLIENT_SECRET, GMAIL_REFRESH_TOKEN, GMAIL_USER } = process.env;
  if (!GMAIL_CLIENT_ID || !GMAIL_CLIENT_SECRET || !GMAIL_REFRESH_TOKEN || !GMAIL_USER) {
    const errMsg = `[${new Date().toISOString()}] ERROR (Config): Missing Gmail env vars\n`;
    fs.appendFileSync(logFilePath, errMsg);
    console.error('❌ Missing Gmail configuration');
    logger.error('Missing Gmail environment variables');
    return;
  }

  // Initialise OAuth2 client
  const oauth2Client = new google.auth.OAuth2(
    GMAIL_CLIENT_ID,
    GMAIL_CLIENT_SECRET,
    'urn:ietf:wg:oauth:2.0:oob' // redirect not needed for server‑side flow
  );
  oauth2Client.setCredentials({ refresh_token: GMAIL_REFRESH_TOKEN });

  // Gmail client
  const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

  // Build RFC‑822 raw message
  const fromHeader = options.fromName ? `${options.fromName} <${GMAIL_USER}>` : GMAIL_USER;
  const rawMessage = [
    `From: ${fromHeader}`,
    `To: ${options.email}`,
    `Subject: ${options.subject}`,
    'Content-Type: text/plain; charset="UTF-8"',
    '',
    `${options.message}`,
  ].join('\n');

  // Base64url encode as required by Gmail API
  const encodedMessage = Buffer.from(rawMessage)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');

  try {
    const res = await gmail.users.messages.send({
      userId: 'me',
      requestBody: { raw: encodedMessage },
    });
    const logMsg = `[${new Date().toISOString()}] SUCCESS (Gmail API): Sent to ${options.email} - ID: ${res.data.id}\n`;
    fs.appendFileSync(logFilePath, logMsg);
    console.log(`✅ SUCCESS: Email sent via Gmail API (ID: ${res.data.id})`);
    logger.info(`Email sent via Gmail API to ${options.email} – ID ${res.data.id}`);
  } catch (error) {
    const errMsg = `[${new Date().toISOString()}] ERROR (Gmail API): ${error.message}\n`;
    fs.appendFileSync(logFilePath, errMsg);
    console.error('❌ Gmail API send error:', error.message);
    logger.error(`Gmail API send error for ${options.email}: ${error.message}`);
    throw error;
  }
};
