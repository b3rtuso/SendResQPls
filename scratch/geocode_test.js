const apiKey = 'AIzaSyDy3_ZhuZ8iQKF9Ew9Dzd_P9pBv3tN5B90';
const address = 'Gumamela, Balayan, Batangas, Philippines';

async function testGeocode() {
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
