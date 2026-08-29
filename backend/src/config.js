export const config = {
  port: parseInt(process.env.PORT || '4000', 10),
  redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
  mongoUrl: process.env.MONGO_URL || 'mongodb://localhost:27017/transport_tracker',
  simulationTickMs: parseInt(process.env.SIM_TICK_MS || '1000', 10),
  maxBusCapacity: 50,
  speedMultiplier: 1.0,
  gpsNoiseMeters: 10, // Simulated GPS jitter
};
