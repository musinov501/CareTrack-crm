const db = require('../../data/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const VALID_ROLES = ['ADMINISTRATOR', 'CLINICIAN', 'RECEPTIONIST'];

function normalizeEmail(email) {
    return String(email || '').trim().toLowerCase();
}

function signToken(user) {
    if (!process.env.JWT_SECRET) {
        throw new Error('JWT_SECRET is not configured in .env');
    }
    return jwt.sign(
        { id: user.id, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: '8h' }
    );
}

exports.register = async (req, res) => {
    try {
        const email = normalizeEmail(req.body.email);
        const { password, name, role, department } = req.body;

        if (!email || !password || !name || !role) {
            return res.status(400).json({ message: 'Name, email, password and role are required' });
        }
        if (password.length < 8) {
            return res.status(400).json({ message: 'Password must be at least 8 characters' });
        }
        if (!VALID_ROLES.includes(role)) {
            return res.status(400).json({ message: 'Invalid role selected' });
        }

        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        const result = await db.query(
            'INSERT INTO users (email, password_hash, name, role, department) VALUES ($1, $2, $3, $4, $5) RETURNING id, email, name, role',
            [email, passwordHash, name.trim(), role, department || null]
        );

        const user = result.rows[0];
        const token = signToken(user);

        res.status(201).json({
            message: 'User registered successfully',
            token,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role
            }
        });
    } catch (err) {
        console.error(err);
        if (err.code === '23505') {
            return res.status(409).json({ message: 'An account with this email already exists. Try signing in.' });
        }
        if (err.message?.includes('JWT_SECRET')) {
            return res.status(500).json({ message: 'Server misconfiguration: JWT_SECRET missing in .env' });
        }
        res.status(500).json({ message: 'Server error during registration' });
    }
};

exports.login = async (req, res) => {
    try {
        const email = normalizeEmail(req.body.email);
        const { password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password are required' });
        }

        const result = await db.query('SELECT * FROM users WHERE LOWER(TRIM(email)) = $1', [email]);

        if (result.rows.length === 0) {
            return res.status(401).json({ message: 'No account found with this email. Register first or check spelling.' });
        }

        const user = result.rows[0];
        const isMatch = await bcrypt.compare(password, user.password_hash);

        if (!isMatch) {
            return res.status(401).json({ message: 'Incorrect password. Please try again.' });
        }

        const token = signToken(user);

        res.json({
            token,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role
            }
        });
    } catch (err) {
        console.error(err);
        if (err.message?.includes('JWT_SECRET')) {
            return res.status(500).json({ message: 'Server misconfiguration: JWT_SECRET missing in .env' });
        }
        res.status(500).json({ message: 'Server error during login' });
    }
};
