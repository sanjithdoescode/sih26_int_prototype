import { routes } from '../data/routes.js';
import { mapMatchToRoute } from '../engine/mapMatcher.js';
import { PassengerCounter } from '../engine/passengerCounter.js';
import { EtaCalculator } from '../engine/etaCalculator.js';
import { liveStore } from '../store/liveStore.js';
import { ticketStore } from '../store/ticketStore.js';

class BusApiIngestionLayer {
  constructor() {
    this.wsBroadcaster = null;
    this.routesById = new Map(routes.map((r) => [r.route_id, r]));
    this.lastProcessedStop = new Map(); // bus_id -> stop_id
  }

  setBroadcaster(broadcasterFn) {
    this.wsBroadcaster = broadcasterFn;
  }

  broadcast(eventType, payload) {
    if (this.wsBroadcaster) {
      this.wsBroadcaster({ type: eventType, data: payload, timestamp: new Date().toISOString() });
    }
  }

  /**
   * Ingest raw GPS telemetry from conductor Android terminal (topic: bus/<bus_id>/location)
   */
  async ingestLocationTelemetry({
    bus_id,
    route_id,
    raw_lat,
    raw_lng,
    speed_kmph = 25,
    direction = 1,
    timestamp = new Date().toISOString(),
  }) {
    const route = this.routesById.get(route_id);
    if (!route) {
      console.warn(`Unknown route ${route_id} for bus ${bus_id}`);
      return null;
    }

    // 1. Map-match raw GPS onto route polyline
    const matchResult = mapMatchToRoute(raw_lat, raw_lng, route);

    // 2. Fetch existing bus live state
    let currentState = await liveStore.getBus(bus_id);
    if (!currentState) {
      currentState = {
        bus_id,
        bus_number: route.route_number,
        route_id,
        capacity: 50,
        passenger_count: ticketStore.getLivePassengerCount(bus_id),
      };
    }

    // 3. Detect stop arrival / crossing
    const lastStop = this.lastProcessedStop.get(bus_id);
    const nearbyStop = matchResult.nearby_stop;

    let stopArrivalEvent = null;
    if (nearbyStop && nearbyStop.stop_id !== lastStop) {
      this.lastProcessedStop.set(bus_id, nearbyStop.stop_id);

      // Process passengers alighting whose destination is this stop
      const alighting = await PassengerCounter.handleStopArrival(
        bus_id,
        nearbyStop.stop_id,
        nearbyStop.name
      );

      stopArrivalEvent = {
        bus_id,
        route_id,
        stop_id: nearbyStop.stop_id,
        stop_name: nearbyStop.name,
        alighted_count: alighting.alighted_count,
        remaining_passengers: alighting.passenger_count,
      };

      this.broadcast('STOP_ARRIVAL', stopArrivalEvent);
    } else if (!nearbyStop && lastStop) {
      // Cleared the stop
      this.lastProcessedStop.delete(bus_id);
    }

    // 4. Update live passenger headcount & occupancy status
    const liveHeadcount = ticketStore.getLivePassengerCount(bus_id);
    const occupancy = PassengerCounter.getOccupancyStatus(liveHeadcount, currentState.capacity || 50);

    // 5. Calculate ETAs for upcoming stops
    const busForEta = {
      distance_along_polyline_km: matchResult.distance_along_polyline_km,
      speed_kmph,
      direction,
    };
    const { next_stop, upcoming_stops } = EtaCalculator.calculateUpcomingEtas(busForEta, route);

    // 6. Build updated bus live state (matches Plan Section 4)
    const updatedBusState = {
      bus_id,
      bus_number: currentState.bus_number || route.route_number,
      route_id,
      route_name: route.name,
      route_color: route.color,
      lat: raw_lat,
      lng: raw_lng,
      snapped_lat: matchResult.snapped_lat,
      snapped_lng: matchResult.snapped_lng,
      bearing: matchResult.bearing,
      gps_drift_meters: matchResult.gps_drift_meters,
      speed_kmph,
      direction,
      progress_pct: matchResult.progress_pct,
      distance_along_polyline_km: matchResult.distance_along_polyline_km,
      matched_stop_index: matchResult.matched_stop_index,
      nearby_stop: nearbyStop,
      next_stop,
      upcoming_stops,
      passenger_count: liveHeadcount,
      capacity: currentState.capacity || 50,
      occupancy_status: occupancy.occupancy_status,
      occupancy_label: occupancy.occupancy_label,
      occupancy_percentage: occupancy.occupancy_percentage,
      occupancy_color: occupancy.occupancy_color,
      last_updated: timestamp,
      status: nearbyStop ? 'stopped_at_stop' : 'in_transit',
    };

    // 7. Save to live store (Redis / In-memory)
    await liveStore.setBus(bus_id, updatedBusState);

    return updatedBusState;
  }

  /**
   * Ingest ticket issuance event from conductor Android terminal (topic: bus/<bus_id>/ticket)
   */
  async ingestTicketIssuance({
    bus_id,
    route_id,
    boarding_stop_id,
    destination_stop_id,
    passenger_count = 1,
    fare_inr = 10,
  }) {
    const route = this.routesById.get(route_id);
    const boardingStop = route?.stops.find((s) => s.stop_id === boarding_stop_id);
    const destStop = route?.stops.find((s) => s.stop_id === destination_stop_id);

    const result = await PassengerCounter.handleTicketIssued({
      bus_id,
      route_id,
      boarding_stop_id,
      boarding_stop_name: boardingStop ? boardingStop.name : boarding_stop_id,
      destination_stop_id,
      destination_stop_name: destStop ? destStop.name : destination_stop_id,
      passenger_count,
      fare_inr,
    });

    // Update bus state with new passenger count
    const bus = await liveStore.getBus(bus_id);
    if (bus) {
      bus.passenger_count = result.passenger_count;
      bus.occupancy_status = result.occupancy_status;
      bus.occupancy_label = result.occupancy_label;
      bus.occupancy_percentage = result.occupancy_percentage;
      bus.occupancy_color = result.occupancy_color;
      await liveStore.setBus(bus_id, bus);
    }

    this.broadcast('TICKET_ISSUED', {
      ticket: result.ticket,
      bus_id,
      new_headcount: result.passenger_count,
      occupancy: result,
    });

    return result;
  }
}

export const busApiIngestion = new BusApiIngestionLayer();
