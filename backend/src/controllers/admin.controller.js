const { PrismaClient } = require('@prisma/client');
const jwt = require('jsonwebtoken');

const prisma = new PrismaClient();

let Expo;
let expo;

// Dynamically load the ESM module
(async () => {
    try {
        const mod = await import('expo-server-sdk');
        Expo = mod.Expo;
        expo = new Expo();
    } catch (err) {
        console.error('Failed to load expo-server-sdk', err);
    }
})();

// Helper to send push notification
const sendPushNotification = async (pushToken, title, body) => {
    if (!Expo || !expo) return;

    if (!Expo.isExpoPushToken(pushToken)) {
        console.error(`Push token ${pushToken} is not a valid Expo push token`);
        return;
    }

    const messages = [{
        to: pushToken,
        sound: 'default',
        title: title,
        body: body,
        data: { },
    }];

    try {
        const chunks = expo.chunkPushNotifications(messages);
        for (let chunk of chunks) {
            await expo.sendPushNotificationsAsync(chunk);
        }
    } catch (error) {
        console.error('Error sending push notification:', error);
    }
};

// Helper to broadcast push to all users
const broadcastPushNotification = async (title, body) => {
    if (!Expo || !expo) return;

    try {
        const users = await prisma.user.findMany({
            where: { pushToken: { not: null } },
            select: { pushToken: true }
        });

        const messages = [];
        for (let user of users) {
            if (Expo.isExpoPushToken(user.pushToken)) {
                messages.push({
                    to: user.pushToken,
                    sound: 'default',
                    title: title,
                    body: body,
                });
            }
        }

        const chunks = expo.chunkPushNotifications(messages);
        for (let chunk of chunks) {
            await expo.sendPushNotificationsAsync(chunk);
        }
    } catch (error) {
        console.error('Error broadcasting push:', error);
    }
};
const ADMIN_EMAIL = 'kushagratomar044@gmail.com';
const ADMIN_PASSWORD = 'Kushagra@123';

// ─── POST /api/admin/login ───────────────────────────────────────────────────
const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        if (email !== ADMIN_EMAIL) {
            return res.status(401).json({ error: 'Unauthorized: Invalid email' });
        }

        if (password !== ADMIN_PASSWORD) {
            return res.status(401).json({ error: 'Unauthorized: Invalid password' });
        }

        const token = jwt.sign(
            { email: ADMIN_EMAIL, role: 'admin' },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        return res.status(200).json({ token, message: 'Login successful' });
    } catch (error) {
        console.error('Login error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};

// ─── POST /api/admin/properties ──────────────────────────────────────────────
const createProperty = async (req, res) => {
    try {
        const { title, description, price, location, bedrooms, bathrooms } = req.body;

        if (!title || !description || !price || !location || !bedrooms || !bathrooms) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        const property = await prisma.property.create({
            data: {
                title,
                description,
                price: parseFloat(price),
                location,
                bedrooms: parseInt(bedrooms),
                bathrooms: parseInt(bathrooms),
            },
        });

        // Broadcast a push notification to all users about the new property
        await broadcastPushNotification(
            'New Property Available!',
            `${title} in ${location} is now available for ₹${price}/mo`
        );

        return res.status(201).json({ property, message: 'Property created successfully' });
    } catch (error) {
        console.error('Create property error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};

// ─── PATCH /api/admin/properties/:id ─────────────────────────────────────────
const updateProperty = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, description, price, location, bedrooms, bathrooms } = req.body;

        const existing = await prisma.property.findUnique({ where: { id } });
        if (!existing) {
            return res.status(404).json({ error: 'Property not found' });
        }

        const property = await prisma.property.update({
            where: { id },
            data: {
                ...(title && { title }),
                ...(description && { description }),
                ...(price && { price: parseFloat(price) }),
                ...(location && { location }),
                ...(bedrooms && { bedrooms: parseInt(bedrooms) }),
                ...(bathrooms && { bathrooms: parseInt(bathrooms) }),
            },
        });

        return res.status(200).json({ property, message: 'Property updated successfully' });
    } catch (error) {
        console.error('Update property error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};

// ─── DELETE /api/admin/properties/:id ────────────────────────────────────────
const deleteProperty = async (req, res) => {
    try {
        const { id } = req.params;

        const existing = await prisma.property.findUnique({ where: { id } });
        if (!existing) {
            return res.status(404).json({ error: 'Property not found' });
        }

        await prisma.property.delete({ where: { id } });

        return res.status(200).json({ message: 'Property deleted successfully' });
    } catch (error) {
        console.error('Delete property error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};

// ─── PATCH /api/admin/properties/:id/book ────────────────────────────────────
const markBooked = async (req, res) => {
    try {
        const { id } = req.params;

        const existing = await prisma.property.findUnique({ where: { id } });
        if (!existing) {
            return res.status(404).json({ error: 'Property not found' });
        }

        const property = await prisma.property.update({
            where: { id },
            data: { isBooked: true },
        });

        return res.status(200).json({ property, message: 'Property marked as booked' });
    } catch (error) {
        console.error('Mark booked error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};

// ─── GET /api/admin/properties ───────────────────────────────────────────────
const getAllProperties = async (req, res) => {
    try {
        const properties = await prisma.property.findMany({
            orderBy: { createdAt: 'desc' },
        });
        return res.status(200).json({ properties });
    } catch (error) {
        console.error('Get properties error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};

// ─── POST /api/admin/properties/:id/media ────────────────────────────────────
const uploadPropertyMedia = async (req, res) => {
    try {
        const { id } = req.params;
        const files = req.files;

        if (!files || files.length === 0) {
            return res.status(400).json({ error: 'No files uploaded' });
        }

        const existing = await prisma.property.findUnique({ where: { id } });
        if (!existing) {
            return res.status(404).json({ error: 'Property not found' });
        }

        const newImages = [];
        const newVideos = [];

        files.forEach((file) => {
            const fileUrl = `/uploads/${file.filename}`;
            if (file.mimetype.startsWith('image/')) {
                newImages.push(fileUrl);
            } else if (file.mimetype.startsWith('video/')) {
                newVideos.push(fileUrl);
            }
        });

        const property = await prisma.property.update({
            where: { id },
            data: {
                images: { push: newImages },
                videos: { push: newVideos },
            },
        });

        return res.status(200).json({ property, message: 'Media uploaded successfully' });
    } catch (error) {
        console.error('Upload media error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};

// ─── GET /api/admin/bookings ──────────────────────────────────────────────────
const getBookings = async (req, res) => {
    try {
        const bookings = await prisma.booking.findMany({
            orderBy: { createdAt: 'desc' },
            include: {
                property: {
                    select: { id: true, title: true, location: true, price: true },
                },
            },
        });
        return res.status(200).json({ bookings });
    } catch (error) {
        console.error('Get bookings error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};

// ─── PATCH /api/admin/bookings/:id/approve ────────────────────────────────────
const approveBooking = async (req, res) => {
    try {
        const { id } = req.params;

        const booking = await prisma.booking.findUnique({ where: { id } });
        if (!booking) {
            return res.status(404).json({ error: 'Booking not found' });
        }

        const [updatedBooking] = await prisma.$transaction([
            prisma.booking.update({
                where: { id },
                data: { status: 'APPROVED' },
            }),
            prisma.property.update({
                where: { id: booking.propertyId },
                data: { isInProcess: true },
            }),
        ]);

        // Create notification for the user if booking has a userId
        if (updatedBooking.userId) {
            await prisma.notification.create({
                data: {
                    userId: updatedBooking.userId,
                    title: 'Booking Approved',
                    message: 'Your property visit has been approved. Please contact support or visit the property.'
                }
            });

            // Try to send push notification
            const user = await prisma.user.findUnique({ where: { id: updatedBooking.userId }, select: { pushToken: true } });
            if (user && user.pushToken) {
                const property = await prisma.property.findUnique({ where: { id: booking.propertyId }, select: { title: true } });
                await sendPushNotification(user.pushToken, 'Booking Approved', `Your booking for ${property ? property.title : 'a property'} has been approved!`);
            }
        }

        return res.status(200).json({ message: 'Booking approved successfully', booking: updatedBooking });

    } catch (error) {
        console.error('Approve booking error:', error);
        return res.status(500).json({ error: 'Internal server error', message: error.message });
    }
};

// ─── PATCH /api/admin/bookings/:id/reject ─────────────────────────────────────
const rejectBooking = async (req, res) => {
    try {
        const { id } = req.params;

        const booking = await prisma.booking.findUnique({ where: { id } });
        if (!booking) {
            return res.status(404).json({ error: 'Booking not found' });
        }

        const [updatedBooking] = await prisma.$transaction([
            prisma.booking.update({
                where: { id },
                data: { status: 'REJECTED' },
            }),
            prisma.property.update({
                where: { id: booking.propertyId },
                data: { isInProcess: false },
            }),
        ]);

        if (updatedBooking.userId) {
            await prisma.notification.create({
                data: {
                    userId: updatedBooking.userId,
                    title: 'Booking Rejected',
                    message: 'Unfortunately, your booking request was rejected.'
                }
            });

            // Try to send push notification
            const user = await prisma.user.findUnique({ where: { id: updatedBooking.userId }, select: { pushToken: true } });
            if (user && user.pushToken) {
                const property = await prisma.property.findUnique({ where: { id: booking.propertyId }, select: { title: true } });
                await sendPushNotification(user.pushToken, 'Booking Rejected', `Your booking for ${property ? property.title : 'a property'} was rejected.`);
            }
        }

        return res.status(200).json({ booking: updatedBooking, message: 'Booking rejected successfully' });
    } catch (error) {
        console.error('Reject booking error:', error);
        return res.status(500).json({ error: 'Internal server error', message: error.message });
    }
};

// ─── PATCH /api/admin/bookings/:id/booked ─────────────────────────────────────
const markBookingAsBooked = async (req, res) => {
    try {
        const { id } = req.params;

        const booking = await prisma.booking.findUnique({ where: { id } });
        if (!booking) {
            return res.status(404).json({ error: 'Booking not found' });
        }

        const [updatedBooking] = await prisma.$transaction([
            prisma.booking.update({
                where: { id },
                data: { status: 'BOOKED' },
            }),
            prisma.property.update({
                where: { id: booking.propertyId },
                data: { isBooked: true, isInProcess: false },
            }),
        ]);

        return res.status(200).json({ booking: updatedBooking, message: 'Booking fully confirmed and property marked booked' });
    } catch (error) {
        console.error('Mark booking booked error:', error);
        return res.status(500).json({ error: 'Internal server error', message: error.message });
    }
};

// ─── PATCH /api/admin/bookings/:id/cancel ─────────────────────────────────────
const cancelBooking = async (req, res) => {
    try {
        const { id } = req.params;

        const booking = await prisma.booking.findUnique({ where: { id } });
        if (!booking) {
            return res.status(404).json({ error: 'Booking not found' });
        }

        const [updatedBooking] = await prisma.$transaction([
            prisma.booking.update({
                where: { id },
                data: { status: 'CANCELLED' },
            }),
            prisma.property.update({
                where: { id: booking.propertyId },
                data: { isInProcess: false, isBooked: false },
            }),
        ]);

        return res.status(200).json({ booking: updatedBooking, message: 'Booking cancelled and property reverted to available' });
    } catch (error) {
        console.error('Cancel booking error:', error);
        return res.status(500).json({ error: 'Internal server error', message: error.message });
    }
};

// ─── GET /api/admin/analytics ─────────────────────────────────────────────────
const getAnalytics = async (req, res) => {
    try {
        const [totalProperties, bookedProperties, totalBookings] = await Promise.all([
            prisma.property.count(),
            prisma.property.count({ where: { isBooked: true } }),
            prisma.booking.count(),
        ]);

        const availableProperties = totalProperties - bookedProperties;

        return res.status(200).json({
            analytics: {
                totalProperties,
                availableProperties,
                bookedProperties,
                totalBookings,
            },
        });
    } catch (error) {
        console.error('Analytics error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};

module.exports = {
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
};
