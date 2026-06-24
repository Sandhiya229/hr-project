import 'dotenv/config';
import { sendEmail } from './src/utils/sendEmail.js';

await sendEmail({
    email: process.env.GMAIL_USER,          // send to yourself
    subject: '✅ Gmail API Test',
    message: 'Your Gmail API integration works!',
    fromName: 'HR Project',
});
