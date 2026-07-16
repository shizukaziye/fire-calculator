// Housing presets for the big-decisions bar. Selecting one sets three config
// keys at once: housePrice (today $), rentFamily (3BR, annual), rentSolo
// (2BR, annual) — all still tunable afterwards in the Housing panel.
//
// price   = ESTIMATED 3BR ~2,000 sqft single-family house (the plan's spec),
//           NOT the city median: mid-2026 medians (Redfin/Zillow/Movoto —
//           e.g. Milpitas $1.3M, Alameda $1.1M, Pleasanton $1.5M, Dublin
//           $1.4M, Alhambra $932k, Monterey Park $885k, Arcadia $1.53M,
//           Irvine $1.5M, LA county $937k, Las Vegas valley $478k) scaled to
//           2,000 sqft via per-area $/sqft, since a typical CA median sale is
//           a ~1,400-1,600 sqft house or condo. Vegas medians are already
//           ~2,000 sqft stock, so those barely move. Same method as the
//           July 2026 plan's Concord-Hayward tier ($506/sqft -> ~$950k).
// rent3br = 3BR ~2,000 sqft HOUSE monthly rent; rent2br = typical 2BR
//           apartment (unchanged by house size).
// Everything is a guesstimate anchored to those medians — treat presets as
// starting points, not gospel, and fine-tune in the Housing panel.
//
// Curation bias, on purpose: heavy on Asian-food/boba-dense, family-friendly
// suburbs (South Bay, Tri-Valley, 880 corridor, San Gabriel Valley, north
// Orange County, southwest Las Vegas) since that's the actual search space.

export const HOUSING_PRESETS = [
  // --- Bay Area: South Bay / Peninsula ---
  { id: 'milpitas', metro: 'Bay Area', name: 'Milpitas', price: 1_500_000, rent3br: 4_600, rent2br: 3_000 },
  { id: 'santa-clara', metro: 'Bay Area', name: 'Santa Clara', price: 1_850_000, rent3br: 4_900, rent2br: 3_200 },
  { id: 'sunnyvale', metro: 'Bay Area', name: 'Sunnyvale', price: 2_350_000, rent3br: 5_600, rent2br: 3_500 },
  { id: 'san-jose', metro: 'Bay Area', name: 'San Jose', price: 1_600_000, rent3br: 4_800, rent2br: 3_100 },

  // --- Bay Area: East Bay / 880 corridor ---
  { id: 'fremont', metro: 'Bay Area', name: 'Fremont', price: 1_450_000, rent3br: 4_500, rent2br: 2_900 },
  { id: 'union-city', metro: 'Bay Area', name: 'Union City', price: 1_300_000, rent3br: 4_200, rent2br: 2_700 },
  { id: 'newark', metro: 'Bay Area', name: 'Newark', price: 1_250_000, rent3br: 4_100, rent2br: 2_600 },
  { id: 'hayward', metro: 'Bay Area', name: 'Hayward', price: 1_100_000, rent3br: 3_650, rent2br: 2_700 },
  { id: 'castro-valley', metro: 'Bay Area', name: 'Castro Valley', price: 1_250_000, rent3br: 4_100, rent2br: 2_600 },
  { id: 'san-leandro', metro: 'Bay Area', name: 'San Leandro', price: 1_100_000, rent3br: 3_600, rent2br: 2_600 },
  { id: 'alameda', metro: 'Bay Area', name: 'Alameda', price: 1_400_000, rent3br: 4_500, rent2br: 2_800 },
  { id: 'oakland', metro: 'Bay Area', name: 'Oakland', price: 1_050_000, rent3br: 3_900, rent2br: 2_500 },

  // --- Bay Area: Tri-Valley / 680-24 corridor ---
  { id: 'pleasanton', metro: 'Bay Area', name: 'Pleasanton', price: 1_550_000, rent3br: 4_900, rent2br: 3_000 },
  { id: 'dublin', metro: 'Bay Area', name: 'Dublin', price: 1_400_000, rent3br: 4_700, rent2br: 3_000 },
  { id: 'livermore', metro: 'Bay Area', name: 'Livermore', price: 1_250_000, rent3br: 4_100, rent2br: 2_700 },
  { id: 'walnut-creek', metro: 'Bay Area', name: 'Walnut Creek', price: 1_400_000, rent3br: 4_400, rent2br: 2_800 },
  { id: 'concord', metro: 'Bay Area', name: 'Concord', price: 975_000, rent3br: 3_500, rent2br: 2_400 },
  { id: 'antioch', metro: 'Bay Area', name: 'Antioch (budget)', price: 750_000, rent3br: 3_100, rent2br: 2_100 },

  // --- Bay Area: reference tiers ---
  { id: 'bay-cheap-tier', metro: 'Bay Area', name: 'Concord–Hayward 2,000 sqft tier', price: 950_000, rent3br: 3_600, rent2br: 2_700 },
  { id: 'san-francisco', metro: 'Bay Area', name: 'San Francisco', price: 1_700_000, rent3br: 5_800, rent2br: 3_400 },

  // --- Los Angeles ---
  { id: 'la-average', metro: 'Los Angeles', name: 'LA average (county)', price: 1_200_000, rent3br: 4_700, rent2br: 2_900 },
  // San Gabriel Valley (the Asian-food capital corridor):
  { id: 'alhambra', metro: 'Los Angeles', name: 'Alhambra', price: 1_250_000, rent3br: 4_200, rent2br: 2_500 },
  { id: 'monterey-park', metro: 'Los Angeles', name: 'Monterey Park', price: 1_200_000, rent3br: 4_100, rent2br: 2_400 },
  { id: 'san-gabriel', metro: 'Los Angeles', name: 'San Gabriel', price: 1_300_000, rent3br: 4_300, rent2br: 2_500 },
  { id: 'rosemead', metro: 'Los Angeles', name: 'Rosemead', price: 1_150_000, rent3br: 3_900, rent2br: 2_300 },
  { id: 'temple-city', metro: 'Los Angeles', name: 'Temple City', price: 1_400_000, rent3br: 4_500, rent2br: 2_600 },
  { id: 'arcadia', metro: 'Los Angeles', name: 'Arcadia', price: 1_650_000, rent3br: 5_100, rent2br: 2_900 },
  { id: 'pasadena', metro: 'Los Angeles', name: 'Pasadena', price: 1_500_000, rent3br: 5_100, rent2br: 2_900 },
  { id: 'rowland-heights', metro: 'Los Angeles', name: 'Rowland Heights', price: 1_200_000, rent3br: 4_100, rent2br: 2_500 },
  { id: 'diamond-bar', metro: 'Los Angeles', name: 'Diamond Bar', price: 1_150_000, rent3br: 4_200, rent2br: 2_600 },

  // --- Los Angeles: rest of the county ---
  { id: 'long-beach', metro: 'Los Angeles', name: 'Long Beach', price: 1_150_000, rent3br: 4_200, rent2br: 2_500 },
  { id: 'glendale', metro: 'Los Angeles', name: 'Glendale', price: 1_450_000, rent3br: 4_900, rent2br: 2_800 },
  { id: 'burbank', metro: 'Los Angeles', name: 'Burbank', price: 1_350_000, rent3br: 4_800, rent2br: 2_700 },
  { id: 'torrance', metro: 'Los Angeles', name: 'Torrance (South Bay)', price: 1_350_000, rent3br: 4_500, rent2br: 2_600 },
  { id: 'cerritos', metro: 'Los Angeles', name: 'Cerritos', price: 1_250_000, rent3br: 4_500, rent2br: 2_700 },
  { id: 'culver-city', metro: 'Los Angeles', name: 'Culver City', price: 1_750_000, rent3br: 5_500, rent2br: 3_100 },
  { id: 'santa-monica', metro: 'Los Angeles', name: 'Santa Monica', price: 2_800_000, rent3br: 7_500, rent2br: 3_900 },
  { id: 'sherman-oaks', metro: 'Los Angeles', name: 'Sherman Oaks (Valley)', price: 1_650_000, rent3br: 5_500, rent2br: 2_900 },
  { id: 'inglewood', metro: 'Los Angeles', name: 'Inglewood (budget)', price: 1_000_000, rent3br: 3_800, rent2br: 2_300 },

  // --- Orange County (north OC Korean/Asian corridor + Irvine) ---
  { id: 'irvine', metro: 'Orange County', name: 'Irvine', price: 1_750_000, rent3br: 5_500, rent2br: 3_300 },
  { id: 'fullerton', metro: 'Orange County', name: 'Fullerton', price: 1_250_000, rent3br: 4_400, rent2br: 2_700 },
  { id: 'buena-park', metro: 'Orange County', name: 'Buena Park', price: 1_150_000, rent3br: 4_200, rent2br: 2_500 },

  // --- Las Vegas ---
  { id: 'lv-average', metro: 'Las Vegas', name: 'Las Vegas average (valley)', price: 500_000, rent3br: 2_250, rent2br: 1_500 },
  { id: 'summerlin', metro: 'Las Vegas', name: 'Summerlin', price: 700_000, rent3br: 2_900, rent2br: 1_900 },
  { id: 'henderson', metro: 'Las Vegas', name: 'Henderson', price: 520_000, rent3br: 2_550, rent2br: 1_650 },
  { id: 'green-valley', metro: 'Las Vegas', name: 'Green Valley', price: 490_000, rent3br: 2_450, rent2br: 1_600 },
  { id: 'spring-valley', metro: 'Las Vegas', name: 'Spring Valley (LV Chinatown)', price: 470_000, rent3br: 2_150, rent2br: 1_400 },
  { id: 'enterprise', metro: 'Las Vegas', name: 'Enterprise / Southwest', price: 540_000, rent3br: 2_350, rent2br: 1_500 },
  { id: 'north-las-vegas', metro: 'Las Vegas', name: 'North Las Vegas (budget)', price: 390_000, rent3br: 2_000, rent2br: 1_300 },
  { id: 'centennial-hills', metro: 'Las Vegas', name: 'Centennial Hills', price: 520_000, rent3br: 2_250, rent2br: 1_450 },
];

export const METROS = ['Bay Area', 'Los Angeles', 'Orange County', 'Las Vegas'];

// Config patch for a preset (rents are stored annual).
export const presetPatch = (p) => ({
  housePrice: p.price,
  rentFamily: p.rent3br * 12,
  rentSolo: p.rent2br * 12,
});

// Which preset (if any) matches the current config exactly — used so the
// dropdown shows "Custom" once the user fine-tunes any of the three values.
export const matchPreset = (config) =>
  HOUSING_PRESETS.find(
    (p) =>
      p.price === config.housePrice &&
      p.rent3br * 12 === config.rentFamily &&
      p.rent2br * 12 === config.rentSolo
  );
