import { Resend } from 'resend';
import { logger } from './logger.js';

/**
 * Send an email using Resend API
 * @param {Object} options Options object containing { email, subject, message }
 */
export const sendEmail = async (options) => {
  try {
    // Check if API key exists
    if (!process.env.RESEND_API_KEY) {
      logger.warn("Skipping email dispatch: RESEND_API_KEY is not configured in .env");
      return;
    }

    const resend = new Resend(process.env.RESEND_API_KEY);

    // Send the email using Resend
    // NOTE: Without a verified custom domain, Resend forces the "from" address to be onboarding@resend.dev
    // and you can ONLY send emails to the email address you registered your Resend account with.
    const { data, error } = await resend.emails.send({
      from: 'onboarding@resend.dev',
      to: options.email,
      subject: options.subject,
      text: options.message,
    });

    if (error) {
      logger.error(`Resend API Error sending to ${options.email}: ${error.message}`);
      return;
    }

    logger.info(`Email successfully sent to ${options.email} via Resend. ID: ${data.id}`);
  } catch (error) {
    logger.error(`Fatal error sending email to ${options.email}: ${error.message}`);
  }
};
