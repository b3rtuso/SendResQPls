/**
 * Normalizes free-form AI-detected incident type strings into canonical categories
 * used for charts, icons, and filtering.
 *
 * Categories:
 *   Medical   – dizziness, stroke, seizure, DOB, cardiac, respiratory, etc.
 *   Trauma    – physical injuries, wounds, fractures, abrasions, lacerations
 *   Accident  – vehicular accidents, road collisions, car crash, fall accident
 *   Fire      – fire, blaze, arson, explosion
 *   Crime     – shooting, assault, robbery, stabbing, firearm
 *   Flood     – flood, storm surge
 *   Typhoon   – typhoon, cyclone, monsoon
 *   Landslide – landslide, mudslide
 */

const CRIME_KEYWORDS = [
  'shooting', 'robbery', 'assault', 'stabbing', 'firearm',
  'gunshot', 'holdup', 'hold-up', 'theft', 'murder',
  'homicide', 'kidnap', 'arson', 'mauling',
];

const TRAUMA_KEYWORDS = [
  'trauma', 'wound', 'fracture', 'laceration', 'abrasion',
  'contusion', 'dislocation', 'amputation', 'avulsion',
  'sprain', 'concussion', 'blunt', 'puncture',
  'electrocution', 'injury', 'injured',
];

const ACCIDENT_KEYWORDS = [
  'accident', 'collision', 'crash', 'vehicular', 'vehicle',
  'hit and run', 'hit-and-run', 'road', 'traffic', 'car',
  'motorcycle', 'truck', 'bus', 'overturned', 'rollover',
  'pile-up', 'pileup', 'fender', 'wreck', 'smash',
];

const MEDICAL_KEYWORDS = [
  'medical', 'health', 'hospital', 'heart', 'cardiac', 'stroke',
  'seizure', 'asthma', 'respiratory', 'difficulty of breathing',
  'drowning', 'drown', 'choking', 'allergic', 'anaphylaxis',
  'bleeding', 'hemorrhage', 'unconscious', 'faint', 'collapse',
  'poison', 'overdose', 'burn', 'heatstroke', 'dehydration',
  'diabetic', 'epilepsy', 'snake bite', 'snakebite',
  'dog bite', 'animal bite', 'childbirth', 'pregnancy',
  'mental health', 'suicide', 'self-harm',
  'dizziness', 'hypertension', 'vomiting', 'headache',
];

const FIRE_KEYWORDS = [
  'fire', 'blaze', 'inferno', 'flame',
  'burning', 'combustion', 'wildfire', 'brushfire',
  'structural fire', 'house fire', 'electrical fire',
  'explosion', 'gas leak',
];

const FLOOD_KEYWORDS = [
  'flood', 'flooding', 'flash flood', 'water level',
  'submerged', 'inundation', 'overflow', 'waterlog',
  'storm surge',
];

const TYPHOON_KEYWORDS = [
  'typhoon', 'storm', 'cyclone', 'hurricane',
  'strong wind', 'gale', 'tropical depression',
  'monsoon', 'bagyo',
];

const LANDSLIDE_KEYWORDS = [
  'landslide', 'mudslide', 'rockslide', 'rock fall',
  'ground collapse', 'sinkhole', 'erosion', 'soil',
  'earth movement',
];

export function normalizeIncidentType(rawType: string | undefined | null): string {
  if (!rawType) return 'Other';

  const lower = rawType.toLowerCase().trim();

  // Exact matches first (most common AI outputs)
  if (lower === 'fire') return 'Fire';
  if (lower === 'flood') return 'Flood';
  if (lower === 'medical') return 'Medical';
  if (lower === 'trauma') return 'Trauma';
  if (lower === 'accident') return 'Accident';
  if (lower === 'typhoon') return 'Typhoon';
  if (lower === 'landslide') return 'Landslide';

  // Keyword-based matching (order matters: more specific first)
  if (CRIME_KEYWORDS.some(kw => lower.includes(kw))) return 'Crime';
  if (FIRE_KEYWORDS.some(kw => lower.includes(kw))) return 'Fire';
  if (FLOOD_KEYWORDS.some(kw => lower.includes(kw))) return 'Flood';
  if (TYPHOON_KEYWORDS.some(kw => lower.includes(kw))) return 'Typhoon';
  if (LANDSLIDE_KEYWORDS.some(kw => lower.includes(kw))) return 'Landslide';
  if (ACCIDENT_KEYWORDS.some(kw => lower.includes(kw))) return 'Accident';
  if (TRAUMA_KEYWORDS.some(kw => lower.includes(kw))) return 'Trauma';
  if (MEDICAL_KEYWORDS.some(kw => lower.includes(kw))) return 'Medical';

  return 'Other';
}
