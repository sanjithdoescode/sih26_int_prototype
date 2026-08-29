export class EtaCalculator {
  /**
   * Format seconds into friendly ETA string
   */
  static formatEta(seconds) {
    if (seconds <= 45) return 'Arriving now';
    const minutes = Math.round(seconds / 60);
    if (minutes <= 1) return '1 min';
    return `${minutes} mins`;
  }

  /**
   * Calculate ETAs for all upcoming stops for a given bus along its route
   */
  static calculateUpcomingEtas(bus, route) {
    const currentDist = bus.distance_along_polyline_km || 0;
    const direction = bus.direction || 1; // 1 = forward, -1 = reverse
    const speed = Math.max(15, bus.speed_kmph || 25); // km/h

    const upcoming = [];
    const intermediateDwellSeconds = 30;

    let intermediateCount = 0;

    if (direction === 1) {
      // Forward direction: stops with distance_km >= currentDist
      for (const stop of route.stops) {
        if (stop.distance_km >= currentDist - 0.05) {
          const distKm = Math.max(0, stop.distance_km - currentDist);
          const travelSeconds = (distKm / speed) * 3600;
          const totalSeconds = Math.round(travelSeconds + intermediateCount * intermediateDwellSeconds);

          upcoming.push({
            stop_id: stop.stop_id,
            stop_name: stop.name,
            distance_km: parseFloat(distKm.toFixed(2)),
            eta_seconds: totalSeconds,
            eta_text: this.formatEta(totalSeconds),
            sequence: stop.sequence,
          });

          intermediateCount++;
        }
      }
    } else {
      // Reverse direction: stops in reverse order where distance_km <= currentDist
      const reversedStops = [...route.stops].reverse();
      for (const stop of reversedStops) {
        if (stop.distance_km <= currentDist + 0.05) {
          const distKm = Math.max(0, currentDist - stop.distance_km);
          const travelSeconds = (distKm / speed) * 3600;
          const totalSeconds = Math.round(travelSeconds + intermediateCount * intermediateDwellSeconds);

          upcoming.push({
            stop_id: stop.stop_id,
            stop_name: stop.name,
            distance_km: parseFloat(distKm.toFixed(2)),
            eta_seconds: totalSeconds,
            eta_text: this.formatEta(totalSeconds),
            sequence: stop.sequence,
          });

          intermediateCount++;
        }
      }
    }

    const nextStop = upcoming.length > 0 ? upcoming[0] : null;

    return {
      next_stop: nextStop,
      upcoming_stops: upcoming,
    };
  }
}
