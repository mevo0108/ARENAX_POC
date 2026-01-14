import 'dotenv/config';
import axios from 'axios';

const LEECHES_API_URL = process.env.LEECHES_API_URL || 'https://lichess.org';
const LEECHES_API_KEY = process.env.LEECHES_API_KEY;

if (!LEECHES_API_KEY) {
  console.error('LEECHES_API_KEY not set. Copy .env.example to .env or set the environment variable.');
  process.exit(2);
}

const endpoint = `${LEECHES_API_URL.replace(/\/$/, '')}/api/account`;

console.log(`Checking Lichess endpoint: ${endpoint}`);

try {
  const res = await axios.get(endpoint, {
    headers: {
      Authorization: `Bearer ${LEECHES_API_KEY}`,
      Accept: 'application/json'
    },
    timeout: 5000
  });

  console.log('Status:', res.status);
  console.log('Response sample:', JSON.stringify(res.data, null, 2));
} catch (err) {
  if (err.response) {
    console.error('HTTP error:', err.response.status, err.response.statusText);
    try { console.error('Body:', JSON.stringify(err.response.data)); } catch(e) {}
  } else {
    console.error('Request error:', err.message);
  }
  process.exit(1);
}
