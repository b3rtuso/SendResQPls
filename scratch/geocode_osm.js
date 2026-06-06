import fs from 'fs';

const BARANGAYS = [
  'Brgy. 1 (Poblacion)',
  'Brgy. 2 (Poblacion)',
  'Brgy. 3 (Poblacion)',
  'Brgy. 4 (Poblacion)',
  'Brgy. 5 (Poblacion)',
  'Brgy. 6 (Poblacion)',
  'Brgy. 7 (Poblacion)',
  'Brgy. 8 (Poblacion)',
  'Brgy. 9 (Poblacion)',
  'Brgy. 10 (Poblacion)',
  'Brgy. 11 (Poblacion)',
  'Brgy. 12 (Poblacion)',
  'Baclaran',
  'Navotas',
  'Duhatan',
  'Malalay',
  'Sukol',
  'Palincaro',
  'Munting Tubig',
  'Carenahan',
  'Lagnas',
  'Dalig',
  'Calan',
  'Caloocan',
  'Durungao',
  'Palikpikan',
  'Tactac',
  'Taludtud',
  'Calzada',
  'Canda',
  'Caybunga',
  'Cayponce',
  'Dilao',
  'Gimalas',
  'Gumamela',
  'Langgangan',
  'Lucban Pook',
  'Lucban Putol',
  'Magabe',
  'Patugo',
  'Pooc',
  'Sambat',
  'Sampaga',
  'San Juan',
  'San Piro',
  'Santol',
  'Tanggoy',
  'Dao',
  'Lanatan'
];

async function geocodeAll() {
  const results = [];
  for (const name of BARANGAYS) {
    const query = `${name}, Balayan, Batangas, Philippines`;
    try {
      console.log(`Geocoding: ${query}...`);
      const response = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1`, {
        headers: {
          'User-Agent': 'DisasterIncidentReportingSystem/1.0'
        }
      });
      const data = await response.json();
      if (data && data.length > 0) {
        const item = data[0];
        console.log(`  Found: ${item.display_name} -> (${item.lat}, ${item.lon})`);
        results.push({ name, lat: parseFloat(item.lat), lng: parseFloat(item.lon) });
      } else {
        console.log(`  Not found. Trying simpler query...`);
        const simplerQuery = `${name.replace(/\s*\(Poblacion\)/i, '')}, Balayan, Batangas`;
        const res2 = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(simplerQuery)}&format=json&limit=1`, {
          headers: {
            'User-Agent': 'DisasterIncidentReportingSystem/1.0'
          }
        });
        const d2 = await res2.json();
        if (d2 && d2.length > 0) {
          const item = d2[0];
          console.log(`  Found: ${item.display_name} -> (${item.lat}, ${item.lon})`);
          results.push({ name, lat: parseFloat(item.lat), lng: parseFloat(item.lon) });
        } else {
          console.warn(`  ❌ FAILED to geocode: ${name}`);
          results.push({ name, lat: null, lng: null });
        }
      }
      // Delay to respect Nominatim's usage policy
      await new Promise(r => setTimeout(r, 1000));
    } catch (err) {
      console.error(`Error geocoding ${name}:`, err.message);
      results.push({ name, lat: null, lng: null });
    }
  }
  fs.writeFileSync('scratch/geocoded_barangays.json', JSON.stringify(results, null, 2));
  console.log('Done geocoding all barangays.');
}

geocodeAll();
