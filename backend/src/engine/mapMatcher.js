import { haversineDistance } from '../data/routes.js';

// Calculate bearing in degrees from point 1 to point 2
export function calculateBearing(lat1, lon1, lat2, lon2) {
  const toRad = Math.PI / 180;
  const toDeg = 180 / Math.PI;
  const y = Math.sin((lon2 - lon1) * toRad) * Math.cos(lat2 * toRad);
  const x =
    Math.cos(lat1 * toRad) * Math.sin(lat2 * toRad) -
    Math.sin(lat1 * toRad) * Math.cos(lat2 * toRad) * Math.cos((lon2 - lon1) * toRad);
  const brng = Math.atan2(y, x) * toDeg;
  return (brng + 360) % 360;
}

// Project point P onto line segment AB (using flat Euclidean approx for short distances)
function projectPointToSegment(p, a, b) {
  const [px, py] = p; // lat, lng
  const [ax, ay] = a;
  const [bx, by] = b;

  const dx = bx - ax;
  const dy = by - ay;
  const lenSq = dx * dx + dy * dy;

  if (lenSq === 0) {
    return { snapped: a, t: 0 };
  }

  let t = ((px - ax) * dx + (py - ay) * dy) / lenSq;
  t = Math.max(0, Math.min(1, t));

  const snapped = [ax + t * dx, ay + t * dy];
  return { snapped, t };
}

/**
 * Snap raw GPS point onto the closest segment of the route polyline.
 * Computes:
 * - snapped_lat, snapped_lng
 * - distance_along_polyline_km
 * - progress_pct
 * - bearing
 * - matched_stop_index
 * - current_or_next_stop
 */
export function mapMatchToRoute(rawLat, rawLng, route, previousState = null) {
  const polyline = route.polyline;
  const cumDistances = route.cumulative_distances;
  const totalDist = route.total_distance_km;

  let minDistanceMeters = Infinity;
  let bestSnapped = [rawLat, rawLng];
  let bestSegIndex = 0;
  let bestT = 0;

  for (let i = 0; i < polyline.length - 1; i++) {
    const a = polyline[i];
    const b = polyline[i + 1];
    const { snapped, t } = projectPointToSegment([rawLat, rawLng], a, b);

    const distKm = haversineDistance(rawLat, rawLng, snapped[0], snapped[1]);
    const distMeters = distKm * 1000;

    if (distMeters < minDistanceMeters) {
      minDistanceMeters = distMeters;
      bestSnapped = snapped;
      bestSegIndex = i;
      bestT = t;
    }
  }

  // Distance along polyline up to snapped point
  const segStartDist = cumDistances[bestSegIndex] || 0;
  const segEndDist = cumDistances[bestSegIndex + 1] || segStartDist;
  const distanceAlongPolylineKm = segStartDist + bestT * (segEndDist - segStartDist);
  const progressPct = totalDist > 0 ? (distanceAlongPolylineKm / totalDist) * 100 : 0;

  // Bearing from current snapped point to next polyline point or previous
  let bearing = 0;
  if (bestSegIndex < polyline.length - 1) {
    const nextPt = polyline[bestSegIndex + 1];
    bearing = calculateBearing(bestSnapped[0], bestSnapped[1], nextPt[0], nextPt[1]);
  } else if (bestSegIndex > 0) {
    const prevPt = polyline[bestSegIndex - 1];
    bearing = calculateBearing(prevPt[0], prevPt[1], bestSnapped[0], bestSnapped[1]);
  }

  // Identify matched stop: the last stop passed along the route
  // A stop is "passed" if stop.distance_km <= distanceAlongPolylineKm
  let matchedStopIndex = 0;
  for (let s = 0; s < route.stops.length; s++) {
    if (route.stops[s].distance_km <= distanceAlongPolylineKm + 0.05) {
      matchedStopIndex = s;
    }
  }

  // Check if bus is currently dwelling/close to a stop (within 60 meters)
  let nearbyStop = null;
  for (const stop of route.stops) {
    const dMeters = haversineDistance(bestSnapped[0], bestSnapped[1], stop.lat, stop.lng) * 1000;
    if (dMeters <= 60) {
      nearbyStop = stop;
      break;
    }
  }

  return {
    raw_lat: rawLat,
    raw_lng: rawLng,
    snapped_lat: parseFloat(bestSnapped[0].toFixed(6)),
    snapped_lng: parseFloat(bestSnapped[1].toFixed(6)),
    gps_drift_meters: parseFloat(minDistanceMeters.toFixed(1)),
    distance_along_polyline_km: parseFloat(distanceAlongPolylineKm.toFixed(3)),
    progress_pct: parseFloat(Math.min(100, Math.max(0, progressPct)).toFixed(1)),
    bearing: Math.round(bearing),
    matched_stop_index: matchedStopIndex,
    nearby_stop: nearbyStop,
  };
}
