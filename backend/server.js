require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

const cardRoutes = require('./routes/cards');

const app = express();

app.set('trust proxy', 1); // trust Railway's proxy to get real client IP
app.use(cors());
app.use(express.json());

function getClientIp(req) {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) return forwarded.split(',')[0].trim();
  return req.ip;
}

function isAllowedIp(req) {
  const allowed = process.env.ALLOWED_IPS;
  if (!allowed) return false;
  const clientIp = getClientIp(req);
  return allowed.split(',').map(ip => ip.trim()).includes(clientIp);
}

// IP check — called on app load
app.get('/api/check-access', (req, res) => {
  res.json({ allowed: isAllowedIp(req), ip: getClientIp(req) });
});

// PIN verification — PIN never leaves the server
app.post('/api/verify-pin', (req, res) => {
  const { pin } = req.body;
  if (!process.env.APP_PIN) return res.status(500).json({ ok: false, error: 'PIN not configured' });
  res.json({ ok: pin === process.env.APP_PIN });
});

// API routes
app.use('/api/cards', cardRoutes);

// Serve compiled frontend in production
if (process.env.NODE_ENV === 'production') {
  const frontendDist = path.join(__dirname, '../frontend/dist');
  app.use(express.static(frontendDist));
  app.get('*', (req, res) => {
    res.sendFile(path.join(frontendDist, 'index.html'));
  });
}

const PORT = process.env.PORT || 5000;

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log('MongoDB connected');
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err.message);
    process.exit(1);
  });
