const jwt = require('jsonwebtoken');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// JWT Secret - should be in environment variable
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

// Database connection
const dbPath = path.join(__dirname, '..', 'database.sqlite');

// Generate JWT token
function generateToken(user) {
    return jwt.sign(
        { 
            id: user.id, 
            username: user.username, 
            email: user.email,
            role: user.role 
        },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN }
    );
}

// Verify JWT token
function verifyToken(token) {
    try {
        return jwt.verify(token, JWT_SECRET);
    } catch (error) {
        return null;
    }
}

// Authentication middleware
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
        return res.status(401).json({ 
            error: 'Access denied. No token provided.',
            code: 'NO_TOKEN'
        });
    }

    const decoded = verifyToken(token);
    
    if (!decoded) {
        return res.status(403).json({ 
            error: 'Invalid or expired token.',
            code: 'INVALID_TOKEN'
        });
    }

    // Check if user is still active
    const db = new sqlite3.Database(dbPath);
    db.get('SELECT is_active FROM users WHERE id = ?', [decoded.id], (err, row) => {
        db.close();
        
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }
        
        if (!row || !row.is_active) {
            return res.status(403).json({ 
                error: 'Account is disabled.',
                code: 'ACCOUNT_DISABLED'
            });
        }

        req.user = decoded;
        next();
    });
}

// Optional authentication (for public endpoints that can be enhanced with auth)
function optionalAuth(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
        const decoded = verifyToken(token);
        if (decoded) {
            req.user = decoded;
        }
    }
    
    next();
}

// Role-based authorization middleware
function requireRole(...roles) {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ 
                error: 'Authentication required.',
                code: 'AUTH_REQUIRED'
            });
        }

        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ 
                error: 'Insufficient permissions.',
                code: 'INSUFFICIENT_PERMISSIONS',
                required: roles,
                current: req.user.role
            });
        }

        next();
    };
}

// Admin only middleware
const requireAdmin = requireRole('admin');

// Admin or User middleware
const requireAdminOrUser = requireRole('admin', 'user');

// Check if login is required based on settings
async function checkLoginRequired() {
    return new Promise((resolve, reject) => {
        const db = new sqlite3.Database(dbPath);
        db.get("SELECT value FROM settings WHERE key = 'require_login'", [], (err, row) => {
            db.close();
            if (err) {
                resolve(true); // Default to requiring login
            } else {
                resolve(row ? row.value === 'true' : true);
            }
        });
    });
}

// Rate limiting for login attempts
const loginAttempts = new Map();

function checkRateLimit(identifier) {
    const now = Date.now();
    const attempts = loginAttempts.get(identifier);
    
    if (!attempts) {
        return { allowed: true, remaining: 4 };
    }

    // Remove old attempts (older than 15 minutes)
    const validAttempts = attempts.filter(time => now - time < 15 * 60 * 1000);
    loginAttempts.set(identifier, validAttempts);

    if (validAttempts.length >= 5) {
        const oldestAttempt = validAttempts[0];
        const lockoutTime = 15 * 60 * 1000 - (now - oldestAttempt);
        return { 
            allowed: false, 
            lockoutTime: Math.ceil(lockoutTime / 1000),
            message: `Too many failed attempts. Try again in ${Math.ceil(lockoutTime / 60000)} minutes.`
        };
    }

    return { allowed: true, remaining: 5 - validAttempts.length };
}

function recordLoginAttempt(identifier, success) {
    if (success) {
        loginAttempts.delete(identifier);
        return;
    }

    const attempts = loginAttempts.get(identifier) || [];
    attempts.push(Date.now());
    loginAttempts.set(identifier, attempts);
}

// Clean up old login attempts every hour
setInterval(() => {
    const now = Date.now();
    for (const [identifier, attempts] of loginAttempts.entries()) {
        const validAttempts = attempts.filter(time => now - time < 15 * 60 * 1000);
        if (validAttempts.length === 0) {
            loginAttempts.delete(identifier);
        } else {
            loginAttempts.set(identifier, validAttempts);
        }
    }
}, 60 * 60 * 1000);

module.exports = {
    generateToken,
    verifyToken,
    authenticateToken,
    optionalAuth,
    requireRole,
    requireAdmin,
    requireAdminOrUser,
    checkLoginRequired,
    checkRateLimit,
    recordLoginAttempt,
    JWT_SECRET,
    JWT_EXPIRES_IN
};