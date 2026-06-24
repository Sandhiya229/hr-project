import 'dotenv/config';
import { google } from 'googleapis';
import open from 'open';
import http from 'http';
import url from 'url';
import querystring from 'querystring';

// Build OAuth2 client from env vars
const oauth2Client = new google.auth.OAuth2(
  process.env.GMAIL_CLIENT_ID,
  process.env.GMAIL_CLIENT_SECRET,
  'http://localhost:3000/oauth2callback'
);

const scopes = ['https://www.googleapis.com/auth/gmail.send'];
const authUrl = oauth2Client.generateAuthUrl({
  access_type: 'offline',
  scope: scopes,
  prompt: 'consent',
});

console.log('🔗 Opening browser for consent…');
await open(authUrl);

const server = http.createServer(async (req, res) => {
  if (req.url?.startsWith('/oauth2callback')) {
    const qs = querystring.parse(url.parse(req.url).query);
    const code = qs.code;
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);
    res.end('✅ You can close this window. Check the console for your refresh token.');
    console.log('\n--- YOUR REFRESH TOKEN ------------------------------------------------');
    console.log(tokens.refresh_token);
    console.log('--- END --------------------------------------------------------------\n');
    server.close();
  }
});
server.listen(3000, () => console.log('🚀 Listening on http://localhost:3000'));
