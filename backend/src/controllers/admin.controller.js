const { PrismaClient } = require('@prisma/client');
const jwt = require('jsonwebtoken');

const prisma = new PrismaClient();

// ─── Hardcoded Admin Credentials ────────────────────────────────────────────
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

        return res.status(200).json({ message: 'Booking approved successfully', booking: updatedBooking });
    } catch (error) {
        console.error('Approve booking error:', error);
        return res.status(500).json({ error: 'Internal server error' });
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

        return res.status(200).json({ booking: updatedBooking, message: 'Booking rejected successfully' });
    } catch (error) {
        console.error('Reject booking error:', error);
        return res.status(500).json({ error: 'Internal server error' });
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
        return res.status(500).json({ error: 'Internal server error' });
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
        return res.status(500).json({ error: 'Internal server error' });
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
