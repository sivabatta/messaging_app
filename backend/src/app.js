const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const authRoutes = require('./routes/auth');
const messageRoutes = require('./routes/messages');
const mediaRoutes = require('./routes/media');

const app = express();

app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN || '*',
    credentials: true,
  })
);
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

app.use(
  '/api/auth',
  rateLimit({ windowMs: 15 * 60 * 1000, max: 50, standardHeaders: true }),
  authRoutes
);
app.use('/api/messages', messageRoutes);
app.use('/api/media', mediaRoutes);

app.get('/api/health', (_req, res) => res.json({ ok: true }));

// Multer / generic error handler
app.use((err, _req, res, _next) => {
  console.error('[error]', err);
  if (err.code === 'LIMIT_FILE_SIZE') return res.status(413).json({ error: 'file too large' });
  return res.status(err.status || 500).json({ error: err.message || 'server error' });
});

module.exports = app;
