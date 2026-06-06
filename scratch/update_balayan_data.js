import fs from 'fs';

const geocoded = JSON.parse(fs.readFileSync('scratch/geocoded_barangays.json', 'utf8'));
let content = fs.readFileSync('frontend/src/data/balayan-data.ts', 'utf8');

// 1. Update Bounds
content = content.replace(/north:\s*13\.980/g, 'north: 14.050');
content = content.replace(/south:\s*13\.080|south:\s*13\.905/g, 'south: 13.880');
content = content.replace(/east:\s*120\.785/g, 'east:  120.820');
content = content.replace(/west:\s*120\.665/g, 'west:  120.650');

// 2. Loop and replace each barangay's coordinates
for (const b of geocoded) {
  if (b.name === 'Palincaro') {
    // We will delete Palincaro later
    continue;
  }
  if (b.lat === null || b.lng === null) {
    console.warn(`Skipping missing coordinates for ${b.name}`);
    continue;
  }

  // Create a regex to match the barangay definition.
  // Example: { name: 'Brgy. 1 (Poblacion)',  lat: 13.9320, lng: 120.7296, riskProfile: { ...URBAN_PROFILE } }
  // We match { name: 'Brgy. 1 (Poblacion)',  lat: SOME_FLOAT, lng: SOME_FLOAT
  // Or: { name: "Brgy. 1 (Poblacion)",  lat: SOME_FLOAT, lng: SOME_FLOAT
  const escapedName = b.name.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
  const regex = new RegExp(`(\\{\\s*name:\\s*['"]${escapedName}['"],\\s*lat:\\s*)[0-9.-]+(,\\s*lng:\\s*)[0-9.-]+`, 'g');
  
  const formattedLat = b.lat.toFixed(4);
  const formattedLng = b.lng.toFixed(4);
  
  if (regex.test(content)) {
    content = content.replace(regex, `$1${formattedLat}$2${formattedLng}`);
    console.log(`Updated ${b.name} coordinates to (${formattedLat}, ${formattedLng})`);
  } else {
    // Let's try matching multiline or slightly different layout if any
    const regex2 = new RegExp(`(name:\\s*['"]${escapedName}['"],\\s*lat:\\s*)[0-9.-]+(,\\s*lng:\\s*)[0-9.-]+`, 'g');
    if (regex2.test(content)) {
      content = content.replace(regex2, `$1${formattedLat}$2${formattedLng}`);
      console.log(`Updated ${b.name} (variant) to (${formattedLat}, ${formattedLng})`);
    } else {
      console.error(`Could not find barangay in file: ${b.name}`);
    }
  }
}

// 3. Remove Palincaro line entirely
// Let's find the line containing "Palincaro" and remove it.
const lines = content.split('\n');
const filteredLines = lines.filter(line => !line.includes("'Palincaro'"));
content = filteredLines.join('\n');
console.log('Removed Palincaro from the list of barangays.');

fs.writeFileSync('frontend/src/data/balayan-data.ts', content);
console.log('balayan-data.ts updated successfully.');
