import { v4 as uuidv4 } from 'uuid';
import { db } from './db.js';

class TicketStore {
  constructor() {
    // bus_id -> Map<ticket_id, ticketObject>
    this.activeTicketsByBus = new Map();
  }

  initBus(busId) {
    if (!this.activeTicketsByBus.has(busId)) {
      this.activeTicketsByBus.set(busId, new Map());
    }
  }

  async issueTicket({
    bus_id,
    route_id,
    boarding_stop_id,
    boarding_stop_name,
    destination_stop_id,
    destination_stop_name,
    passenger_count = 1,
    fare_inr = 10,
  }) {
    this.initBus(bus_id);

    const ticket_id = `t_${Math.floor(1000 + Math.random() * 9000)}`;
    const issued_at = new Date().toISOString();

    const ticket = {
      ticket_id,
      bus_id,
      route_id,
      boarding_stop_id,
      boarding_stop_name,
      destination_stop_id,
      destination_stop_name,
      passenger_count,
      fare_inr,
      issued_at,
      alighted_at: null,
      status: 'active',
    };

    // Store in active in-memory set for rapid lookup
    this.activeTicketsByBus.get(bus_id).set(ticket_id, ticket);

    // Save to persistent audit log (MongoDB / store)
    await db.insertTicketEvent(ticket);

    return ticket;
  }

  async processAlightingAtStop(bus_id, stop_id, stop_name = '') {
    this.initBus(bus_id);
    const busTickets = this.activeTicketsByBus.get(bus_id);
    const alightedTickets = [];
    let totalPassengersAlighted = 0;
    const now = new Date().toISOString();

    for (const [ticketId, ticket] of busTickets.entries()) {
      if (ticket.destination_stop_id === stop_id) {
        ticket.status = 'alighted';
        ticket.alighted_at = now;
        alightedTickets.push(ticket);
        totalPassengersAlighted += ticket.passenger_count || 1;
        busTickets.delete(ticketId);

        // Update in persistent store
        await db.updateTicketStatus(ticketId, 'alighted', now);
      }
    }

    return {
      alightedCount: totalPassengersAlighted,
      alightedTickets,
      remainingCount: this.getLivePassengerCount(bus_id),
    };
  }

  getLivePassengerCount(bus_id) {
    this.initBus(bus_id);
    let total = 0;
    for (const ticket of this.activeTicketsByBus.get(bus_id).values()) {
      total += ticket.passenger_count || 1;
    }
    return total;
  }

  getActiveTickets(bus_id) {
    this.initBus(bus_id);
    return Array.from(this.activeTicketsByBus.get(bus_id).values());
  }

  async getRecentHistory(busId = null, limit = 25) {
    return await db.getRecentTicketEvents(busId, limit);
  }

  async getTotalTicketsIssued() {
    return await db.getTotalTicketsIssuedCount();
  }

  clearBus(busId) {
    if (this.activeTicketsByBus.has(busId)) {
      this.activeTicketsByBus.get(busId).clear();
    }
  }
}

export const ticketStore = new TicketStore();
