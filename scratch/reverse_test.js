async function testReverse() {
  try {
    const url = 'https://nominatim.openstreetmap.org/reverse?lat=13.9180&lon=120.7080&format=json';
    const response = await fetch(url, {
      headers: { 'User-Agent': 'DisasterIncidentReportingSystem/1.0' }
    });
    const data = await response.json();
    console.log(JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error reverse geocoding:', error.message);
  }
}

testReverse();
