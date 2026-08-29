import { MongoClient } from 'mongodb';
import { config } from '../config.js';

class Database {
  constructor() {
    this.client = null;
    this.db = null;
    this.isConnected = false;
    this.memoryStore = {
      routes: [],
      ticket_events: [],
      trip_logs: [],
    };
  }

  async connect() {
    try {
      this.client = new MongoClient(config.mongoUrl, {
        serverSelectionTimeoutMS: 2000,
      });
      await this.client.connect();
      this.db = this.client.db();
      this.isConnected = true;
      console.log('✅ Connected to MongoDB at', config.mongoUrl);

      // Create indexes for efficient ticket lookups
      await this.db.collection('ticket_events').createIndex({ bus_id: 1, status: 1 });
      await this.db.collection('ticket_events').createIndex({ destination_stop_id: 1 });
    } catch (err) {
      console.warn('⚠️ MongoDB connection failed, falling back to In-Memory store:', err.message);
      this.isConnected = false;
    }
  }

  async insertTicketEvent(event) {
    if (this.isConnected && this.db) {
      try {
        await this.db.collection('ticket_events').insertOne({ ...event });
      } catch (err) {
        console.error('Mongo insert error:', err.message);
      }
    }
    this.memoryStore.ticket_events.push({ ...event });
  }

  async updateTicketStatus(ticketId, status, alightedAt = null) {
    if (this.isConnected && this.db) {
      try {
        await this.db.collection('ticket_events').updateOne(
          { ticket_id: ticketId },
          { $set: { status, alighted_at: alightedAt } }
        );
      } catch (err) {
        console.error('Mongo update error:', err.message);
      }
    }
    const memTicket = this.memoryStore.ticket_events.find((t) => t.ticket_id === ticketId);
    if (memTicket) {
      memTicket.status = status;
      if (alightedAt) memTicket.alighted_at = alightedAt;
    }
  }

  async getActiveTicketsForBus(busId) {
    if (this.isConnected && this.db) {
      try {
        return await this.db
          .collection('ticket_events')
          .find({ bus_id: busId, status: 'active' })
          .toArray();
      } catch (err) {
        console.error('Mongo query error:', err.message);
      }
    }
    return this.memoryStore.ticket_events.filter(
      (t) => t.bus_id === busId && t.status === 'active'
    );
  }

  async getRecentTicketEvents(busId = null, limit = 30) {
    if (this.isConnected && this.db) {
      try {
        const query = busId ? { bus_id: busId } : {};
        return await this.db
          .collection('ticket_events')
          .find(query)
          .sort({ issued_at: -1 })
          .limit(limit)
          .toArray();
      } catch (err) {
        console.error('Mongo query error:', err.message);
      }
    }
    let list = this.memoryStore.ticket_events;
    if (busId) {
      list = list.filter((t) => t.bus_id === busId);
    }
    return [...list].reverse().slice(0, limit);
  }

  async getTotalTicketsIssuedCount() {
    if (this.isConnected && this.db) {
      try {
        return await this.db.collection('ticket_events').countDocuments();
      } catch (err) {
        // fallback
      }
    }
    return this.memoryStore.ticket_events.length;
  }
}

export const db = new Database();
