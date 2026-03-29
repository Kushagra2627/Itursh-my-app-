require('dotenv').config();
const compression = require('compression');
const express = require('express');
const cors = require('cors');
const adminRoutes = require('./routes/admin.routes');
const userRoutes = require('./routes/user.routes');
const helmet = require('helmet');
const app = express();
const PORT = process.env.PORT || 3000;
const rateLimit = require('express-rate-limit');
const path = require('path');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 100, // max 100 requests per IP
  message: "Too many requests, try again later"
});
app.set('trust proxy', 1);
// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(helmet());
app.use(compression());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static('public/uploads'));

// ─── Routes ──────────────────────────────────────────────────────────────────
app.use('/api/admin', adminRoutes);

app.use('/api/user', userRoutes);

// ─── Health Check ─────────────────────────────────────────────────────────────


app.get('/api/health', (req, res) => {
    res.status(200).json({ status: 'OK', message: 'Rental Admin API is running (via /api)' });
});

// ─── 404 Handler ──────────────────────────────────────────────────────────────
app.use((req, res) => {
    res.status(404).json({ error: 'Route not found' });
});


// ─── Global Error Handler ───────────────────────────────────────────>
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({
      error: 'Internal server error',
      message: err.message
    });
});

// ─── Start Server ───────────────────────────────────────────────────>
app.listen(PORT,'0.0.0.0',() => {
    console.log(`backend  running on ${PORT}`);
});

module.exports = app;
 


