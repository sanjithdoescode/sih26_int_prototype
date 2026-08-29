import http from 'http';
import express from 'express';
import cors from 'cors';
import { WebSocketServer, WebSocket } from 'ws';
import { config } from './config.js';
import { routes } from './data/routes.js';
import { liveStore } from './store/liveStore.js';
import { ticketStore } from './store/ticketStore.js';
import { busApiIngestion } from './ingestion/busApiIngest.js';
import apiRoutes from './routes/apiRoutes.js';
import simRoutes from './routes/simRoutes.js';

export function createServer() {
  const app = express();
  app.use(cors());
  app.use(express.json());

  // Mount API endpoints
  app.use('/api', apiRoutes);
  app.use('/api/simulator', simRoutes);

  // Health check
  app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  const httpServer = http.createServer(app);

  // WebSocket Server on path /ws or /buses/stream
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });

  function broadcast(payload) {
    const message = JSON.stringify(payload);
    for (const client of wss.clients) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    }
  }

  // Hook busAPI ingestion broadcast to WebSocket clients
  busApiIngestion.setBroadcaster(broadcast);

  wss.on('connection', async (ws) => {
    // Send immediate snapshot on connection
    try {
      const buses = await liveStore.getAllBuses();
      const recentTickets = await ticketStore.getRecentHistory(null, 15);
      const totalTickets = await ticketStore.getTotalTicketsIssued();

      let totalPassengers = 0;
      for (const b of buses) totalPassengers += b.passenger_count || 0;

      const initialPayload = {
        type: 'INITIAL_STATE',
        data: {
          routes,
          buses,
          recentTickets,
          metrics: {
            active_buses: buses.length,
            total_live_commuters: totalPassengers,
            total_tickets_issued: totalTickets,
          },
        },
        timestamp: new Date().toISOString(),
      };

      ws.send(JSON.stringify(initialPayload));
    } catch (err) {
      console.error('Error sending initial WS state:', err.message);
    }

    ws.on('message', (msg) => {
      try {
        const parsed = JSON.parse(msg.toString());
        if (parsed.type === 'PING') {
          ws.send(JSON.stringify({ type: 'PONG', timestamp: Date.now() }));
        }
      } catch (e) {
        // ignore invalid ping
      }
    });
  });

  // Periodic broadcast of all buses to keep map smooth and synchronized
  const streamInterval = setInterval(async () => {
    if (wss.clients.size > 0) {
      const buses = await liveStore.getAllBuses();
      broadcast({
        type: 'BUSES_STREAM',
        data: {
          buses,
          timestamp: new Date().toISOString(),
        },
      });
    }
  }, 1000);

  return { app, httpServer, wss, streamInterval };
}
