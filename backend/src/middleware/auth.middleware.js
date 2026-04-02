const jwt = require('jsonwebtoken');

const verifyUserToken = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Unauthorized: No token provided' });
    }

    const token = authHeader.split(' ')[1];

    try {
        const payload = jwt.verify(token, process.env.JWT_SECRET);

        // ✅ Make sure role is 'user'
        if (payload.role !== 'user') {
            return res.status(401).json({ error: 'Unauthorized: Insufficient role' });
        }

        // ✅ Explicitly set req.user with id
        req.user = {
            id: payload.id,       // make sure this matches what was signed in JWT
            email: payload.email,
            role: payload.role,
        };

        next();
    } catch (err) {
        return res.status(401).json({ error: 'Unauthorized: Invalid or expired token' });
    }
};

module.exports = { verifyUserToken };