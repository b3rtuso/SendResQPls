const fs = require('fs');
const path = require('path');

// Helper to safely load the API key without hardcoding it
function getApiKey() {
  // 1. Check process environment first
  if (process.env.GOOGLE_MAPS_API_KEY) return process.env.GOOGLE_MAPS_API_KEY;
  if (process.env.GEMINI_API_KEY) return process.env.GEMINI_API_KEY;

  // 2. Try to read from backend/.env (zero-dependency)
  try {
    const envPath = path.join(__dirname, '../backend/.env');
    if (fs.existsSync(envPath)) {
      const envContent = fs.readFileSync(envPath, 'utf8');
      const mapsMatch = envContent.match(/^GOOGLE_MAPS_API_KEY\s*=\s*["']?([^"'\r\n]+)["']?/m);
      if (mapsMatch && mapsMatch[1]) return mapsMatch[1];
      
      const geminiMatch = envContent.match(/^GEMINI_API_KEY\s*=\s*["']?([^"'\r\n]+)["']?/m);
      if (geminiMatch && geminiMatch[1]) return geminiMatch[1];
    }
  } catch (e) {
    // Ignore read errors
  }
  return null;
}

const apiKey = getApiKey();
const address = 'Gumamela, Balayan, Batangas, Philippines';

async function testGeocode() {
  if (!apiKey) {
    console.error('Error: API Key hindi mahanap. Paki-set ang GEMINI_API_KEY o GOOGLE_MAPS_API_KEY sa backend/.env o sa iyong terminal.');
    return;
  }

  try {
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${apiKey}`;
    const response = await fetch(url);
    const data = await response.json();
    console.log(JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error fetching geocode:', error.message);
  }
}

testGeocode();
