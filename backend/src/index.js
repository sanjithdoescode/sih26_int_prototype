import { config } from './config.js';
import { db } from './store/db.js';
import { liveStore } from './store/liveStore.js';
import { busSimulator } from './simulator/busSimulator.js';
import { createServer } from './server.js';

async function main() {
  console.log('🚀 Starting Real-Time Public Transport Tracker Backend...');

  // 1. Initialize persistent store (MongoDB with in-memory fallback)
  await db.connect();

  // 2. Initialize live state store (Redis with in-memory fallback)
  await liveStore.connect();

  // 3. Create HTTP & WebSocket Server
  const { httpServer } = createServer();

  // 4. Initialize and start bus & ticketing machine simulator
  await busSimulator.initialize();
  busSimulator.start();

  httpServer.listen(config.port, () => {
    console.log(`📡 HTTP Server & REST API running on http://localhost:${config.port}`);
    console.log(`🔌 WebSocket Stream live at ws://localhost:${config.port}/ws`);
    console.log(`🚌 Simulated fleet active on Amritsar corridors`);
  });
}

main().catch((err) => {
  console.error('Fatal startup error:', err);
  process.exit(1);
});
