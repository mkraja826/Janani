export type DietPreference = 'vegetarian' | 'non_vegetarian' | 'eggetarian' | 'vegan' | 'unknown';

export type RegionalDietContext = {
  countryCode: string;
  regionCode: string | null;
  regionLabel: string;
  source: 'manual' | 'device_region';
  dietPreference: DietPreference;
  cuisineTags: string[];
};

const INDIA_REGION_TAGS: Record<string, string[]> = {
  'IN-TG': ['telangana', 'south-indian', 'millets', 'dal', 'rice', 'curd'],
  'IN-AP': ['andhra', 'south-indian', 'dal', 'rice', 'curd'],
  'IN-TN': ['tamil', 'south-indian', 'idli', 'dosa', 'sambar'],
  'IN-KL': ['kerala', 'south-indian', 'coconut', 'rice'],
  'IN-KA': ['karnataka', 'south-indian', 'millets', 'rice'],
  'IN-MH': ['maharashtra', 'western-indian', 'millets', 'dal'],
  'IN-GJ': ['gujarati', 'western-indian', 'dal', 'millets'],
  'IN-PB': ['punjabi', 'north-indian', 'wheat', 'dal', 'curd'],
  'IN-DL': ['north-indian', 'wheat', 'dal', 'curd'],
};

export function normalizeRegion(countryCode: string, regionCode: string | null, regionLabel: string, dietPreference: DietPreference, source: RegionalDietContext['source']): RegionalDietContext {
  const cc = (countryCode || 'IN').trim().toUpperCase();
  const rc = regionCode?.trim().toUpperCase() || null;
  const cuisineTags = cc === 'IN' && rc ? INDIA_REGION_TAGS[rc] ?? ['indian'] : [cc === 'IN' ? 'indian' : 'local'];
  return { countryCode: cc, regionCode: rc, regionLabel: regionLabel.trim() || 'My region', source, dietPreference, cuisineTags };
}

export const INDIA_REGION_OPTIONS = [
  { code: 'IN-TG', label: 'Telangana' },
  { code: 'IN-AP', label: 'Andhra Pradesh' },
  { code: 'IN-TN', label: 'Tamil Nadu' },
  { code: 'IN-KL', label: 'Kerala' },
  { code: 'IN-KA', label: 'Karnataka' },
  { code: 'IN-MH', label: 'Maharashtra' },
  { code: 'IN-GJ', label: 'Gujarat' },
  { code: 'IN-PB', label: 'Punjab' },
  { code: 'IN-DL', label: 'Delhi / NCR' },
] as const;
