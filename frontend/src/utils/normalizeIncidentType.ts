/**
 * Normalizes free-form AI-detected incident type strings into canonical categories
 * used for charts, icons, and filtering.
 *
 * Examples:
 *   "Vehicular Accident"      → "Accident"
 *   "Road Collision"          → "Accident"
 *   "Car Crash"               → "Accident"
 *   "Medical Emergency"       → "Medical"
 *   "Heart Attack"            → "Medical"
 *   "Cardiac Arrest"          → "Medical"
 *   "Drowning"                → "Medical"
 *   "Fire"                    → "Fire"
 *   "Structural Fire"         → "Fire"
 *   "Flood"                   → "Flood"
 *   "Flash Flooding"          → "Flood"
 *   "Typhoon"                 → "Typhoon"
 *   "Landslide"               → "Landslide"
 */

const ACCIDENT_KEYWORDS = [
  'accident', 'collision', 'crash', 'vehicular', 'vehicle',
  'hit and run', 'hit-and-run', 'road', 'traffic', 'car',
  'motorcycle', 'truck', 'bus', 'overturned', 'rollover',
  'pile-up', 'pileup', 'fender', 'wreck', 'smash',
];

const MEDICAL_KEYWORDS = [
  'medical', 'health', 'hospital', 'heart', 'cardiac', 'stroke',
  'seizure', 'asthma', 'respiratory', 'injury', 'injured',
  'drowning', 'drown', 'choking', 'allergic', 'anaphylaxis',
  'bleeding', 'hemorrhage', 'unconscious', 'faint', 'collapse',
  'poison', 'overdose', 'burn', 'heatstroke', 'dehydration',
  'diabetic', 'epilepsy', 'trauma', 'wound', 'fracture',
  'amputation', 'electrocution', 'snake bite', 'snakebite',
  'dog bite', 'animal bite', 'childbirth', 'pregnancy',
  'mental health', 'suicide', 'self-harm',
];

const FIRE_KEYWORDS = [
  'fire', 'blaze', 'arson', 'inferno', 'flame',
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
  if (lower === 'accident') return 'Accident';
  if (lower === 'typhoon') return 'Typhoon';
  if (lower === 'landslide') return 'Landslide';

  // Keyword-based matching (order matters: more specific first)
  if (FIRE_KEYWORDS.some(kw => lower.includes(kw))) return 'Fire';
  if (FLOOD_KEYWORDS.some(kw => lower.includes(kw))) return 'Flood';
  if (TYPHOON_KEYWORDS.some(kw => lower.includes(kw))) return 'Typhoon';
  if (LANDSLIDE_KEYWORDS.some(kw => lower.includes(kw))) return 'Landslide';
  if (ACCIDENT_KEYWORDS.some(kw => lower.includes(kw))) return 'Accident';
  if (MEDICAL_KEYWORDS.some(kw => lower.includes(kw))) return 'Medical';

  return 'Other';
}
