import { ticketStore } from '../store/ticketStore.js';
import { config } from '../config.js';

export class PassengerCounter {
  /**
   * Determine occupancy classification based on headcount vs capacity
   */
  static getOccupancyStatus(passengerCount, capacity = config.maxBusCapacity) {
    const percentage = Math.min(100, Math.round((passengerCount / capacity) * 100));

    let status = 'seats_available'; // < 50%
    let label = 'Seats Available';
    let color = '#10B981'; // Green

    if (percentage >= 80) {
      status = 'crowded';
      label = 'Crowded / Rush';
      color = '#EF4444'; // Red
    } else if (percentage >= 50) {
      status = 'standing';
      label = 'Standing Room Only';
      color = '#F59E0B'; // Amber
    }

    return {
      occupancy_status: status,
      occupancy_label: label,
      occupancy_percentage: percentage,
      occupancy_color: color,
    };
  }

  /**
   * Handle ticket issuance from conductor machine
   */
  static async handleTicketIssued({
    bus_id,
    route_id,
    boarding_stop_id,
    boarding_stop_name,
    destination_stop_id,
    destination_stop_name,
    passenger_count = 1,
    fare_inr = 10,
  }) {
    const ticket = await ticketStore.issueTicket({
      bus_id,
      route_id,
      boarding_stop_id,
      boarding_stop_name,
      destination_stop_id,
      destination_stop_name,
      passenger_count,
      fare_inr,
    });

    const liveCount = ticketStore.getLivePassengerCount(bus_id);
    const occupancy = this.getOccupancyStatus(liveCount);

    return {
      ticket,
      passenger_count: liveCount,
      ...occupancy,
    };
  }

  /**
   * Handle bus arrival at a stop: alight all passengers whose ticket destination is this stop
   */
  static async handleStopArrival(bus_id, stop_id, stop_name = '') {
    const result = await ticketStore.processAlightingAtStop(bus_id, stop_id, stop_name);
    const occupancy = this.getOccupancyStatus(result.remainingCount);

    return {
      stop_id,
      stop_name,
      alighted_count: result.alightedCount,
      alighted_tickets: result.alightedTickets,
      passenger_count: result.remainingCount,
      ...occupancy,
    };
  }
}
