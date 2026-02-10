const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs');
const path = require('path');
const fs = require('fs');
const https = require('https');
const http = require('http');
require('dotenv').config();

// Import middleware
const { 
    generateToken, 
    authenticateToken, 
    requireAdmin, 
    requireAdminOrUser,
    checkRateLimit,
    recordLoginAttempt 
} = require('./middleware/auth');

const {
    securityHeaders,
    apiLimiter,
    authLimiter,
    validateInput,
    sanitizeInput,
    requestLogger,
    errorHandler,
    notFoundHandler
} = require('./middleware/security');

// Import upload configuration
const { 
    invoiceUpload, 
    handleUploadError, 
    deleteFile, 
    formatFileSize 
} = require('./config/upload');

const app = express();

// Configuration
const PORT = process.env.PORT || 3000;
const HTTPS_PORT = process.env.HTTPS_PORT || 3443;
const NODE_ENV = process.env.NODE_ENV || 'development';
const ENABLE_HTTPS = process.env.ENABLE_HTTPS === 'true';
const BCRYPT_ROUNDS = parseInt(process.env.BCRYPT_ROUNDS) || 12;

// SSL Certificate paths
const SSL_KEY_PATH = process.env.SSL_KEY_PATH || './ssl/key.pem';
const SSL_CERT_PATH = process.env.SSL_CERT_PATH || './ssl/cert.pem';

// Database connection
const dbPath = path.join(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database:', err.message);
        process.exit(1);
    }
    console.log('✅ Connected to SQLite database.');
});

// Enable foreign key constraints
db.run('PRAGMA foreign_keys = ON');

// tis is where i added the code later 
// ==================== AUTO-CREATE ADMIN ON FIRST STARTUP ====================

function ensureAdminExists() {
    const bcrypt = require('bcryptjs');
    
    db.get('SELECT id FROM users WHERE role = ?', ['admin'], async (err, row) => {
        if (err) {
            console.error('Error checking for admin:', err.message);
            return;
        }
        
        // If no admin exists, create one
        if (!row) {
            console.log('⚠️  No admin found. Creating default admin...');
            
            try {
                const hash = await bcrypt.hash('admin123', 12);
                
                db.run(
                    'INSERT INTO users (username, email, password_hash, role, is_active) VALUES (?, ?, ?, ?, ?)',
                    ['admin', 'admin@business.com', hash, 'admin', 1],
                    function(err) {
                        if (err) {
                            console.error('❌ Error creating admin:', err.message);
                        } else {
                            console.log('✅ Default admin created:');
                            console.log('   Username: admin');
                            console.log('   Password: admin123');
                            console.log('   ⚠️  Please change this password after first login!');
                        }
                    }
                );
            } catch (error) {
                console.error('❌ Error hashing password:', error);
            }
        } else {
            console.log('✅ Admin user exists');
        }
    });
}

// Call this function when server starts
ensureAdminExists();

// ==================== END AUTO-CREATE ADMIN ====================
// ==================== MIDDLEWARE ====================

// Security headers
app.use(securityHeaders);

// CORS configuration
const corsOptions = {
    origin: process.env.CORS_ORIGIN || '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
};
app.use(cors(corsOptions));

// Body parsing
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));

// Input sanitization
app.use(sanitizeInput);

// Request logging
if (NODE_ENV === 'development') {
    app.use(requestLogger);
}

// Rate limiting for all API routes
app.use('/api/', apiLimiter);

// Static files (frontend and uploads)
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', authenticateToken, express.static(path.join(__dirname, 'uploads')));

// ==================== AUTHENTICATION ROUTES ====================

// Login route (no auth required, rate limited)
app.post('/api/auth/login', authLimiter, (req, res) => {
    const { username, password } = req.body;
    
    if (!username || !password) {
        return res.status(400).json({ 
            error: 'Username and password are required',
            code: 'MISSING_CREDENTIALS'
        });
    }

    // Check rate limit
    const identifier = req.ip + '_' + username;
    const rateLimitCheck = checkRateLimit(identifier);
    
    if (!rateLimitCheck.allowed) {
        return res.status(429).json({
            error: rateLimitCheck.message,
            code: 'ACCOUNT_LOCKED',
            lockoutTime: rateLimitCheck.lockoutTime
        });
    }

    // Find user
    db.get('SELECT * FROM users WHERE username = ? AND is_active = 1', [username], (err, user) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ error: 'Database error' });
        }

        if (!user) {
            recordLoginAttempt(identifier, false);
            return res.status(401).json({ 
                error: 'Invalid username or password',
                code: 'INVALID_CREDENTIALS'
            });
        }

        // Verify password
        bcrypt.compare(password, user.password_hash, (err, isValid) => {
            if (err) {
                console.error('Password comparison error:', err);
                return res.status(500).json({ error: 'Authentication error' });
            }

            if (!isValid) {
                recordLoginAttempt(identifier, false);
                return res.status(401).json({ 
                    error: 'Invalid username or password',
                    code: 'INVALID_CREDENTIALS',
                    remainingAttempts: rateLimitCheck.remaining - 1
                });
            }

            // Record successful login
            recordLoginAttempt(identifier, true);
            
            // Update last login time
            db.run('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?', [user.id]);

            // Generate token
            const token = generateToken(user);

            res.json({
                message: 'Login successful',
                token: token,
                user: {
                    id: user.id,
                    username: user.username,
                    email: user.email,
                    role: user.role
                }
            });
        });
    });
});

// Register route (admin only)
app.post('/api/auth/register', 
    authenticateToken,
    requireAdmin,
    validateInput({
        username: { required: true, minLength: 3, maxLength: 50 },
        email: { required: true, type: 'email' },
        password: { required: true, minLength: 8 },
        role: { required: true }
    }),
    (req, res) => {
        const { username, email, password, role } = req.body;
        
        // Validate role
        const validRoles = ['admin', 'user', 'viewer'];
        if (!validRoles.includes(role)) {
            return res.status(400).json({
                error: 'Invalid role. Must be admin, user, or viewer',
                code: 'INVALID_ROLE'
            });
        }

        // Hash password
        bcrypt.hash(password, BCRYPT_ROUNDS, (err, passwordHash) => {
            if (err) {
                console.error('Password hashing error:', err);
                return res.status(500).json({ error: 'Error creating user' });
            }

            // Insert user
            db.run(
                'INSERT INTO users (username, email, password_hash, role) VALUES (?, ?, ?, ?)',
                [username, email, passwordHash, role],
                function(err) {
                    if (err) {
                        if (err.message.includes('UNIQUE constraint failed')) {
                            if (err.message.includes('username')) {
                                return res.status(409).json({
                                    error: 'Username already exists',
                                    code: 'USERNAME_EXISTS'
                                });
                            }
                            if (err.message.includes('email')) {
                                return res.status(409).json({
                                    error: 'Email already exists',
                                    code: 'EMAIL_EXISTS'
                                });
                            }
                        }
                        console.error('Database error:', err);
                        return res.status(500).json({ error: 'Error creating user' });
                    }

                    res.status(201).json({
                        message: 'User created successfully',
                        user: {
                            id: this.lastID,
                            username,
                            email,
                            role
                        }
                    });
                }
            );
        });
    }
);

// Get current user info
app.get('/api/auth/me', authenticateToken, (req, res) => {
    db.get('SELECT id, username, email, role, is_active, last_login, created_at FROM users WHERE id = ?', 
        [req.user.id], 
        (err, user) => {
            if (err) {
                return res.status(500).json({ error: 'Database error' });
            }
            if (!user) {
                return res.status(404).json({ error: 'User not found' });
            }
            res.json(user);
        }
    );
});

// Change password
app.post('/api/auth/change-password', 
    authenticateToken,
    validateInput({
        currentPassword: { required: true },
        newPassword: { required: true, minLength: 8 }
    }),
    (req, res) => {
        const { currentPassword, newPassword } = req.body;
        const userId = req.user.id;

        // Get user's current password hash
        db.get('SELECT password_hash FROM users WHERE id = ?', [userId], (err, user) => {
            if (err) {
                return res.status(500).json({ error: 'Database error' });
            }
            if (!user) {
                return res.status(404).json({ error: 'User not found' });
            }

            // Verify current password
            bcrypt.compare(currentPassword, user.password_hash, (err, isValid) => {
                if (err) {
                    return res.status(500).json({ error: 'Authentication error' });
                }

                if (!isValid) {
                    return res.status(401).json({
                        error: 'Current password is incorrect',
                        code: 'INVALID_PASSWORD'
                    });
                }

                // Hash new password
                bcrypt.hash(newPassword, BCRYPT_ROUNDS, (err, newHash) => {
                    if (err) {
                        return res.status(500).json({ error: 'Error updating password' });
                    }

                    // Update password
                    db.run('UPDATE users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
                        [newHash, userId],
                        function(err) {
                            if (err) {
                                return res.status(500).json({ error: 'Error updating password' });
                            }
                            res.json({ message: 'Password updated successfully' });
                        }
                    );
                });
            });
        });
    }
);


// Logout (client-side token removal, but we can track it server-side if needed)
app.post('/api/auth/logout', authenticateToken, (req, res) => {
    // In a more advanced setup, you might add the token to a blacklist
    // For now, we just confirm the logout
    res.json({ message: 'Logout successful' });
});

// ==================== USER MANAGEMENT (ADMIN ONLY) ====================

// Get all users
app.get('/api/users', authenticateToken, requireAdmin, (req, res) => {
    db.all('SELECT id, username, email, role, is_active, last_login, created_at FROM users ORDER BY created_at DESC', 
        [], 
        (err, rows) => {
            if (err) {
                return res.status(500).json({ error: 'Database error' });
            }
            res.json(rows);
        }
    );
});

// Update user
app.put('/api/users/:id', authenticateToken, requireAdmin, (req, res) => {
    const { id } = req.params;
    const { email, role, is_active } = req.body;
    
    // Prevent self-deactivation
    if (parseInt(id) === req.user.id && is_active === false) {
        return res.status(400).json({
            error: 'Cannot deactivate your own account',
            code: 'SELF_DEACTIVATION'
        });
    }

    const updates = [];
    const params = [];
    
    if (email) {
        updates.push('email = ?');
        params.push(email);
    }
    if (role) {
        const validRoles = ['admin', 'user', 'viewer'];
        if (!validRoles.includes(role)) {
            return res.status(400).json({ error: 'Invalid role' });
        }
        updates.push('role = ?');
        params.push(role);
    }
    if (is_active !== undefined) {
        updates.push('is_active = ?');
        params.push(is_active ? 1 : 0);
    }
    
    if (updates.length === 0) {
        return res.status(400).json({ error: 'No fields to update' });
    }
    
    params.push(id);
    
    db.run(
        `UPDATE users SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
        params,
        function(err) {
            if (err) {
                if (err.message.includes('UNIQUE constraint failed')) {
                    return res.status(409).json({ error: 'Email already exists' });
                }
                return res.status(500).json({ error: 'Error updating user' });
            }
            if (this.changes === 0) {
                return res.status(404).json({ error: 'User not found' });
            }
            res.json({ message: 'User updated successfully' });
        }
    );
});

// Delete user
app.delete('/api/users/:id', authenticateToken, requireAdmin, (req, res) => {
    const { id } = req.params;
    
    // Prevent self-deletion
    if (parseInt(id) === req.user.id) {
        return res.status(400).json({
            error: 'Cannot delete your own account',
            code: 'SELF_DELETION'
        });
    }
    
    db.run('DELETE FROM users WHERE id = ?', [id], function(err) {
        if (err) {
            return res.status(500).json({ error: 'Error deleting user' });
        }
        if (this.changes === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json({ message: 'User deleted successfully' });
    });
});

// ==================== PROTECTED API ROUTES ====================

// All routes below this point require authentication
app.use('/api', authenticateToken);

// ==================== STAFF MEMBERS API ====================

app.get('/api/staff', (req, res) => {
    db.all('SELECT * FROM staff_members ORDER BY name', [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

app.post('/api/staff', requireAdminOrUser, (req, res) => {
    const { name } = req.body;
    
    if (!name || name.trim() === '') {
        return res.status(400).json({ error: 'Staff name is required' });
    }

    db.run('INSERT INTO staff_members (name) VALUES (?)', [name.trim()], function(err) {
        if (err) {
            if (err.message.includes('UNIQUE constraint failed')) {
                return res.status(409).json({ error: 'Staff member already exists' });
            }
            return res.status(500).json({ error: err.message });
        }
        res.json({ id: this.lastID, name: name.trim(), created_at: new Date().toISOString() });
    });
});

app.delete('/api/staff/:id', requireAdmin, (req, res) => {
    const { id } = req.params;
    
    db.run('DELETE FROM staff_members WHERE id = ?', [id], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        if (this.changes === 0) return res.status(404).json({ error: 'Staff member not found' });
        res.json({ message: 'Staff member deleted successfully' });
    });
});

// ==================== SUPPLIERS API ====================

app.get('/api/suppliers', (req, res) => {
    db.all('SELECT * FROM suppliers ORDER BY name', [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

app.post('/api/suppliers', requireAdminOrUser, (req, res) => {
    const { name } = req.body;
    
    if (!name || name.trim() === '') {
        return res.status(400).json({ error: 'Supplier name is required' });
    }

    db.run('INSERT INTO suppliers (name) VALUES (?)', [name.trim()], function(err) {
        if (err) {
            if (err.message.includes('UNIQUE constraint failed')) {
                return res.status(409).json({ error: 'Supplier already exists' });
            }
            return res.status(500).json({ error: err.message });
        }
        res.json({ id: this.lastID, name: name.trim(), created_at: new Date().toISOString() });
    });
});

app.delete('/api/suppliers/:id', requireAdmin, (req, res) => {
    const { id } = req.params;
    
    db.run('DELETE FROM suppliers WHERE id = ?', [id], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        if (this.changes === 0) return res.status(404).json({ error: 'Supplier not found' });
        res.json({ message: 'Supplier deleted successfully' });
    });
});

// ==================== PARTNERS API ====================

app.get('/api/partners', (req, res) => {
    db.all('SELECT * FROM partners ORDER BY email', [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

app.post('/api/partners', requireAdminOrUser, (req, res) => {
    const { email } = req.body;
    
    if (!email || email.trim() === '') {
        return res.status(400).json({ error: 'Partner email is required' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return res.status(400).json({ error: 'Invalid email format' });
    }

    db.run('INSERT INTO partners (email) VALUES (?)', [email.trim()], function(err) {
        if (err) {
            if (err.message.includes('UNIQUE constraint failed')) {
                return res.status(409).json({ error: 'Partner email already exists' });
            }
            return res.status(500).json({ error: err.message });
        }
        res.json({ id: this.lastID, email: email.trim(), created_at: new Date().toISOString() });
    });
});

app.delete('/api/partners/:id', requireAdmin, (req, res) => {
    const { id } = req.params;
    
    db.run('DELETE FROM partners WHERE id = ?', [id], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        if (this.changes === 0) return res.status(404).json({ error: 'Partner not found' });
        res.json({ message: 'Partner deleted successfully' });
    });
});

// ==================== SALES DATA API ====================

app.get('/api/sales/:date', (req, res) => {
    const { date } = req.params;
    
    db.get('SELECT * FROM sales_data WHERE date = ?', [date], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!row) {
            return res.json({
                date: date,
                shop_sales: 0,
                delivery_sales: 0,
                online_sales: 0,
                card_payment: 0
            });
        }
        res.json(row);
    });
});

app.get('/api/sales', (req, res) => {
    const { startDate, endDate } = req.query;
    
    if (!startDate || !endDate) {
        return res.status(400).json({ error: 'startDate and endDate are required' });
    }

    db.all('SELECT * FROM sales_data WHERE date >= ? AND date <= ? ORDER BY date', 
        [startDate, endDate], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

app.post('/api/sales', requireAdminOrUser, (req, res) => {
    const { date, shop_sales, delivery_sales, online_sales, card_payment } = req.body;
    
    if (!date) {
        return res.status(400).json({ error: 'Date is required' });
    }

    const shop = parseFloat(shop_sales) || 0;
    const delivery = parseFloat(delivery_sales) || 0;
    const online = parseFloat(online_sales) || 0;
    const card = parseFloat(card_payment) || 0;

    db.get('SELECT id FROM sales_data WHERE date = ?', [date], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });

        if (row) {
            db.run('UPDATE sales_data SET shop_sales = ?, delivery_sales = ?, online_sales = ?, card_payment = ?, updated_at = CURRENT_TIMESTAMP WHERE date = ?',
                [shop, delivery, online, card, date], function(err) {
                if (err) return res.status(500).json({ error: err.message });
                res.json({ message: 'Sales data updated successfully' });
            });
        } else {
            db.run('INSERT INTO sales_data (date, shop_sales, delivery_sales, online_sales, card_payment) VALUES (?, ?, ?, ?, ?)',
                [date, shop, delivery, online, card], function(err) {
                if (err) return res.status(500).json({ error: err.message });
                res.json({ id: this.lastID, message: 'Sales data saved successfully' });
            });
        }
    });
});

// ==================== STAFF ASSIGNMENTS API ====================

app.get('/api/staff-assignments', (req, res) => {
    const { startDate, endDate } = req.query;
    
    if (!startDate || !endDate) {
        return res.status(400).json({ error: 'startDate and endDate are required' });
    }

    const query = `
        SELECT sa.*, sm.name as staff_name 
        FROM staff_assignments sa
        JOIN staff_members sm ON sa.staff_id = sm.id
        WHERE sa.date >= ? AND sa.date <= ?
        ORDER BY sa.date, sm.name
    `;

    db.all(query, [startDate, endDate], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

app.post('/api/staff-assignments', requireAdminOrUser, (req, res) => {
    const { staff_id, date, hours, rate, source } = req.body;
    
    if (!staff_id || !date || !hours || !rate) {
        return res.status(400).json({ error: 'staff_id, date, hours, and rate are required' });
    }

    const cost = parseFloat(hours) * parseFloat(rate);
    const assignmentSource = source || 'manual';

    db.run('INSERT INTO staff_assignments (staff_id, date, hours, rate, cost, source) VALUES (?, ?, ?, ?, ?, ?)',
        [staff_id, date, hours, rate, cost, assignmentSource], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ id: this.lastID, message: 'Staff assignment added successfully' });
    });
});

app.delete('/api/staff-assignments/:id', requireAdmin, (req, res) => {
    const { id } = req.params;
    
    db.run('DELETE FROM staff_assignments WHERE id = ?', [id], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        if (this.changes === 0) return res.status(404).json({ error: 'Staff assignment not found' });
        res.json({ message: 'Staff assignment deleted successfully' });
    });
});

// ==================== SUPPLIER ORDERS API ====================

app.get('/api/supplier-orders', (req, res) => {
    const { startDate, endDate } = req.query;
    
    if (!startDate || !endDate) {
        return res.status(400).json({ error: 'startDate and endDate are required' });
    }

    const query = `
        SELECT so.*, s.name as supplier_name 
        FROM supplier_orders so
        JOIN suppliers s ON so.supplier_id = s.id
        WHERE so.date >= ? AND so.date <= ?
        ORDER BY so.date, s.name
    `;

    db.all(query, [startDate, endDate], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

app.post('/api/supplier-orders', requireAdminOrUser, (req, res) => {
    const { supplier_id, date, amount } = req.body;
    
    if (!supplier_id || !date || !amount) {
        return res.status(400).json({ error: 'supplier_id, date, and amount are required' });
    }

    db.run('INSERT INTO supplier_orders (supplier_id, date, amount) VALUES (?, ?, ?)',
        [supplier_id, date, amount], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ id: this.lastID, message: 'Supplier order added successfully' });
    });
});

app.delete('/api/supplier-orders/:id', requireAdmin, (req, res) => {
    const { id } = req.params;
    
    db.run('DELETE FROM supplier_orders WHERE id = ?', [id], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        if (this.changes === 0) return res.status(404).json({ error: 'Supplier order not found' });
        res.json({ message: 'Supplier order deleted successfully' });
    });
});

// ==================== CLOCK SESSIONS API ====================

app.get('/api/clock-sessions/active', (req, res) => {
    const query = `
        SELECT cs.*, sm.name as staff_name 
        FROM clock_sessions cs
        JOIN staff_members sm ON cs.staff_id = sm.id
        WHERE cs.clock_out_time IS NULL
        ORDER BY cs.clock_in_time
    `;

    db.all(query, [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

app.post('/api/clock-sessions/clock-in', requireAdminOrUser, (req, res) => {
    const { staff_id, rate } = req.body;
    
    if (!staff_id || !rate) {
        return res.status(400).json({ error: 'staff_id and rate are required' });
    }

    db.get('SELECT id FROM clock_sessions WHERE staff_id = ? AND clock_out_time IS NULL', [staff_id], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        if (row) return res.status(409).json({ error: 'Staff member is already clocked in' });

        db.run('INSERT INTO clock_sessions (staff_id, clock_in_time, rate) VALUES (?, CURRENT_TIMESTAMP, ?)',
            [staff_id, rate], function(err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ id: this.lastID, message: 'Clocked in successfully' });
        });
    });
});

app.post('/api/clock-sessions/clock-out/:id', requireAdminOrUser, (req, res) => {
    const { id } = req.params;
    
    db.get('SELECT * FROM clock_sessions WHERE id = ? AND clock_out_time IS NULL', [id], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!row) return res.status(404).json({ error: 'Active clock session not found' });

        const clockInTime = new Date(row.clock_in_time);
        const clockOutTime = new Date();
        const totalSeconds = Math.floor((clockOutTime - clockInTime) / 1000);
        const totalHours = totalSeconds / 3600;

        db.run('UPDATE clock_sessions SET clock_out_time = CURRENT_TIMESTAMP, total_seconds = ?, total_hours = ? WHERE id = ?',
            [totalSeconds, totalHours, id], function(err) {
            if (err) return res.status(500).json({ error: err.message });

            const today = new Date().toISOString().split('T')[0];
            const cost = totalHours * row.rate;

            db.run('INSERT INTO staff_assignments (staff_id, date, hours, rate, cost, source) VALUES (?, ?, ?, ?, ?, ?)',
                [row.staff_id, today, totalHours, row.rate, cost, 'time-clock'], function(err) {
                if (err) console.error('Error adding to staff assignments:', err.message);
            });

            res.json({ 
                message: 'Clocked out successfully', 
                hours_worked: totalHours.toFixed(2),
                cost: cost.toFixed(2)
            });
        });
    });
});

// ==================== SETTINGS API ====================

app.get('/api/settings/:key', (req, res) => {
    const { key } = req.params;
    
    db.get('SELECT * FROM settings WHERE key = ?', [key], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!row) return res.status(404).json({ error: 'Setting not found' });
        res.json(row);
    });
});

app.post('/api/settings', requireAdmin, (req, res) => {
    const { key, value } = req.body;
    
    if (!key || value === undefined) {
        return res.status(400).json({ error: 'key and value are required' });
    }

    db.run('INSERT OR REPLACE INTO settings (key, value, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP)',
        [key, value], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Setting updated successfully' });
    });
});

// ==================== REPORTS API ====================

app.get('/api/reports/summary', (req, res) => {
    const { startDate, endDate } = req.query;
    
    if (!startDate || !endDate) {
        return res.status(400).json({ error: 'startDate and endDate are required' });
    }

    const salesQuery = `
        SELECT 
            SUM(shop_sales + delivery_sales + online_sales + card_payment) as total_sales,
            SUM(shop_sales) as shop_sales,
            SUM(delivery_sales) as delivery_sales,
            SUM(online_sales) as online_sales,
            SUM(card_payment) as card_payment
        FROM sales_data 
        WHERE date >= ? AND date <= ?
    `;

    const staffCostQuery = `
        SELECT SUM(cost) as total_staff_cost
        FROM staff_assignments sa
        JOIN staff_members sm ON sa.staff_id = sm.id
        WHERE sa.date >= ? AND sa.date <= ?
    `;

    const supplierCostQuery = `
        SELECT SUM(amount) as total_supplier_cost
        FROM supplier_orders so
        JOIN suppliers s ON so.supplier_id = s.id
        WHERE so.date >= ? AND so.date <= ?
    `;

    db.get(salesQuery, [startDate, endDate], (err, salesRow) => {
        if (err) return res.status(500).json({ error: err.message });

        db.get(staffCostQuery, [startDate, endDate], (err, staffRow) => {
            if (err) return res.status(500).json({ error: err.message });

            db.get(supplierCostQuery, [startDate, endDate], (err, supplierRow) => {
                if (err) return res.status(500).json({ error: err.message });

                const totalSales = salesRow.total_sales || 0;
                const totalStaffCost = staffRow.total_staff_cost || 0;
                const totalSupplierCost = supplierRow.total_supplier_cost || 0;
                const totalExpenses = totalStaffCost + totalSupplierCost;
                const netProfit = totalSales - totalExpenses;

                db.get('SELECT value FROM settings WHERE key = ?', ['partner_percentage'], (err, settingRow) => {
                    if (err) return res.status(500).json({ error: err.message });

                    const partnerPercentage = parseFloat(settingRow?.value || 50);
                    const partnerShare = (netProfit * partnerPercentage) / 100;
                    const ownerShare = netProfit - partnerShare;

                    res.json({
                        period: { startDate, endDate },
                        sales: {
                            total: totalSales,
                            shop: salesRow.shop_sales || 0,
                            delivery: salesRow.delivery_sales || 0,
                            online: salesRow.online_sales || 0,
                            cardPayment: salesRow.card_payment || 0
                        },
                        expenses: {
                            total: totalExpenses,
                            staff: totalStaffCost,
                            supplier: totalSupplierCost
                        },
                        profit: {
                            net: netProfit,
                            partnerPercentage: partnerPercentage,
                            partnerShare: partnerShare,
                            ownerShare: ownerShare
                        }
                    });
                });
            });
        });
    });
});

app.get('/api/reports/account', (req, res) => {
    const { type, id, startDate, endDate } = req.query;
    
    if (!type || !id || !startDate || !endDate) {
        return res.status(400).json({ error: 'type, id, startDate, and endDate are required' });
    }

    if (type === 'staff') {
        const query = `
            SELECT sa.*, sm.name as staff_name
            FROM staff_assignments sa
            JOIN staff_members sm ON sa.staff_id = sm.id
            WHERE sa.staff_id = ? AND sa.date >= ? AND sa.date <= ?
            ORDER BY sa.date
        `;

        db.all(query, [id, startDate, endDate], (err, rows) => {
            if (err) return res.status(500).json({ error: err.message });

            const totalHours = rows.reduce((sum, row) => sum + row.hours, 0);
            const totalCost = rows.reduce((sum, row) => sum + row.cost, 0);

            res.json({
                type: 'staff',
                name: rows.length > 0 ? rows[0].staff_name : '',
                period: { startDate, endDate },
                transactions: rows,
                totals: { hours: totalHours, cost: totalCost }
            });
        });
    } else if (type === 'supplier') {
        const query = `
            SELECT so.*, s.name as supplier_name
            FROM supplier_orders so
            JOIN suppliers s ON so.supplier_id = s.id
            WHERE so.supplier_id = ? AND so.date >= ? AND so.date <= ?
            ORDER BY so.date
        `;

        db.all(query, [id, startDate, endDate], (err, rows) => {
            if (err) return res.status(500).json({ error: err.message });

            const totalAmount = rows.reduce((sum, row) => sum + row.amount, 0);

            res.json({
                type: 'supplier',
                name: rows.length > 0 ? rows[0].supplier_name : '',
                period: { startDate, endDate },
                transactions: rows,
                totals: { amount: totalAmount }
            });
        });
    } else {
        return res.status(400).json({ error: 'Invalid account type. Use "staff" or "supplier"' });
    }
});

// ==================== NOTES API ====================

// Get all notes (with filtering options)
app.get('/api/notes', (req, res) => {
    const { category, priority, is_pinned, is_archived, search } = req.query;
    
    let query = 'SELECT n.*, u.username as created_by_name FROM notes n LEFT JOIN users u ON n.created_by = u.id WHERE 1=1';
    const params = [];
    
    if (category) {
        query += ' AND n.category = ?';
        params.push(category);
    }
    
    if (priority) {
        query += ' AND n.priority = ?';
        params.push(priority);
    }
    
    if (is_pinned !== undefined) {
        query += ' AND n.is_pinned = ?';
        params.push(is_pinned === 'true' ? 1 : 0);
    }
    
    if (is_archived !== undefined) {
        query += ' AND n.is_archived = ?';
        params.push(is_archived === 'true' ? 1 : 0);
    } else {
        // By default, don't show archived notes
        query += ' AND n.is_archived = 0';
    }
    
    if (search) {
        query += ' AND (n.title LIKE ? OR n.content LIKE ?)';
        params.push(`%${search}%`, `%${search}%`);
    }
    
    query += ' ORDER BY n.is_pinned DESC, n.updated_at DESC';
    
    db.all(query, params, (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// Get single note
app.get('/api/notes/:id', (req, res) => {
    const { id } = req.params;
    
    const query = `
        SELECT n.*, u.username as created_by_name 
        FROM notes n 
        LEFT JOIN users u ON n.created_by = u.id 
        WHERE n.id = ?
    `;
    
    db.get(query, [id], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!row) return res.status(404).json({ error: 'Note not found' });
        res.json(row);
    });
});

// Create note
app.post('/api/notes', requireAdminOrUser, (req, res) => {
    const { title, content, category, priority } = req.body;
    
    if (!title || !content) {
        return res.status(400).json({ error: 'Title and content are required' });
    }
    
    const noteCategory = category || 'general';
    const notePriority = priority || 'normal';
    const createdBy = req.user ? req.user.id : null;
    
    db.run(
        'INSERT INTO notes (title, content, category, priority, created_by) VALUES (?, ?, ?, ?, ?)',
        [title, content, noteCategory, notePriority, createdBy],
        function(err) {
            if (err) return res.status(500).json({ error: err.message });
            
            res.status(201).json({
                id: this.lastID,
                message: 'Note created successfully',
                title,
                content,
                category: noteCategory,
                priority: notePriority
            });
        }
    );
});

// Update note
app.put('/api/notes/:id', requireAdminOrUser, (req, res) => {
    const { id } = req.params;
    const { title, content, category, priority, is_pinned, is_archived } = req.body;
    
    const updates = [];
    const params = [];
    
    if (title !== undefined) {
        updates.push('title = ?');
        params.push(title);
    }
    if (content !== undefined) {
        updates.push('content = ?');
        params.push(content);
    }
    if (category !== undefined) {
        updates.push('category = ?');
        params.push(category);
    }
    if (priority !== undefined) {
        updates.push('priority = ?');
        params.push(priority);
    }
    if (is_pinned !== undefined) {
        updates.push('is_pinned = ?');
        params.push(is_pinned ? 1 : 0);
    }
    if (is_archived !== undefined) {
        updates.push('is_archived = ?');
        params.push(is_archived ? 1 : 0);
    }
    
    if (updates.length === 0) {
        return res.status(400).json({ error: 'No fields to update' });
    }
    
    params.push(id);
    
    db.run(
        `UPDATE notes SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
        params,
        function(err) {
            if (err) return res.status(500).json({ error: err.message });
            if (this.changes === 0) return res.status(404).json({ error: 'Note not found' });
            res.json({ message: 'Note updated successfully' });
        }
    );
});

// Delete note
app.delete('/api/notes/:id', requireAdmin, (req, res) => {
    const { id } = req.params;
    
    db.run('DELETE FROM notes WHERE id = ?', [id], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        if (this.changes === 0) return res.status(404).json({ error: 'Note not found' });
        res.json({ message: 'Note deleted successfully' });
    });
});

// Toggle pin status
app.patch('/api/notes/:id/pin', requireAdminOrUser, (req, res) => {
    const { id } = req.params;
    const { is_pinned } = req.body;
    
    db.run(
        'UPDATE notes SET is_pinned = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [is_pinned ? 1 : 0, id],
        function(err) {
            if (err) return res.status(500).json({ error: err.message });
            if (this.changes === 0) return res.status(404).json({ error: 'Note not found' });
            res.json({ message: is_pinned ? 'Note pinned' : 'Note unpinned' });
        }
    );
});

// ==================== INVOICES API ====================

// Get all invoices
app.get('/api/invoices', (req, res) => {
    const { status, supplier_id, search, date_from, date_to } = req.query;
    
    let query = `
        SELECT i.*, s.name as supplier_name, u.username as uploaded_by_name 
        FROM invoices i 
        LEFT JOIN suppliers s ON i.supplier_id = s.id 
        LEFT JOIN users u ON i.uploaded_by = u.id 
        WHERE 1=1
    `;
    const params = [];
    
    if (status) {
        query += ' AND i.status = ?';
        params.push(status);
    }
    
    if (supplier_id) {
        query += ' AND i.supplier_id = ?';
        params.push(supplier_id);
    }
    
    if (date_from) {
        query += ' AND i.invoice_date >= ?';
        params.push(date_from);
    }
    
    if (date_to) {
        query += ' AND i.invoice_date <= ?';
        params.push(date_to);
    }
    
    if (search) {
        query += ' AND (i.title LIKE ? OR i.description LIKE ? OR i.invoice_number LIKE ?)';
        params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }
    
    query += ' ORDER BY i.created_at DESC';
    
    db.all(query, params, (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// Get single invoice
app.get('/api/invoices/:id', (req, res) => {
    const { id } = req.params;
    
    const query = `
        SELECT i.*, s.name as supplier_name, u.username as uploaded_by_name 
        FROM invoices i 
        LEFT JOIN suppliers s ON i.supplier_id = s.id 
        LEFT JOIN users u ON i.uploaded_by = u.id 
        WHERE i.id = ?
    `;
    
    db.get(query, [id], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!row) return res.status(404).json({ error: 'Invoice not found' });
        res.json(row);
    });
});

// Download invoice file
app.get('/api/invoices/:id/download', (req, res) => {
    const { id } = req.params;
    
    db.get('SELECT file_path, file_name, file_type FROM invoices WHERE id = ?', [id], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!row || !row.file_path) return res.status(404).json({ error: 'File not found' });
        
        const filePath = path.join(__dirname, 'uploads', row.file_path);
        
        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ error: 'File not found on server' });
        }
        
        res.setHeader('Content-Disposition', `attachment; filename="${row.file_name}"`);
        res.setHeader('Content-Type', row.file_type || 'application/octet-stream');
        res.sendFile(filePath);
    });
});

// Upload new invoice
app.post('/api/invoices', 
    requireAdminOrUser,
    invoiceUpload.single('file'),
    handleUploadError,
    (req, res) => {
        const { 
            invoice_number, 
            supplier_id, 
            title, 
            description, 
            amount, 
            invoice_date, 
            due_date, 
            status 
        } = req.body;
        
        if (!title) {
            // Delete uploaded file if validation fails
            if (req.file) {
                deleteFile(path.join('invoices', req.file.filename));
            }
            return res.status(400).json({ error: 'Title is required' });
        }
        
        const uploadedBy = req.user ? req.user.id : null;
        const fileInfo = req.file ? {
            path: path.join('invoices', req.file.filename),
            name: req.file.originalname,
            size: req.file.size,
            type: req.file.mimetype
        } : null;
        
        db.run(
            `INSERT INTO invoices (
                invoice_number, supplier_id, title, description, amount, 
                invoice_date, due_date, status, file_path, file_name, 
                file_size, file_type, uploaded_by
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                invoice_number || null,
                supplier_id || null,
                title,
                description || null,
                amount ? parseFloat(amount) : null,
                invoice_date || null,
                due_date || null,
                status || 'pending',
                fileInfo ? fileInfo.path : null,
                fileInfo ? fileInfo.name : null,
                fileInfo ? fileInfo.size : null,
                fileInfo ? fileInfo.type : null,
                uploadedBy
            ],
            function(err) {
                if (err) {
                    // Delete uploaded file if database insert fails
                    if (req.file) {
                        deleteFile(path.join('invoices', req.file.filename));
                    }
                    return res.status(500).json({ error: err.message });
                }
                
                res.status(201).json({
                    id: this.lastID,
                    message: 'Invoice created successfully',
                    title,
                    hasFile: !!fileInfo,
                    fileSize: fileInfo ? formatFileSize(fileInfo.size) : null
                });
            }
        );
    }
);

// Update invoice
app.put('/api/invoices/:id', requireAdminOrUser, (req, res) => {
    const { id } = req.params;
    const { 
        invoice_number, 
        supplier_id, 
        title, 
        description, 
        amount, 
        invoice_date, 
        due_date, 
        status 
    } = req.body;
    
    const updates = [];
    const params = [];
    
    if (invoice_number !== undefined) {
        updates.push('invoice_number = ?');
        params.push(invoice_number);
    }
    if (supplier_id !== undefined) {
        updates.push('supplier_id = ?');
        params.push(supplier_id);
    }
    if (title !== undefined) {
        updates.push('title = ?');
        params.push(title);
    }
    if (description !== undefined) {
        updates.push('description = ?');
        params.push(description);
    }
    if (amount !== undefined) {
        updates.push('amount = ?');
        params.push(parseFloat(amount));
    }
    if (invoice_date !== undefined) {
        updates.push('invoice_date = ?');
        params.push(invoice_date);
    }
    if (due_date !== undefined) {
        updates.push('due_date = ?');
        params.push(due_date);
    }
    if (status !== undefined) {
        updates.push('status = ?');
        params.push(status);
    }
    
    if (updates.length === 0) {
        return res.status(400).json({ error: 'No fields to update' });
    }
    
    params.push(id);
    
    db.run(
        `UPDATE invoices SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
        params,
        function(err) {
            if (err) return res.status(500).json({ error: err.message });
            if (this.changes === 0) return res.status(404).json({ error: 'Invoice not found' });
            res.json({ message: 'Invoice updated successfully' });
        }
    );
});

// Delete invoice
app.delete('/api/invoices/:id', requireAdmin, (req, res) => {
    const { id } = req.params;
    
    // Get file path before deleting record
    db.get('SELECT file_path FROM invoices WHERE id = ?', [id], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!row) return res.status(404).json({ error: 'Invoice not found' });
        
        // Delete from database
        db.run('DELETE FROM invoices WHERE id = ?', [id], function(err) {
            if (err) return res.status(500).json({ error: err.message });
            
            // Delete associated file if exists
            if (row.file_path) {
                deleteFile(row.file_path);
            }
            
            res.json({ message: 'Invoice deleted successfully' });
        });
    });
});

// Update invoice status
app.patch('/api/invoices/:id/status', requireAdminOrUser, (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    
    const validStatuses = ['pending', 'paid', 'overdue', 'cancelled'];
    if (!validStatuses.includes(status)) {
        return res.status(400).json({ 
            error: 'Invalid status. Must be: pending, paid, overdue, or cancelled' 
        });
    }
    
    db.run(
        'UPDATE invoices SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [status, id],
        function(err) {
            if (err) return res.status(500).json({ error: err.message });
            if (this.changes === 0) return res.status(404).json({ error: 'Invoice not found' });
            res.json({ message: `Invoice status updated to ${status}` });
        }
    );
});

// Get invoice statistics
app.get('/api/invoices/stats/summary', (req, res) => {
    const query = `
        SELECT 
            COUNT(*) as total_count,
            SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_count,
            SUM(CASE WHEN status = 'paid' THEN 1 ELSE 0 END) as paid_count,
            SUM(CASE WHEN status = 'overdue' THEN 1 ELSE 0 END) as overdue_count,
            SUM(CASE WHEN amount IS NOT NULL THEN amount ELSE 0 END) as total_amount,
            SUM(CASE WHEN status = 'pending' AND amount IS NOT NULL THEN amount ELSE 0 END) as pending_amount,
            SUM(CASE WHEN status = 'overdue' AND amount IS NOT NULL THEN amount ELSE 0 END) as overdue_amount
        FROM invoices
    `;
    
    db.get(query, [], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(row);
    });
});

// ==================== PUBLIC ROUTES ====================

// Serve login page
app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

// Check if authentication is required
app.get('/api/auth/check', (req, res) => {
    db.get("SELECT value FROM settings WHERE key = 'require_login'", [], (err, row) => {
        const requireLogin = row ? row.value === 'true' : true;
        res.json({ requireLogin });
    });
});

// Root route - serve dashboard or redirect to login
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ==================== ERROR HANDLING ====================

// 404 handler
app.use(notFoundHandler);

// Global error handler
app.use(errorHandler);

// ==================== SERVER STARTUP ====================

function startServer() {
    // HTTP Server (always start)
    const httpServer = http.createServer(app);
    httpServer.listen(PORT, () => {
        console.log(`🚀 HTTP Server running on http://localhost:${PORT}`);
        console.log(`📁 Database: ${dbPath}`);
        console.log(`🔒 Authentication: ENABLED`);
    });

    // HTTPS Server (optional)
    if (ENABLE_HTTPS) {
        try {
            const keyPath = path.join(__dirname, SSL_KEY_PATH);
            const certPath = path.join(__dirname, SSL_CERT_PATH);

            if (fs.existsSync(keyPath) && fs.existsSync(certPath)) {
                const httpsOptions = {
                    key: fs.readFileSync(keyPath),
                    cert: fs.readFileSync(certPath)
                };

                const httpsServer = https.createServer(httpsOptions, app);
                httpsServer.listen(HTTPS_PORT, () => {
                    console.log(`🔒 HTTPS Server running on https://localhost:${HTTPS_PORT}`);
                });
            } else {
                console.log('⚠️  SSL certificates not found. HTTPS not enabled.');
                console.log('   Run: npm run generate-ssl to create self-signed certificates');
            }
        } catch (error) {
            console.error('❌ Error starting HTTPS server:', error.message);
        }
    }
}

startServer();

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\n👋 Shutting down server...');
    db.close((err) => {
        if (err) {
            console.error('Error closing database:', err.message);
        } else {
            console.log('✅ Database connection closed.');
        }
        process.exit(0);
    });
});