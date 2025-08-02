import express from 'express';

const router = express.Router();

router.get('/', (req, res) => {
  res.send('API root: ComplianceWatch backend is working.');
});

// Example endpoint for future:
router.get('/healthcheck', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

export default router;

