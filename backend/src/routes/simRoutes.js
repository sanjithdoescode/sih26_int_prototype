import express from 'express';
import { busSimulator } from '../simulator/busSimulator.js';

const router = express.Router();

router.get('/status', (req, res) => {
  res.json({ success: true, ...busSimulator.getStatus() });
});

router.post('/start', (req, res) => {
  busSimulator.start();
  res.json({ success: true, message: 'Simulator started', ...busSimulator.getStatus() });
});

router.post('/pause', (req, res) => {
  busSimulator.pause();
  res.json({ success: true, message: 'Simulator paused', ...busSimulator.getStatus() });
});

router.post('/speed', (req, res) => {
  const { multiplier } = req.body;
  busSimulator.setSpeed(parseFloat(multiplier || '1.0'));
  res.json({ success: true, message: 'Speed updated', ...busSimulator.getStatus() });
});

router.post('/reset', async (req, res) => {
  await busSimulator.reset();
  res.json({ success: true, message: 'Simulator reset to initial positions', ...busSimulator.getStatus() });
});

export default router;
