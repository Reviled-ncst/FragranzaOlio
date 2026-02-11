/**
 * Delivery Service
 * Calculates delivery pricing based on Lalamove rates (2024 Philippines)
 * Includes store pickup option
 */

// Updated Lalamove rates (Philippines 2024)
const LALAMOVE_RATES = {
  motorcycle: {
    baseFare: 70,           // Base fare for first 4km
    baseDistance: 4,        // km
    perKmRate: 14,          // per additional km after first 4km
    maxWeight: 20,          // kg
    label: 'Motorcycle',
    description: 'Small packages up to 20kg',
    estimatedMinutes: 2.5,  // minutes per km average
  },
  sedan: {
    baseFare: 230,
    baseDistance: 4,
    perKmRate: 22,
    maxWeight: 100,
    label: 'Sedan',
    description: 'Medium packages up to 100kg',
    estimatedMinutes: 3,
  },
  mpv: {
    baseFare: 320,
    baseDistance: 4,
    perKmRate: 28,
    maxWeight: 200,
    label: 'MPV/SUV',
    description: 'Large packages up to 200kg',
    estimatedMinutes: 3.5,
  },
  pickup_truck: {
    baseFare: 500,
    baseDistance: 4,
    perKmRate: 38,
    maxWeight: 500,
    label: 'Pickup Truck',
    description: 'Extra large/bulk orders',
    estimatedMinutes: 4,
  },
};

// Zone-based pricing multipliers (distance from Cavite)
const ZONES = {
  cavite: { name: 'Cavite', multiplier: 1.0 },
  laguna: { name: 'Laguna', multiplier: 1.1 },
  metro_manila: { name: 'Metro Manila', multiplier: 1.2 },
  rizal: { name: 'Rizal', multiplier: 1.3 },
  bulacan: { name: 'Bulacan', multiplier: 1.4 },
  batangas: { name: 'Batangas', multiplier: 1.3 },
  provincial: { name: 'Provincial', multiplier: 1.8 },
};

// Store location
export const STORE_LOCATIONS = [
  { 
    id: 1, 
    name: 'Fragranza Dasmariñas', 
    lat: 14.3269, 
    lng: 120.9365, 
    city: 'Dasmariñas, Cavite',
    address: 'Blk 16 Lot1-A Brgy San Dionisio, Dasmariñas, Cavite',
    operatingHours: '9:00 AM - 8:00 PM',
    phone: '+63 XXX XXX XXXX'
  },
];

export interface DeliveryAddress {
  id?: number;
  label?: string;
  fullName?: string;
  phone?: string;
  address: string;
  city: string;
  province: string;
  zipCode: string;
  lat?: number;
  lng?: number;
}

export interface DeliveryQuote {
  vehicleType: keyof typeof LALAMOVE_RATES | 'store_pickup';
  vehicleLabel: string;
  description: string;
  distance: number;        // in km
  baseFare: number;
  distanceCharge: number;
  zoneMultiplier: number;
  zone: string;            // zone key
  zoneName: string;        // display name
  totalFare: number;
  estimatedTime: number;   // in minutes
  nearestStore: typeof STORE_LOCATIONS[0];
  isPickup?: boolean;
}

export interface DeliveryOptions {
  quotes: DeliveryQuote[];
  recommended: DeliveryQuote;
  pickupOption: DeliveryQuote;
}

/**
 * Calculate distance between two coordinates using Haversine formula
 */
export const calculateDistance = (
  lat1: number, 
  lng1: number, 
  lat2: number, 
  lng2: number
): number => {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

/**
 * Find the nearest store to a given location
 */
export const findNearestStore = (lat: number, lng: number) => {
  let nearest = STORE_LOCATIONS[0];
  let minDistance = calculateDistance(lat, lng, nearest.lat, nearest.lng);

  STORE_LOCATIONS.forEach(store => {
    const distance = calculateDistance(lat, lng, store.lat, store.lng);
    if (distance < minDistance) {
      minDistance = distance;
      nearest = store;
    }
  });

  return { store: nearest, distance: minDistance };
};

/**
 * Determine zone based on province/city
 */
const getZone = (province: string): { key: string; name: string; multiplier: number } => {
  const prov = province.toLowerCase().trim();
  
  // Cavite (where store is located - base rate)
  if (prov.includes('cavite') || prov.includes('dasmariñas') || prov.includes('dasmarinas') ||
      prov.includes('imus') || prov.includes('bacoor') || prov.includes('general trias') ||
      prov.includes('kawit') || prov.includes('rosario') || prov.includes('noveleta')) {
    return { key: 'cavite', ...ZONES.cavite };
  }
  
  // Laguna (nearby)
  if (prov.includes('laguna') || prov.includes('biñan') || prov.includes('binan') ||
      prov.includes('santa rosa') || prov.includes('calamba') || prov.includes('san pedro')) {
    return { key: 'laguna', ...ZONES.laguna };
  }
  
  // Metro Manila
  if (prov.includes('metro manila') || prov.includes('ncr') || 
      ['manila', 'quezon', 'makati', 'pasig', 'taguig', 'mandaluyong', 
       'pasay', 'parañaque', 'paranaque', 'muntinlupa', 'las piñas', 
       'las pinas', 'marikina', 'caloocan', 'malabon', 'navotas', 
       'valenzuela', 'pateros', 'san juan'].some(c => prov.includes(c))) {
    return { key: 'metro_manila', ...ZONES.metro_manila };
  }
  
  if (prov.includes('rizal')) return { key: 'rizal', ...ZONES.rizal };
  if (prov.includes('bulacan')) return { key: 'bulacan', ...ZONES.bulacan };
  if (prov.includes('batangas')) return { key: 'batangas', ...ZONES.batangas };
  
  return { key: 'provincial', ...ZONES.provincial };
};

/**
 * Calculate delivery fare for a specific vehicle type
 */
const calculateFare = (
  distance: number,
  vehicleType: keyof typeof LALAMOVE_RATES,
  zoneMultiplier: number
): { baseFare: number; distanceCharge: number; total: number } => {
  const rates = LALAMOVE_RATES[vehicleType];
  const baseFare = rates.baseFare;
  
  // Calculate extra distance charge (after first 4km)
  const extraDistance = Math.max(0, distance - rates.baseDistance);
  const distanceCharge = Math.ceil(extraDistance) * rates.perKmRate;
  
  // Apply zone multiplier to total
  const subtotal = baseFare + distanceCharge;
  const total = Math.round(subtotal * zoneMultiplier);
  
  return {
    baseFare,
    distanceCharge: Math.round(distanceCharge * zoneMultiplier),
    total,
  };
};

/**
 * Get route distance using OSRM (more accurate than straight-line)
 */
const getRouteDistance = async (
  fromLat: number,
  fromLng: number,
  toLat: number,
  toLng: number
): Promise<{ distance: number; duration: number } | null> => {
  try {
    const response = await fetch(
      `https://router.project-osrm.org/route/v1/driving/${fromLng},${fromLat};${toLng},${toLat}?overview=false`
    );
    
    if (!response.ok) return null;
    
    const data = await response.json();
    
    if (data.code !== 'Ok' || !data.routes || data.routes.length === 0) {
      return null;
    }
    
    return {
      distance: data.routes[0].distance / 1000, // Convert to km
      duration: data.routes[0].duration / 60,    // Convert to minutes
    };
  } catch (error) {
    console.error('Route calculation failed:', error);
    return null;
  }
};

/**
 * Get all delivery quotes including store pickup
 */
export const getDeliveryQuotes = async (
  address: DeliveryAddress,
  _orderTotal: number = 0
): Promise<DeliveryOptions> => {
  const nearestStore = STORE_LOCATIONS[0]; // We only have one store
  let distance: number;
  let routeDuration: number | null = null;
  
  // Try to get accurate route distance
  if (address.lat && address.lng) {
    const route = await getRouteDistance(
      nearestStore.lat,
      nearestStore.lng,
      address.lat,
      address.lng
    );
    
    if (route) {
      distance = route.distance;
      routeDuration = route.duration;
    } else {
      // Fallback to straight-line distance * 1.3 (road factor)
      distance = calculateDistance(
        nearestStore.lat, nearestStore.lng,
        address.lat, address.lng
      ) * 1.3;
    }
  } else {
    // Estimate based on city/province
    const zone = getZone(address.province || address.city);
    
    // Base distance estimates per zone
    const zoneDistances: Record<string, number> = {
      cavite: 8,
      laguna: 15,
      metro_manila: 35,
      rizal: 45,
      bulacan: 55,
      batangas: 40,
      provincial: 60,
    };
    
    distance = zoneDistances[zone.key] || 30;
  }
  
  const zone = getZone(address.province || address.city);
  const quotes: DeliveryQuote[] = [];
  
  // Calculate for each vehicle type
  for (const [type, rates] of Object.entries(LALAMOVE_RATES)) {
    const fareCalc = calculateFare(distance, type as keyof typeof LALAMOVE_RATES, zone.multiplier);
    const estimatedTime = routeDuration 
      ? Math.round(routeDuration) 
      : Math.round(distance * rates.estimatedMinutes);
    
    quotes.push({
      vehicleType: type as keyof typeof LALAMOVE_RATES,
      vehicleLabel: rates.label,
      description: rates.description,
      distance: Math.round(distance * 10) / 10,
      baseFare: fareCalc.baseFare,
      distanceCharge: fareCalc.distanceCharge,
      zoneMultiplier: zone.multiplier,
      zone: zone.key,
      zoneName: zone.name,
      totalFare: fareCalc.total,
      estimatedTime,
      nearestStore,
      isPickup: false,
    });
  }
  
  // Sort by price
  quotes.sort((a, b) => a.totalFare - b.totalFare);
  
  // Create store pickup option (FREE)
  const pickupOption: DeliveryQuote = {
    vehicleType: 'store_pickup',
    vehicleLabel: 'Store Pickup',
    description: 'Pick up at Fragranza Dasmariñas - FREE',
    distance: 0,
    baseFare: 0,
    distanceCharge: 0,
    zoneMultiplier: 1,
    zone: 'cavite',
    zoneName: 'Dasmariñas, Cavite',
    totalFare: 0,
    estimatedTime: 0,
    nearestStore,
    isPickup: true,
  };
  
  return {
    quotes,
    recommended: quotes[0], // Cheapest delivery option
    pickupOption,
  };
};

/**
 * Get simple shipping cost (for checkout summary)
 */
export const getShippingCost = async (
  address: DeliveryAddress
): Promise<{ cost: number; estimatedTime: string }> => {
  const options = await getDeliveryQuotes(address);
  const cheapest = options.recommended;
  
  return {
    cost: cheapest.totalFare,
    estimatedTime: `${cheapest.estimatedTime}-${cheapest.estimatedTime + 30} mins`,
  };
};

/**
 * Format currency for display
 */
export const formatCurrency = (amount: number): string => {
  return `₱${amount.toLocaleString()}`;
};

/**
 * Get route with full details using OSRM
 */
export const getRoute = async (
  fromLat: number,
  fromLng: number,
  toLat: number,
  toLng: number
): Promise<{
  distance: number;
  duration: number;
  coordinates: [number, number][];
} | null> => {
  try {
    const response = await fetch(
      `https://router.project-osrm.org/route/v1/driving/${fromLng},${fromLat};${toLng},${toLat}?overview=full&geometries=geojson`
    );
    
    if (!response.ok) return null;
    
    const data = await response.json();
    
    if (data.code !== 'Ok' || !data.routes || data.routes.length === 0) {
      return null;
    }
    
    const route = data.routes[0];
    const coordinates: [number, number][] = route.geometry.coordinates.map(
      (coord: [number, number]) => [coord[1], coord[0]]
    );
    
    return {
      distance: route.distance / 1000,
      duration: route.duration / 60,
      coordinates,
    };
  } catch (error) {
    console.error('Route calculation failed:', error);
    return null;
  }
};

export default {
  getDeliveryQuotes,
  getShippingCost,
  findNearestStore,
  calculateDistance,
  getRoute,
  formatCurrency,
  STORE_LOCATIONS,
  LALAMOVE_RATES,
};
