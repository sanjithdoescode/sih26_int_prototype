// Haversine distance in kilometers
export function haversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Generate smooth intermediate polyline points between major coordinates
function interpolatePath(coords, stepKm = 0.05) {
  const path = [];
  for (let i = 0; i < coords.length - 1; i++) {
    const [lat1, lng1] = coords[i];
    const [lat2, lng2] = coords[i + 1];
    const dist = haversineDistance(lat1, lng1, lat2, lng2);
    const steps = Math.max(1, Math.ceil(dist / stepKm));
    for (let s = 0; s < steps; s++) {
      const frac = s / steps;
      path.push([
        lat1 + (lat2 - lat1) * frac,
        lng1 + (lng2 - lng1) * frac,
      ]);
    }
  }
  path.push(coords[coords.length - 1]);
  return path;
}

// Build enriched route object with cumulative distances
function buildRoute(raw) {
  const polyline = interpolatePath(raw.keyWaypoints, 0.04);
  
  // Calculate cumulative distance for each point in the polyline
  const cumulativeDistances = [0];
  let totalDist = 0;
  for (let i = 1; i < polyline.length; i++) {
    totalDist += haversineDistance(
      polyline[i - 1][0],
      polyline[i - 1][1],
      polyline[i][0],
      polyline[i][1]
    );
    cumulativeDistances.push(totalDist);
  }

  // Calculate distance_along_route for each stop by finding closest polyline vertex
  const enrichedStops = raw.stops.map((stop, idx) => {
    let bestDist = Infinity;
    let bestPolyIndex = 0;
    for (let i = 0; i < polyline.length; i++) {
      const d = haversineDistance(stop.lat, stop.lng, polyline[i][0], polyline[i][1]);
      if (d < bestDist) {
        bestDist = d;
        bestPolyIndex = i;
      }
    }
    return {
      ...stop,
      sequence: idx,
      distance_km: parseFloat(cumulativeDistances[bestPolyIndex].toFixed(3)),
      polyline_index: bestPolyIndex,
    };
  });

  return {
    route_id: raw.route_id,
    route_number: raw.route_number,
    name: raw.name,
    color: raw.color,
    total_distance_km: parseFloat(totalDist.toFixed(2)),
    stops: enrichedStops,
    polyline,
    cumulative_distances: cumulativeDistances,
  };
}

const rawRoutes = [
  {
    route_id: "R1",
    route_number: "101",
    name: "Amritsar Junction - Sri Harmandir Sahib (Golden Temple)",
    color: "#2563EB", // Royal Blue
    keyWaypoints: [
      [31.6335, 74.8655], // Amritsar Railway Junction
      [31.6310, 74.8625],
      [31.6295, 74.8600], // Durgiana Mandir Chowk
      [31.6275, 74.8640],
      [31.6275, 74.8685], // Sikandari Gate
      [31.6300, 74.8720],
      [31.6318, 74.8755], // Hall Gate / Hall Bazaar
      [31.6290, 74.8765],
      [31.6262, 74.8778], // Town Hall & Partition Museum
      [31.6230, 74.8795],
      [31.6205, 74.8805], // Jallianwala Bagh
      [31.6200, 74.8765], // Sri Harmandir Sahib Heritage Plaza
    ],
    stops: [
      { stop_id: "s101", name: "Amritsar Railway Junction", lat: 31.6335, lng: 74.8655, fare_stage: 1 },
      { stop_id: "s102", name: "Durgiana Mandir Chowk", lat: 31.6295, lng: 74.8600, fare_stage: 2 },
      { stop_id: "s103", name: "Sikandari Gate", lat: 31.6275, lng: 74.8685, fare_stage: 3 },
      { stop_id: "s104", name: "Hall Gate / Hall Bazaar", lat: 31.6318, lng: 74.8755, fare_stage: 4 },
      { stop_id: "s105", name: "Town Hall & Partition Museum", lat: 31.6262, lng: 74.8778, fare_stage: 5 },
      { stop_id: "s106", name: "Jallianwala Bagh", lat: 31.6205, lng: 74.8805, fare_stage: 6 },
      { stop_id: "s107", name: "Sri Harmandir Sahib (Golden Temple)", lat: 31.6200, lng: 74.8765, fare_stage: 7 },
    ],
  },
  {
    route_id: "R2",
    route_number: "204",
    name: "ISBT Amritsar - GNDU & Chheharta (via GT Road)",
    color: "#059669", // Emerald Green
    keyWaypoints: [
      [31.6288, 74.8912], // ISBT Amritsar
      [31.6305, 74.8820],
      [31.6330, 74.8730], // GT Road / Railway Flyover
      [31.6350, 74.8680],
      [31.6360, 74.8640], // Amritsar Junction North
      [31.6368, 74.8550],
      [31.6370, 74.8465], // Putligarh Chowk
      [31.6385, 74.8390],
      [31.6395, 74.8315], // Khalsa College Heritage Gate
      [31.6380, 74.8270],
      [31.6358, 74.8235], // Guru Nanak Dev University (GNDU)
      [31.6348, 74.8170],
      [31.6340, 74.8110], // India Gate Amritsar
      [31.6330, 74.8020],
      [31.6320, 74.7950], // Chheharta Bus Terminus
    ],
    stops: [
      { stop_id: "s201", name: "ISBT Amritsar (Bus Stand)", lat: 31.6288, lng: 74.8912, fare_stage: 1 },
      { stop_id: "s202", name: "GT Road / Railway Flyover", lat: 31.6330, lng: 74.8730, fare_stage: 2 },
      { stop_id: "s203", name: "Amritsar Junction North", lat: 31.6360, lng: 74.8640, fare_stage: 3 },
      { stop_id: "s204", name: "Putligarh Chowk", lat: 31.6370, lng: 74.8465, fare_stage: 4 },
      { stop_id: "s205", name: "Khalsa College Heritage Gate", lat: 31.6395, lng: 74.8315, fare_stage: 5 },
      { stop_id: "s206", name: "Guru Nanak Dev University (GNDU)", lat: 31.6358, lng: 74.8235, fare_stage: 6 },
      { stop_id: "s207", name: "India Gate Amritsar", lat: 31.6340, lng: 74.8110, fare_stage: 7 },
      { stop_id: "s208", name: "Chheharta Bus Terminus", lat: 31.6320, lng: 74.7950, fare_stage: 8 },
    ],
  },
  {
    route_id: "R3",
    route_number: "302",
    name: "ISBT Amritsar - SGRDJ International Airport (ATQ)",
    color: "#7C3AED", // Purple
    keyWaypoints: [
      [31.6288, 74.8912], // ISBT Amritsar
      [31.6340, 74.8820],
      [31.6390, 74.8740], // Crystal Chowk / Mall Road
      [31.6425, 74.8710],
      [31.6465, 74.8690], // Custom Chowk / Company Bagh
      [31.6520, 74.8630],
      [31.6580, 74.8570], // Ranjit Avenue (District Complex)
      [31.6670, 74.8470],
      [31.6780, 74.8360], // Gumtala Bypass
      [31.6880, 74.8240],
      [31.6980, 74.8120], // Raja Sansi Chowk
      [31.7040, 74.8040],
      [31.7085, 74.7975], // SGRDJ International Airport (ATQ)
    ],
    stops: [
      { stop_id: "s301", name: "ISBT Amritsar", lat: 31.6288, lng: 74.8912, fare_stage: 1 },
      { stop_id: "s302", name: "Crystal Chowk (Mall Road)", lat: 31.6390, lng: 74.8740, fare_stage: 2 },
      { stop_id: "s303", name: "Custom Chowk / Company Bagh", lat: 31.6465, lng: 74.8690, fare_stage: 3 },
      { stop_id: "s304", name: "Ranjit Avenue Complex", lat: 31.6580, lng: 74.8570, fare_stage: 4 },
      { stop_id: "s305", name: "Gumtala Bypass", lat: 31.6780, lng: 74.8360, fare_stage: 5 },
      { stop_id: "s306", name: "Raja Sansi Chowk", lat: 31.6980, lng: 74.8120, fare_stage: 6 },
      { stop_id: "s307", name: "SGRDJ International Airport (ATQ)", lat: 31.7085, lng: 74.7975, fare_stage: 7 },
    ],
  },
];

export const routes = rawRoutes.map(buildRoute);

// Seed buses for Amritsar corridors (PB-02 series)
export const initialBuses = [
  {
    bus_id: "PB-02-CC-1024",
    bus_number: "101",
    route_id: "R1",
    capacity: 50,
    progress_pct: 15.0,
    direction: 1, // 1 = forward (0 -> end), -1 = reverse
    speed_kmph: 24,
    conductor_id: "PB-C-104",
  },
  {
    bus_id: "PB-02-CC-1582",
    bus_number: "101",
    route_id: "R1",
    capacity: 50,
    progress_pct: 68.0,
    direction: 1,
    speed_kmph: 26,
    conductor_id: "PB-C-112",
  },
  {
    bus_id: "PB-02-BR-2104",
    bus_number: "204",
    route_id: "R2",
    capacity: 50,
    progress_pct: 22.0,
    direction: 1,
    speed_kmph: 34,
    conductor_id: "PB-C-205",
  },
  {
    bus_id: "PB-02-BR-2340",
    bus_number: "204",
    route_id: "R2",
    capacity: 50,
    progress_pct: 78.0,
    direction: -1,
    speed_kmph: 32,
    conductor_id: "PB-C-219",
  },
  {
    bus_id: "PB-02-AP-3419",
    bus_number: "302",
    route_id: "R3",
    capacity: 50,
    progress_pct: 35.0,
    direction: 1,
    speed_kmph: 38,
    conductor_id: "PB-C-301",
  },
  {
    bus_id: "PB-02-AP-3820",
    bus_number: "302",
    route_id: "R3",
    capacity: 50,
    progress_pct: 72.0,
    direction: -1,
    speed_kmph: 36,
    conductor_id: "PB-C-314",
  },
];
