import express from 'express';
import { routes } from '../data/routes.js';
import { liveStore } from '../store/liveStore.js';
import { ticketStore } from '../store/ticketStore.js';
import { busApiIngestion } from '../ingestion/busApiIngest.js';

const router = express.Router();
const routesById = new Map(routes.map((r) => [r.route_id, r]));

// GET /api/routes
router.get('/routes', (req, res) => {
  res.json({
    success: true,
    count: routes.length,
    routes: routes.map((r) => ({
      route_id: r.route_id,
      route_number: r.route_number,
      name: r.name,
      color: r.color,
      total_distance_km: r.total_distance_km,
      stops_count: r.stops.length,
      stops: r.stops,
      polyline: r.polyline,
    })),
  });
});

// GET /api/routes/:id
router.get('/routes/:id', (req, res) => {
  const route = routesById.get(req.params.id);
  if (!route) {
    return res.status(404).json({ success: false, error: 'Route not found' });
  }
  res.json({ success: true, route });
});

// GET /api/buses/live?route_id=
router.get('/buses/live', async (req, res) => {
  try {
    let buses = await liveStore.getAllBuses();
    if (req.query.route_id) {
      buses = buses.filter((b) => b.route_id === req.query.route_id);
    }
    res.json({
      success: true,
      count: buses.length,
      buses,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/routes/:id/eta
router.get('/routes/:id/eta', async (req, res) => {
  const route = routesById.get(req.params.id);
  if (!route) {
    return res.status(404).json({ success: false, error: 'Route not found' });
  }

  const allBuses = await liveStore.getAllBuses();
  const routeBuses = allBuses.filter((b) => b.route_id === req.params.id);

  // Group upcoming arrivals by stop
  const stopEtas = route.stops.map((stop) => {
    const approachingBuses = [];
    for (const bus of routeBuses) {
      const match = bus.upcoming_stops?.find((s) => s.stop_id === stop.stop_id);
      if (match) {
        approachingBuses.push({
          bus_id: bus.bus_id,
          bus_number: bus.bus_number,
          eta_seconds: match.eta_seconds,
          eta_text: match.eta_text,
          distance_km: match.distance_km,
          passenger_count: bus.passenger_count,
          occupancy_status: bus.occupancy_status,
          occupancy_label: bus.occupancy_label,
          occupancy_color: bus.occupancy_color,
        });
      }
    }
    approachingBuses.sort((a, b) => a.eta_seconds - b.eta_seconds);

    return {
      stop_id: stop.stop_id,
      stop_name: stop.name,
      sequence: stop.sequence,
      distance_km: stop.distance_km,
      approaching_buses: approachingBuses,
      next_bus: approachingBuses[0] || null,
    };
  });

  res.json({
    success: true,
    route_id: route.route_id,
    route_name: route.name,
    stops_eta: stopEtas,
  });
});

// GET /api/buses/:id/tickets
router.get('/buses/:id/tickets', async (req, res) => {
  try {
    const busId = req.params.id;
    const active = ticketStore.getActiveTickets(busId);
    const recent = await ticketStore.getRecentHistory(busId, 20);

    res.json({
      success: true,
      bus_id: busId,
      active_count: active.length,
      active_tickets: active,
      recent_history: recent,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/tickets/issue (Manual Conductor Ticketing Machine)
router.post('/tickets/issue', async (req, res) => {
  try {
    const { bus_id, route_id, boarding_stop_id, destination_stop_id, passenger_count, fare_inr } = req.body;
    if (!bus_id || !route_id || !boarding_stop_id || !destination_stop_id) {
      return res.status(400).json({ success: false, error: 'Missing required ticket fields' });
    }

    const result = await busApiIngestion.ingestTicketIssuance({
      bus_id,
      route_id,
      boarding_stop_id,
      destination_stop_id,
      passenger_count: parseInt(passenger_count || '1', 10),
      fare_inr: parseFloat(fare_inr || '10'),
    });

    res.json({
      success: true,
      message: 'Ticket issued successfully',
      ...result,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/metrics
router.get('/metrics', async (req, res) => {
  try {
    const buses = await liveStore.getAllBuses();
    const totalTickets = await ticketStore.getTotalTicketsIssued();

    let totalPassengers = 0;
    let totalCapacity = 0;
    for (const b of buses) {
      totalPassengers += b.passenger_count || 0;
      totalCapacity += b.capacity || 50;
    }

    const avgOccupancy = totalCapacity > 0 ? Math.round((totalPassengers / totalCapacity) * 100) : 0;

    res.json({
      success: true,
      metrics: {
        active_buses: buses.length,
        total_live_commuters: totalPassengers,
        average_occupancy_pct: avgOccupancy,
        total_tickets_issued: totalTickets,
        system_status: 'Operational',
        city: 'Amritsar, Punjab',
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
