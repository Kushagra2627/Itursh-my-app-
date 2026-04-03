const { PrismaClient } = require('@prisma/client');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();
const admin = require('../lib/firebase-admin');

// ─── POST /api/user/signup ───────────────────────────────────────────────────
const signup = async (req, res) => {
    try {
        const { name, email, password, phone } = req.body;

        if (!name) {
            return res.status(400).json({ error: 'Name is required' });
        }

        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            return res.status(400).json({ error: 'User with this email already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await prisma.user.create({
            data: {
                name,
                email,
                password: hashedPassword,
                phone,
            },
        });

        const token = jwt.sign(
            { id: user.id, email: user.email, role: 'user' },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        return res.status(201).json({ token, user: { id: user.id, name, email }, message: 'Signup successful' });
    } catch (error) {
        console.error('Signup error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};

// ─── POST /api/user/login ────────────────────────────────────────────────────
const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const token = jwt.sign(
            { id: user.id, email: user.email, role: 'user' },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        return res.status(200).json({ token, user: { id: user.id, name: user.name, email }, message: 'Login successful' });
    } catch (error) {
        console.error('Login error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};

// ─── GET /api/user/properties ────────────────────────────────────────────────
const getProperties = async (req, res) => {
    try {
        const { minPrice, maxPrice, bedrooms, location } = req.query;

        // Build filter object
        const filters = { isBooked: false };

        if (minPrice || maxPrice) {
            filters.price = {};
            if (minPrice) filters.price.gte = parseFloat(minPrice);
            if (maxPrice) filters.price.lte = parseFloat(maxPrice);
        }

        if (bedrooms) {
            filters.bedrooms = parseInt(bedrooms);
        }

        if (location) {
            filters.location = {
                contains: location,
                mode: 'insensitive',
            };
        }

        const properties = await prisma.property.findMany({
            where: filters,
            orderBy: { createdAt: 'desc' },
        });

        return res.status(200).json({ properties });
    } catch (error) {
        console.error('Get properties error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};

// ─── GET /api/user/properties/:id ────────────────────────────────────────────
const getPropertyById = async (req, res) => {
    try {
        const { id } = req.params;
        const property = await prisma.property.findUnique({ where: { id } });

        if (!property) {
            return res.status(404).json({ error: 'Property not found' });
        }

        return res.status(200).json({ property });
    } catch (error) {
        console.error('Get property error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};

// ─── POST /api/user/bookings ─────────────────────────────────────────────────
const createBooking = async (req, res) => {
    try {
        const { propertyId, peopleCount, notes } = req.body;
        const userId = req.user.id;
        console.log('🔍 Attempting booking for userId:', userId);

        if (!propertyId || !peopleCount) {
            return res.status(400).json({ error: 'Property ID and People Count are required' });
        }

        // Fetch user details from database
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { name: true, email: true, phone: true }
        });
        console.log('👤 User found in DB:', user ? 'Yes' : 'No');

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const property = await prisma.property.findUnique({ where: { id: propertyId } });
        if (!property) {
            return res.status(404).json({ error: 'Property not found' });
        }

        if (property.isBooked) {
            return res.status(400).json({ error: 'Property is already booked' });
        }

        if (property.isInProcess) {
            return res.status(400).json({ error: 'Property booking is currently in process' });
        }

        const [booking] = await prisma.$transaction([
            prisma.booking.create({
                data: {
                    propertyId,
                    tenantName: user.name,
                    tenantEmail: user.email,
                    phone: user.phone,
                    peopleCount: parseInt(peopleCount),
                    notes,
                    userId: userId,
                },
            }),
            prisma.property.update({
                where: { id: propertyId },
                data: { isInProcess: true },
            }),
        ]);

        return res.status(201).json({ booking, message: 'Booking request submitted successfully' });
    } catch (error) {
        console.error('Create booking error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};

// ─── GET /api/user/my-bookings ───────────────────────────────────────────────
const getMyBookings = async (req, res) => {
    try {
        const userId = req.user.id;

        const bookings = await prisma.booking.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            include: {
                property: true,
            },
        });

        return res.status(200).json({ bookings });
    } catch (error) {
        console.error('Get my bookings error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};

// ─── GET /api/user/profile ───────────────────────────────────────────────
const getProfile = async (req, res) => {
    try {
        const userId = req.user.id;
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { id: true, name: true, email: true, phone: true }
        });
        
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        return res.status(200).json({ user });
    } catch (error) {
        console.error('Get profile error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};

// ─── PATCH /api/user/profile ─────────────────────────────────────────────
const updateProfile = async (req, res) => {
    try {
        const userId = req.user.id;
        const { name, phone, email } = req.body;
        
        const existing = await prisma.user.findUnique({ where: { id: userId } });
        if (!existing) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        const user = await prisma.user.update({
            where: { id: userId },
            data: {
                ...(name && { name }),
                ...(phone !== undefined && { phone }),
                ...(email && { email }),
            },
            select: { id: true, name: true, email: true, phone: true }
        });
        
        return res.status(200).json({ user, message: 'Profile updated successfully' });
    } catch (error) {
        console.error('Update profile error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};

// ─── GET /api/user/notifications ─────────────────────────────────────────────
const getNotifications = async (req, res) => {
    try {
        const userId = req.user.id;
        const notifications = await prisma.notification.findMany({
            where: { userId },
            orderBy: [
                { isRead: 'asc' },
                { createdAt: 'desc' }
            ]
        });
        return res.status(200).json({ notifications });
    } catch (error) {
        console.error('Get notifications error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};

// ─── PATCH /api/user/notifications/:id/read ──────────────────────────────────
const markNotificationAsRead = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        const notification = await prisma.notification.findUnique({ where: { id } });
        if (!notification || notification.userId !== userId) {
            return res.status(404).json({ error: 'Notification not found' });
        }

        await prisma.notification.update({
            where: { id },
            data: { isRead: true }
        });

        return res.status(200).json({ message: 'Notification marked as read' });
    } catch (error) {
        console.error('Mark notification read error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};

// ─── POST /api/user/push-token ────────────────────────────────────────────────
const savePushToken = async (req, res) => {
    try {
        const userId = req.user.id;
        console.log('🔍 userId from token:', userId, '| type:', typeof userId); // 👈 ADD HERE
        const { pushToken } = req.body;

        if (!pushToken) {
            return res.status(400).json({ error: 'Push token is required' });
        }

        // Check the user exists first
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) {
            return res.status(404).json({ error: 'User not found. Please log in again.' });
        }

        await prisma.user.update({
            where: { id: userId },
            data: { pushToken },
        });

        return res.status(200).json({ message: 'Push token saved successfully' });
    } catch (error) {
        console.error('Save push token error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};

// ─── POST /api/user/firebase-auth ─────────────────────────────────────────────
const firebaseAuth = async (req, res) => {
    try {
        const { idToken, name } = req.body;
        if (!idToken) {
            return res.status(400).json({ error: 'ID Token is required' });
        }

        const decodedToken = await admin.auth().verifyIdToken(idToken);
        const { phone_number, uid } = decodedToken;

        if (!phone_number) {
            return res.status(400).json({ error: 'Phone number not verified in token' });
        }

        // Check if user exists by phone
        let user = await prisma.user.findUnique({
            where: { phone: phone_number }
        });

        if (!user) {
            // New User Registration
            if (!name) {
                return res.status(400).json({ error: 'Name is required for new registration', needsRegistration: true });
            }
            user = await prisma.user.create({
                data: {
                    phone: phone_number,
                    name: name,
                }
            });
        }

        const token = jwt.sign(
            { id: user.id, email: user.email, role: 'user' },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        return res.status(200).json({ 
            token, 
            user: { id: user.id, name: user.name, phone: user.phone }, 
            message: 'Authentication successful' 
        });
    } catch (error) {
        console.error('Firebase Auth error:', error);
        return res.status(401).json({ error: 'Invalid or expired token' });
    }
};

// ─── GET /api/user/sold-properties ───────────────────────────────────────────
const getSoldProperties = async (req, res) => {
    try {
        const bookings = await prisma.booking.findMany({
            where: { status: 'BOOKED' },
            orderBy: { updatedAt: 'desc' },
            include: {
                property: true,
            },
        });

        const soldProperties = bookings.map((b) => ({
            id: b.property.id,
            title: b.property.title,
            location: b.property.location,
            price: b.property.price,
            images: b.property.images,
            soldAt: b.updatedAt,
        }));

        return res.status(200).json({ soldProperties });
    } catch (error) {
        console.error('Get sold properties error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};

module.exports = {
    signup,
    login,
    getProperties,
    getPropertyById,
    createBooking,
    getMyBookings,
    getProfile,
    updateProfile,
    getNotifications,
    markNotificationAsRead,
    savePushToken,
    getSoldProperties,
    firebaseAuth,
};
