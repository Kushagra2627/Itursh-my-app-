const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');

const {
    signup,
    login,
    getMyBookings,
    createBooking,
    getProperties,
    getPropertyById,
    getProfile,
    updateProfile,
    getNotifications,
    markNotificationAsRead,
    markNotificationAsRead,
    savePushToken,
    getSoldProperties
} = require('../controllers/user.controller');

// ─── User Auth Middleware ────────────────────────────────────────────────────
const verifyUserToken = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Unauthorized: No token provided' });
    }
    const token = authHeader.split(' ')[1];
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded; // { id, email, role }
        next();
    } catch (err) {
        return res.status(403).json({ error: 'Forbidden: Invalid token' });
    }
};

// ─── Public Routes ──────────────
router.post('/login', login);
router.post('/register', signup);
router.get('/properties', getProperties);
router.get('/properties/:id', getPropertyById);

// ─── Protected Routes ──────────────
router.get('/my-bookings', verifyUserToken, getMyBookings);
router.post('/bookings', verifyUserToken, createBooking);
router.get('/profile', verifyUserToken, getProfile);
router.patch('/profile', verifyUserToken, updateProfile);
router.post('/push-token', verifyUserToken, savePushToken);
router.get('/sold-properties', verifyUserToken, getSoldProperties);

// ─── Notifications ──────────────
router.get('/notifications', verifyUserToken, getNotifications);
router.patch('/notifications/:id/read', verifyUserToken, markNotificationAsRead);

module.exports = router;
