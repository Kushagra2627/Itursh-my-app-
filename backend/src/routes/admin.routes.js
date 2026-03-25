const express = require('express');
const router = express.Router();
const { verifyAdminToken } = require('../middleware/auth.middleware');
const upload = require('../middleware/upload');
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
router.post('/login', login);

// ─── Protected (requires valid admin JWT) ────────────────────────────────────
router.get('/properties', verifyAdminToken, getAllProperties);
router.post('/properties', verifyAdminToken, createProperty);
router.patch('/properties/:id', verifyAdminToken, updateProperty);
router.delete('/properties/:id', verifyAdminToken, deleteProperty);
router.patch('/properties/:id/book', verifyAdminToken, markBooked);
router.post('/properties/:id/media', verifyAdminToken, upload.array('media', 10), uploadPropertyMedia);

router.get('/bookings', verifyAdminToken, getBookings);
router.patch('/bookings/:id/approve', verifyAdminToken, approveBooking);
router.patch('/bookings/:id/reject', verifyAdminToken, rejectBooking);
router.patch('/bookings/:id/booked', verifyAdminToken, markBookingAsBooked);
router.patch('/bookings/:id/cancel', verifyAdminToken, cancelBooking);

router.get('/analytics', verifyAdminToken, getAnalytics);

module.exports = router;
