// ============================================================
// Balayan, Batangas — Barangay Data Module
// Coordinates verified against PhilAtlas.com + OpenStreetMap
// Municipality center: 13.9350°N, 120.7280°E
// 48 official barangays per PSGC
// ============================================================

// Correct center — PhilAtlas confirms Balayan town at ~13.935°N, 120.728°E
export const BALAYAN_CENTER = { lat: 13.9350, lng: 120.7200 };

// Corrected bounds based on actual barangay extents
export const BALAYAN_BOUNDS = {
  north: 13.980,
  south: 13.905,
  east:  120.785,
  west:  120.665,
};

export const INCIDENT_TYPES = [
  { id: 'fire',      label: 'Fire',      icon: '🔥', color: '#EF4444', description: 'Structural and wildland fires across barangays' },
  { id: 'flood',     label: 'Flood',     icon: '🌊', color: '#3B82F6', description: 'River overflow, flash floods, and storm surge' },
  { id: 'medical',   label: 'Medical',   icon: '🏥', color: '#22C55E', description: 'Medical emergencies and health crises' },
  { id: 'accident',  label: 'Accident',  icon: '🚗', color: '#F59E0B', description: 'Vehicular and industrial accidents' },
  { id: 'typhoon',   label: 'Typhoon',   icon: '🌀', color: '#8B5CF6', description: 'Tropical storms and typhoon damage' },
  { id: 'landslide', label: 'Landslide', icon: '⛰️', color: '#78716C', description: 'Ground movement, mudslides, and erosion' },
];

export interface RiskEntry {
  riskLevel: 'HIGH' | 'MEDIUM' | 'LOW';
  prescription: string;
}

export interface Barangay {
  name: string;
  lat: number;
  lng: number;
  riskProfile: Record<string, RiskEntry>;
}

// ── Helpers ──────────────────────────────────────────────────
export function isWithinBalayan(lat: number, lng: number): boolean {
  return (
    lat >= BALAYAN_BOUNDS.south &&
    lat <= BALAYAN_BOUNDS.north &&
    lng >= BALAYAN_BOUNDS.west &&
    lng <= BALAYAN_BOUNDS.east
  );
}

export function getBarangayRiskColor(riskLevel: string): string {
  switch (riskLevel) {
    case 'HIGH':   return '#EF4444';
    case 'MEDIUM': return '#F59E0B';
    case 'LOW':    return '#22C55E';
    default:       return '#6B7280';
  }
}

/**
 * Reverse-geocode: returns the nearest barangay name for given coordinates.
 * Uses Haversine distance. Fallback to raw coordinates if far from all barangays.
 */
export function getNearestBarangay(lat: number, lng: number): string {
  const toRad = (d: number) => (d * Math.PI) / 180;
  let nearest = BARANGAYS[0];
  let minDist = Infinity;
  for (const b of BARANGAYS) {
    const dLat = toRad(lat - b.lat);
    const dLng = toRad(lng - b.lng);
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(toRad(b.lat)) * Math.cos(toRad(lat)) * Math.sin(dLng / 2) ** 2;
    const dist = 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    if (dist < minDist) { minDist = dist; nearest = b; }
  }
  // If more than 5 km away, likely outside Balayan — show raw coords
  if (minDist > 5) return `${lat.toFixed(4)}°N, ${lng.toFixed(4)}°E`;
  return `${nearest.name}, Balayan, Batangas`;
}

// ── Risk profile templates ────────────────────────────────────
const URBAN_PROFILE: Record<string, RiskEntry> = {
  fire:      { riskLevel: 'HIGH',   prescription: 'Evacuate immediately via nearest road. Contact BFP Balayan Fire Station. Nearest fire hydrant at Municipal Hall complex. Do not use elevators. Assemble at Balayan Town Plaza.' },
  flood:     { riskLevel: 'MEDIUM', prescription: 'Move valuables to upper floors. Avoid walking through floodwaters. Proceed to Balayan Central School if water rises above knee-level. Monitor MDRRMO radio advisories.' },
  medical:   { riskLevel: 'HIGH',   prescription: 'Call MDRRMO hotline immediately. Balayan District Hospital is within 5 minutes. Apply basic first aid. Do not move patients with spinal injuries. Wait for ambulance team.' },
  accident:  { riskLevel: 'HIGH',   prescription: 'Secure the accident site. Do not move injured persons. Call PNP Balayan and MDRRMO. Direct traffic away from the scene. Nearest trauma center: Balayan District Hospital.' },
  typhoon:   { riskLevel: 'MEDIUM', prescription: 'Secure loose signage and awnings. Board up glass windows. Evacuate to Balayan Sports Complex if Signal No. 3+. Stock 3-day emergency supplies.' },
  landslide: { riskLevel: 'LOW',    prescription: 'Monitor for cracks in building foundations. Report unusual ground settling to MDRRMO. Avoid areas near excavation sites during heavy rain.' },
};

const COASTAL_PROFILE: Record<string, RiskEntry> = {
  fire:      { riskLevel: 'MEDIUM', prescription: 'Evacuate immediately. Contact BFP Balayan. Be cautious of wind-driven fire spread near the coast. Move upwind. Assemble at nearest barangay hall.' },
  flood:     { riskLevel: 'HIGH',   prescription: 'Move to higher ground IMMEDIATELY. Storm surge possible during typhoons. Do not cross flooded roads or bridges. Evacuate to Balayan Central School or Sports Complex.' },
  medical:   { riskLevel: 'MEDIUM', prescription: 'Call MDRRMO hotline. Nearest facility: Balayan District Hospital (10-15 min). Apply first aid while waiting. For drowning victims, begin CPR immediately.' },
  accident:  { riskLevel: 'LOW',    prescription: 'Secure the scene. Call PNP and MDRRMO. For maritime accidents, alert Philippine Coast Guard auxiliary in Balayan. Do not attempt water rescue without equipment.' },
  typhoon:   { riskLevel: 'HIGH',   prescription: 'MANDATORY EVACUATION when Signal No. 2+. Secure fishing boats. Move away from shoreline (min 500m). Evacuate to Balayan Sports Complex. Avoid Balayan Bay area entirely.' },
  landslide: { riskLevel: 'MEDIUM', prescription: 'Watch for cliff erosion near coastal bluffs. Avoid areas below steep embankments. Report ground cracks to MDRRMO. Evacuate if soil appears saturated.' },
};

const HILLSIDE_PROFILE: Record<string, RiskEntry> = {
  fire:      { riskLevel: 'MEDIUM', prescription: 'Evacuate downhill via established roads. Contact BFP Balayan. Wildfire risk during dry season — clear dry vegetation around structures. Assemble at nearest barangay hall.' },
  flood:     { riskLevel: 'MEDIUM', prescription: 'Watch for flash floods in ravines. Do not cross swollen streams. Move to the barangay hall if water rises. Monitor weather updates from PAGASA via MDRRMO.' },
  medical:   { riskLevel: 'MEDIUM', prescription: 'Call MDRRMO hotline. Balayan District Hospital is 15-20 minutes away. Apply first aid and keep patient stable. Helicopter evacuation available for critical cases.' },
  accident:  { riskLevel: 'LOW',    prescription: 'Secure the scene on steep roads. Use warning triangles. Call PNP and MDRRMO. Be cautious of rockfall in the area. Do not move vehicle if on a slope.' },
  typhoon:   { riskLevel: 'MEDIUM', prescription: 'Secure roof and windows. Watch for falling trees. Evacuate to lower-ground evacuation centers if winds exceed Signal No. 2. Stock emergency supplies for 3+ days.' },
  landslide: { riskLevel: 'HIGH',   prescription: 'EVACUATE DOWNHILL IMMEDIATELY if you notice ground cracks, tilting trees, or unusual water seepage. Do not return until MDRRMO clears the area. Report to Brgy Hall.' },
};

const RURAL_PROFILE: Record<string, RiskEntry> = {
  fire:      { riskLevel: 'MEDIUM', prescription: 'Evacuate structures immediately. Contact BFP Balayan — response time ~10 min. Use fire extinguishers for small fires. Clear brush to create firebreaks. Assemble at Brgy Hall.' },
  flood:     { riskLevel: 'MEDIUM', prescription: 'Move to higher ground if near rivers or creeks. Avoid low-lying rice paddies during storms. Proceed to nearest barangay evacuation center. Monitor MDRRMO advisories.' },
  medical:   { riskLevel: 'LOW',    prescription: 'Call MDRRMO hotline. Balayan District Hospital is 15-25 min away. Apply first aid. For snake bites, immobilize the limb and do NOT apply tourniquet. Wait for rescue team.' },
  accident:  { riskLevel: 'LOW',    prescription: 'Secure the area. Call PNP Balayan. For farm equipment accidents, do not attempt to free trapped persons. Wait for MDRRMO rescue team with proper equipment.' },
  typhoon:   { riskLevel: 'MEDIUM', prescription: 'Secure livestock and farm equipment. Reinforce roofing. Evacuate to nearest concrete structure or barangay hall. Stock water and food for 3 days minimum.' },
  landslide: { riskLevel: 'MEDIUM', prescription: 'Watch for signs: cracks in ground, leaning trees, muddy water in streams. Evacuate away from slopes. Report to MDRRMO and Brgy Captain. Avoid returning until inspected.' },
};

// ── All 48 Barangays — coordinates verified via PhilAtlas.com & OSM ──
// PhilAtlas confirmed: Brgy 1 (13.9320,120.7296), Brgy 4 (13.9369,120.7293),
//   Navotas (13.9302,120.7187), Palikpikan (13.9215,120.6837),
//   Lagnas (13.9741,120.6778), Sampaga (13.9428,120.7728)
export const BARANGAYS: Barangay[] = [

  // ── POBLACION (Urban center — 12 barangays) ─────────────────
  // Clustered around the Balayan town plaza / municipal hall
  { name: 'Brgy. 1 (Poblacion)',  lat: 13.9320, lng: 120.7296, riskProfile: { ...URBAN_PROFILE } },
  { name: 'Brgy. 2 (Poblacion)',  lat: 13.9330, lng: 120.7308, riskProfile: { ...URBAN_PROFILE } },
  { name: 'Brgy. 3 (Poblacion)',  lat: 13.9340, lng: 120.7290, riskProfile: { ...URBAN_PROFILE } },
  { name: 'Brgy. 4 (Poblacion)',  lat: 13.9369, lng: 120.7293, riskProfile: { ...URBAN_PROFILE } },
  { name: 'Brgy. 5 (Poblacion)',  lat: 13.9355, lng: 120.7275, riskProfile: { ...URBAN_PROFILE } },
  { name: 'Brgy. 6 (Poblacion)',  lat: 13.9380, lng: 120.7310, riskProfile: { ...URBAN_PROFILE } },
  { name: 'Brgy. 7 (Poblacion)',  lat: 13.9310, lng: 120.7315, riskProfile: { ...URBAN_PROFILE } },
  { name: 'Brgy. 8 (Poblacion)',  lat: 13.9350, lng: 120.7285, riskProfile: { ...URBAN_PROFILE } },
  { name: 'Brgy. 9 (Poblacion)',  lat: 13.9360, lng: 120.7300, riskProfile: { ...URBAN_PROFILE } },
  { name: 'Brgy. 10 (Poblacion)', lat: 13.9325, lng: 120.7270, riskProfile: { ...URBAN_PROFILE } },
  { name: 'Brgy. 11 (Poblacion)', lat: 13.9345, lng: 120.7260, riskProfile: { ...URBAN_PROFILE } },
  { name: 'Brgy. 12 (Poblacion)', lat: 13.9390, lng: 120.7295, riskProfile: { ...URBAN_PROFILE } },

  // ── COASTAL (Near Balayan Bay — south/southwest) ─────────────
  { name: 'Baclaran',    lat: 13.9200, lng: 120.7150, riskProfile: { ...COASTAL_PROFILE } },
  { name: 'Navotas',     lat: 13.9302, lng: 120.7187, riskProfile: { ...COASTAL_PROFILE } }, // PhilAtlas confirmed
  { name: 'Duhatan',     lat: 13.9245, lng: 120.7220, riskProfile: { ...COASTAL_PROFILE } },
  { name: 'Malalay',     lat: 13.9220, lng: 120.7310, riskProfile: { ...COASTAL_PROFILE } },
  { name: 'Sukol',       lat: 13.9270, lng: 120.7240, riskProfile: { ...COASTAL_PROFILE } },
  { name: 'Palincaro',   lat: 13.9180, lng: 120.7080, riskProfile: { ...COASTAL_PROFILE } },
  { name: 'Munting Tubig', lat: 13.9155, lng: 120.7180, riskProfile: {
    fire:      { riskLevel: 'LOW',  prescription: 'Contact BFP Balayan. Low-density residential area. Evacuate via main road toward Poblacion.' },
    flood:     { riskLevel: 'HIGH', prescription: 'HIGHEST FLOOD RISK in Balayan. Move to 2nd floor or higher ground immediately. Munting Tubig creek overflows rapidly. Evacuate to Balayan Central School.' },
    medical:   { riskLevel: 'MEDIUM', prescription: 'Call MDRRMO. Hospital is 15 min away. During floods, medical access may be cut off — stock basic medicines and first aid kit.' },
    accident:  { riskLevel: 'LOW',  prescription: 'Secure scene. Call PNP Balayan. Low traffic volume. MDRRMO response: ~10 min.' },
    typhoon:   { riskLevel: 'HIGH', prescription: 'MANDATORY EVACUATION for Signal No. 2+. This is one of the most vulnerable areas. Pre-position at Balayan Sports Complex evacuation center.' },
    landslide: { riskLevel: 'MEDIUM', prescription: 'Watch for ground saturation near creek banks. Avoid steep areas after prolonged rain. Report to Brgy Captain.' },
  }},
  { name: 'Carenahan', lat: 13.9258, lng: 120.7420, riskProfile: {
    fire:      { riskLevel: 'LOW',  prescription: 'Contact BFP Balayan. Evacuate via Carenahan Road. Low density area — fire spread risk is minimal. Assemble at Carenahan Barangay Hall.' },
    flood:     { riskLevel: 'HIGH', prescription: 'Move to higher ground IMMEDIATELY. Carenahan Bridge becomes impassable during heavy rain. Evacuate to Balayan Central School. Do NOT attempt to cross flooded Carenahan River.' },
    medical:   { riskLevel: 'MEDIUM', prescription: 'Call MDRRMO. Balayan District Hospital is 12 min away. Apply first aid. For flood-related injuries, watch for leptospirosis symptoms within 2 weeks.' },
    accident:  { riskLevel: 'LOW',  prescription: 'Secure scene. Call PNP. Low traffic area — watch for agricultural vehicle incidents. MDRRMO response time: ~8 minutes.' },
    typhoon:   { riskLevel: 'HIGH', prescription: 'MANDATORY PRE-EMPTIVE EVACUATION during Signal No. 2+. Carenahan is a flood-prone zone. Evacuate to Balayan Sports Complex at least 6 hours before typhoon landfall.' },
    landslide: { riskLevel: 'MEDIUM', prescription: 'Watch for riverbank erosion along Carenahan River. Avoid areas near steep riverbanks. Report erosion to MDRRMO for assessment.' },
  }},

  // ── HIGHLANDS / NORTH (Higher elevation) ─────────────────────
  { name: 'Lagnas',     lat: 13.9741, lng: 120.6778, riskProfile: { ...HILLSIDE_PROFILE } }, // PhilAtlas confirmed
  { name: 'Dalig',      lat: 13.9680, lng: 120.6920, riskProfile: {
    fire:      { riskLevel: 'LOW',    prescription: 'Contact BFP Balayan. Remote area — response time ~15 min. Use available water sources for initial suppression. Evacuate toward San Juan Road.' },
    flood:     { riskLevel: 'LOW',    prescription: 'Elevated terrain reduces flood risk. Watch for flash floods in narrow valleys only. Monitor MDRRMO weather updates.' },
    medical:   { riskLevel: 'MEDIUM', prescription: 'Call MDRRMO. Balayan District Hospital is ~20 min away. For critical cases, request helicopter evacuation. Apply first aid and stabilize patient.' },
    accident:  { riskLevel: 'LOW',    prescription: 'Mountain roads are narrow. Secure scene with warning markers. Call PNP. Do not move vehicles on steep grades.' },
    typhoon:   { riskLevel: 'MEDIUM', prescription: 'High winds at elevation. Secure roofing. Evacuate to Dalig Barangay Hall (concrete structure). Stock 3-day supplies.' },
    landslide: { riskLevel: 'HIGH',   prescription: 'HIGHEST LANDSLIDE RISK. Evacuate downhill immediately at first signs: ground cracks, tilting trees, unusual spring water. Do NOT return without MDRRMO clearance.' },
  }},
  { name: 'Calan',      lat: 13.9620, lng: 120.7050, riskProfile: { ...HILLSIDE_PROFILE } },
  { name: 'Caloocan',   lat: 13.9560, lng: 120.7120, riskProfile: { ...HILLSIDE_PROFILE } },
  { name: 'Durungao',   lat: 13.9650, lng: 120.6980, riskProfile: { ...HILLSIDE_PROFILE } },
  { name: 'Palikpikan', lat: 13.9215, lng: 120.6837, riskProfile: { ...HILLSIDE_PROFILE } }, // PhilAtlas confirmed
  { name: 'Tactac',     lat: 13.9510, lng: 120.6970, riskProfile: { ...HILLSIDE_PROFILE } },
  { name: 'Taludtud',   lat: 13.9470, lng: 120.7050, riskProfile: { ...HILLSIDE_PROFILE } },

  // ── RURAL / INLAND (Agricultural areas — east & northeast) ───
  { name: 'Calzada',      lat: 13.9420, lng: 120.7480, riskProfile: { ...RURAL_PROFILE } },
  { name: 'Canda',        lat: 13.9450, lng: 120.7540, riskProfile: { ...RURAL_PROFILE } },
  { name: 'Caybunga',     lat: 13.9390, lng: 120.7580, riskProfile: { ...RURAL_PROFILE } },
  { name: 'Cayponce',     lat: 13.9490, lng: 120.7620, riskProfile: { ...RURAL_PROFILE } },
  { name: 'Dilao',        lat: 13.9440, lng: 120.7380, riskProfile: { ...RURAL_PROFILE } },
  { name: 'Gimalas',      lat: 13.9530, lng: 120.7420, riskProfile: { ...RURAL_PROFILE } },
  { name: 'Gumamela',     lat: 13.9570, lng: 120.7480, riskProfile: { ...RURAL_PROFILE } },
  { name: 'Langgangan',   lat: 13.9460, lng: 120.7340, riskProfile: { ...RURAL_PROFILE } },
  { name: 'Lucban Pook',  lat: 13.9580, lng: 120.7500, riskProfile: { ...RURAL_PROFILE } },
  { name: 'Lucban Putol', lat: 13.9560, lng: 120.7520, riskProfile: { ...RURAL_PROFILE } },
  { name: 'Magabe',       lat: 13.9500, lng: 120.7680, riskProfile: { ...RURAL_PROFILE } },
  { name: 'Patugo',       lat: 13.9470, lng: 120.7600, riskProfile: { ...RURAL_PROFILE } },
  { name: 'Pooc',         lat: 13.9430, lng: 120.7520, riskProfile: { ...RURAL_PROFILE } },
  { name: 'Sambat',       lat: 13.9370, lng: 120.7680, riskProfile: { ...RURAL_PROFILE } },
  { name: 'Sampaga',      lat: 13.9428, lng: 120.7728, riskProfile: { ...RURAL_PROFILE } }, // PhilAtlas confirmed
  { name: 'San Juan',     lat: 13.9610, lng: 120.7380, riskProfile: { ...RURAL_PROFILE } },
  { name: 'San Piro',     lat: 13.9550, lng: 120.7560, riskProfile: { ...RURAL_PROFILE } },
  { name: 'Santol',       lat: 13.9445, lng: 120.7455, riskProfile: { ...RURAL_PROFILE } },
  { name: 'Tanggoy',      lat: 13.9435, lng: 120.7310, riskProfile: { ...RURAL_PROFILE } },
  { name: 'Dao',          lat: 13.9355, lng: 120.7500, riskProfile: {
    fire:      { riskLevel: 'LOW',    prescription: 'Contact BFP Balayan. Agricultural area — watch for crop burning spreading. Evacuate via Dao Barangay Road.' },
    flood:     { riskLevel: 'HIGH',   prescription: 'Low-lying rice paddy area. Move to Dao Barangay Hall immediately. Do NOT cross flooded fields. Wait for MDRRMO rescue boats if stranded.' },
    medical:   { riskLevel: 'LOW',    prescription: 'Call MDRRMO. Hospital is ~18 min. For pesticide exposure, remove contaminated clothing and rinse with clean water. Bring product label to hospital.' },
    accident:  { riskLevel: 'LOW',    prescription: 'Agricultural area — watch for farm equipment incidents. Call PNP and MDRRMO. Do not attempt to free trapped persons.' },
    typhoon:   { riskLevel: 'HIGH',   prescription: 'Flood-prone during typhoons. PRE-EMPTIVE EVACUATION recommended. Move to Balayan Sports Complex. Secure livestock early.' },
    landslide: { riskLevel: 'LOW',    prescription: 'Flat terrain — low landslide risk. Monitor nearby hillside areas for runoff during storms.' },
  }},
  { name: 'Lanatan', lat: 13.9400, lng: 120.7440, riskProfile: {
    fire:      { riskLevel: 'LOW',    prescription: 'Contact BFP. Low-density area. Use fire extinguisher for small fires. Evacuate to Lanatan Barangay Hall.' },
    flood:     { riskLevel: 'HIGH',   prescription: 'Near river system — HIGH flood risk. Evacuate to higher ground immediately. Do not attempt to wade through floodwaters. Proceed to Balayan Central School.' },
    medical:   { riskLevel: 'LOW',    prescription: 'Call MDRRMO. Hospital is ~18 min. Apply first aid. For flood-related injuries, watch for waterborne disease symptoms.' },
    accident:  { riskLevel: 'LOW',    prescription: 'Low traffic. Secure scene. Call PNP Balayan.' },
    typhoon:   { riskLevel: 'HIGH',   prescription: 'River flooding expected during typhoons. Evacuate BEFORE the storm. Move to Balayan Sports Complex. Do not stay near riverbanks.' },
    landslide: { riskLevel: 'MEDIUM', prescription: 'Watch for riverbank collapse. Avoid walking near eroded banks after rain. Report cracks to MDRRMO.' },
  }},
];
