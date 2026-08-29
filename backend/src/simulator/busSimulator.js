import { routes, initialBuses, haversineDistance } from '../data/routes.js';
import { busApiIngestion } from '../ingestion/busApiIngest.js';
import { config } from '../config.js';

class BusSimulator {
  constructor() {
    this.routesById = new Map(routes.map((r) => [r.route_id, r]));
    this.buses = [];
    this.timer = null;
    this.isRunning = false;
    this.speedMultiplier = config.speedMultiplier || 1.0;
    this.tickIntervalMs = config.simulationTickMs || 1000;
  }

  async initialize() {
    this.buses = initialBuses.map((busDef) => {
      const route = this.routesById.get(busDef.route_id);
      const totalKm = route.total_distance_km;
      const initialDistKm = (busDef.progress_pct / 100) * totalKm;

      return {
        ...busDef,
        distance_along_km: initialDistKm,
        dwellTicksRemaining: 0,
        lastStopId: null,
      };
    });

    // Seed initial active tickets for buses that start along their route
    for (const bus of this.buses) {
      await this.seedInitialTickets(bus);
    }
  }

  async seedInitialTickets(bus) {
    const route = this.routesById.get(bus.route_id);
    if (!route) return;

    // Find stops before current location and stops ahead
    const stopsPassed = route.stops.filter((s) => s.distance_km <= bus.distance_along_km);
    const stopsAhead = route.stops.filter((s) => s.distance_km > bus.distance_along_km);

    if (stopsPassed.length > 0 && stopsAhead.length > 0) {
      // Issue 15 - 35 initial tickets from past stops to future stops
      const count = 15 + Math.floor(Math.random() * 20);
      for (let i = 0; i < count; i++) {
        const board = stopsPassed[Math.floor(Math.random() * stopsPassed.length)];
        const dest = stopsAhead[Math.floor(Math.random() * stopsAhead.length)];
        await busApiIngestion.ingestTicketIssuance({
          bus_id: bus.bus_id,
          route_id: bus.route_id,
          boarding_stop_id: board.stop_id,
          destination_stop_id: dest.stop_id,
          passenger_count: 1,
          fare_inr: 10 + Math.abs(dest.sequence - board.sequence) * 5,
        });
      }
    }
  }

  start() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.timer = setInterval(() => this.tick(), this.tickIntervalMs);
    console.log(`🚌 Bus & Ticketing Simulator started (${this.buses.length} buses, speed: ${this.speedMultiplier}x)`);
  }

  pause() {
    this.isRunning = false;
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    console.log('⏸️ Bus Simulator paused');
  }

  setSpeed(multiplier) {
    this.speedMultiplier = Math.max(0.5, Math.min(10, multiplier));
    console.log(`⏩ Simulation speed set to ${this.speedMultiplier}x`);
  }

  async tick() {
    for (const bus of this.buses) {
      const route = this.routesById.get(bus.route_id);
      if (!route) continue;

      // Handle dwelling at a stop
      if (bus.dwellTicksRemaining > 0) {
        bus.dwellTicksRemaining--;
        // Bus stays in place during dwell
        continue;
      }

      // Calculate distance traveled in this tick: (speed km/h * speedMultiplier) * (dt_hours)
      const dtHours = (this.tickIntervalMs / 1000) / 3600;
      const stepDistanceKm = bus.speed_kmph * this.speedMultiplier * dtHours;

      bus.distance_along_km += bus.direction * stepDistanceKm;

      // Check endpoints / reversal
      if (bus.distance_along_km >= route.total_distance_km) {
        bus.distance_along_km = route.total_distance_km;
        bus.direction = -1; // turnaround
        bus.dwellTicksRemaining = Math.round(5 / this.speedMultiplier);
      } else if (bus.distance_along_km <= 0) {
        bus.distance_along_km = 0;
        bus.direction = 1; // turnaround
        bus.dwellTicksRemaining = Math.round(5 / this.speedMultiplier);
      }

      // Find coordinate on polyline corresponding to distance_along_km
      const coord = this.getCoordinateAtDistance(route, bus.distance_along_km);

      // Add realistic GPS noise (±0.00008 degrees ~ 8-10 meters)
      const latNoise = (Math.random() - 0.5) * 0.00015;
      const lngNoise = (Math.random() - 0.5) * 0.00015;
      const rawLat = coord[0] + latNoise;
      const rawLng = coord[1] + lngNoise;

      // Check if bus reached a stop along route
      const reachedStop = this.checkStopArrival(bus, route);
      if (reachedStop && reachedStop.stop_id !== bus.lastStopId) {
        bus.lastStopId = reachedStop.stop_id;
        bus.dwellTicksRemaining = Math.round(4 / this.speedMultiplier);

        // Conductor machine issues tickets to new boarding passengers
        await this.simulateConductorTicketingAtStop(bus, route, reachedStop);
      } else if (!reachedStop) {
        bus.lastStopId = null;
      }

      // Ingest location update through busAPI pipeline
      await busApiIngestion.ingestLocationTelemetry({
        bus_id: bus.bus_id,
        route_id: bus.route_id,
        raw_lat: rawLat,
        raw_lng: rawLng,
        speed_kmph: Math.round(bus.speed_kmph + (Math.random() * 4 - 2)),
        direction: bus.direction,
      });
    }
  }

  checkStopArrival(bus, route) {
    for (const stop of route.stops) {
      if (Math.abs(bus.distance_along_km - stop.distance_km) < 0.06) {
        return stop;
      }
    }
    return null;
  }

  async simulateConductorTicketingAtStop(bus, route, currentStop) {
    // Determine possible destination stops down the travel line
    let candidateDestinations = [];
    if (bus.direction === 1) {
      candidateDestinations = route.stops.filter((s) => s.sequence > currentStop.sequence);
    } else {
      candidateDestinations = route.stops.filter((s) => s.sequence < currentStop.sequence);
    }

    if (candidateDestinations.length === 0) return;

    // Simulate 2 to 7 passengers boarding at this stop
    const passengersToBoard = 2 + Math.floor(Math.random() * 6);

    for (let i = 0; i < passengersToBoard; i++) {
      const destStop = candidateDestinations[Math.floor(Math.random() * candidateDestinations.length)];
      const numTickets = Math.random() < 0.25 ? 2 : 1; // occasional group ticket (2 people)

      await busApiIngestion.ingestTicketIssuance({
        bus_id: bus.bus_id,
        route_id: bus.route_id,
        boarding_stop_id: currentStop.stop_id,
        destination_stop_id: destStop.stop_id,
        passenger_count: numTickets,
        fare_inr: 10 + Math.abs(destStop.sequence - currentStop.sequence) * 5,
      });
    }
  }

  getCoordinateAtDistance(route, targetDistKm) {
    const polyline = route.polyline;
    const cumDistances = route.cumulative_distances;

    if (targetDistKm <= 0) return polyline[0];
    if (targetDistKm >= route.total_distance_km) return polyline[polyline.length - 1];

    for (let i = 0; i < cumDistances.length - 1; i++) {
      if (targetDistKm >= cumDistances[i] && targetDistKm <= cumDistances[i + 1]) {
        const segLen = cumDistances[i + 1] - cumDistances[i];
        const t = segLen > 0 ? (targetDistKm - cumDistances[i]) / segLen : 0;
        const p1 = polyline[i];
        const p2 = polyline[i + 1];
        return [
          p1[0] + t * (p2[0] - p1[0]),
          p1[1] + t * (p2[1] - p1[1]),
        ];
      }
    }
    return polyline[0];
  }

  async reset() {
    this.pause();
    await this.initialize();
    this.start();
  }

  getStatus() {
    return {
      isRunning: this.isRunning,
      speedMultiplier: this.speedMultiplier,
      busesCount: this.buses.length,
      tickIntervalMs: this.tickIntervalMs,
    };
  }
}

export const busSimulator = new BusSimulator();
