const express = require('express');
const router = express.Router();
const { verifyAdminToken } = require('../middleware/auth.middleware');
const { upload, compressMiddleware } = require('../middleware/upload');
const rateLimit = require('express-rate-limit');

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5, // only 5 login attempts
  message: "Too many login attempts, try again later"
});
const {
    login,
    createProperty,
    updateProperty,
    deleteProperty,
    markBooked,
    getAllProperties,
    getBookings,
    approveBooking,
    rejectBooking,
    markBookingAsBooked,
    cancelBooking,
    getAnalytics,
    uploadPropertyMedia,
} = require('../controllers/admin.controller');


// ─── Public ──────────────────────────────────────────────────────────────────
router.post('/login', loginLimiter, login);

// ─── Protected (requires valid admin JWT) ────────────────────────────────────
router.get('/properties', verifyAdminToken, getAllProperties);
router.post('/properties', verifyAdminToken, createProperty);
router.patch('/properties/:id', verifyAdminToken, updateProperty);
router.delete('/properties/:id', verifyAdminToken, deleteProperty);
router.patch('/properties/:id/book', verifyAdminToken, markBooked);
router.post('/properties/:id/media', verifyAdminToken, upload.array('media', 10), compressMiddleware, uploadPropertyMedia);

router.get('/bookings', verifyAdminToken, getBookings);
router.patch('/bookings/:id/approve', verifyAdminToken, approveBooking);
router.patch('/bookings/:id/reject', verifyAdminToken, rejectBooking);
router.patch('/bookings/:id/booked', verifyAdminToken, markBookingAsBooked);
router.patch('/bookings/:id/cancel', verifyAdminToken, cancelBooking);

router.get('/analytics', verifyAdminToken, getAnalytics);

module.exports = router;
