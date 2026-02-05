const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// Database file path
const dbPath = path.join(__dirname, 'database.sqlite');

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads', 'invoices');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
    console.log('✅ Created uploads directory');
}

// Create and initialize database
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database:', err.message);
        return;
    }
    console.log('Connected to SQLite database.');
});

// Enable foreign key constraints
db.run('PRAGMA foreign_keys = ON');

// Create tables
db.serialize(() => {
    // Users table (for authentication)
    db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT NOT NULL UNIQUE,
        email TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        role TEXT DEFAULT 'user' CHECK (role IN ('admin', 'user', 'viewer')),
        is_active INTEGER DEFAULT 1,
        last_login DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`, (err) => {
        if (err) console.error('Error creating users table:', err.message);
        else console.log('✓ users table created');
    });

    // Password reset tokens table
    db.run(`CREATE TABLE IF NOT EXISTS password_reset_tokens (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        token TEXT NOT NULL UNIQUE,
        expires_at DATETIME NOT NULL,
        used INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
    )`, (err) => {
        if (err) console.error('Error creating password_reset_tokens table:', err.message);
        else console.log('✓ password_reset_tokens table created');
    });

    // Login attempts table (for security)
    db.run(`CREATE TABLE IF NOT EXISTS login_attempts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT NOT NULL,
        ip_address TEXT,
        success INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`, (err) => {
        if (err) console.error('Error creating login_attempts table:', err.message);
        else console.log('✓ login_attempts table created');
    });

    // Staff Members table
    db.run(`CREATE TABLE IF NOT EXISTS staff_members (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`, (err) => {
        if (err) console.error('Error creating staff_members table:', err.message);
        else console.log('✓ staff_members table created');
    });

    // Suppliers table
    db.run(`CREATE TABLE IF NOT EXISTS suppliers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`, (err) => {
        if (err) console.error('Error creating suppliers table:', err.message);
        else console.log('✓ suppliers table created');
    });

    // Partners table
    db.run(`CREATE TABLE IF NOT EXISTS partners (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT NOT NULL UNIQUE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`, (err) => {
        if (err) console.error('Error creating partners table:', err.message);
        else console.log('✓ partners table created');
    });

    // Settings table
    db.run(`CREATE TABLE IF NOT EXISTS settings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        key TEXT NOT NULL UNIQUE,
        value TEXT NOT NULL,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`, (err) => {
        if (err) console.error('Error creating settings table:', err.message);
        else console.log('✓ settings table created');
    });

    // Sales Data table
    db.run(`CREATE TABLE IF NOT EXISTS sales_data (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        date DATE NOT NULL UNIQUE,
        shop_sales REAL DEFAULT 0,
        delivery_sales REAL DEFAULT 0,
        online_sales REAL DEFAULT 0,
        card_payment REAL DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`, (err) => {
        if (err) console.error('Error creating sales_data table:', err.message);
        else console.log('✓ sales_data table created');
    });

    // Staff Assignments table
    db.run(`CREATE TABLE IF NOT EXISTS staff_assignments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        staff_id INTEGER NOT NULL,
        date DATE NOT NULL,
        hours REAL NOT NULL,
        rate REAL NOT NULL,
        cost REAL NOT NULL,
        source TEXT DEFAULT 'manual',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (staff_id) REFERENCES staff_members (id) ON DELETE CASCADE
    )`, (err) => {
        if (err) console.error('Error creating staff_assignments table:', err.message);
        else console.log('✓ staff_assignments table created');
    });

    // Supplier Orders table
    db.run(`CREATE TABLE IF NOT EXISTS supplier_orders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        supplier_id INTEGER NOT NULL,
        date DATE NOT NULL,
        amount REAL NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (supplier_id) REFERENCES suppliers (id) ON DELETE CASCADE
    )`, (err) => {
        if (err) console.error('Error creating supplier_orders table:', err.message);
        else console.log('✓ supplier_orders table created');
    });

    // Clock Sessions table
    db.run(`CREATE TABLE IF NOT EXISTS clock_sessions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        staff_id INTEGER NOT NULL,
        clock_in_time DATETIME NOT NULL,
        clock_out_time DATETIME,
        rate REAL NOT NULL,
        total_seconds INTEGER DEFAULT 0,
        total_hours REAL DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (staff_id) REFERENCES staff_members (id) ON DELETE CASCADE
    )`, (err) => {
        if (err) console.error('Error creating clock_sessions table:', err.message);
        else console.log('✓ clock_sessions table created');
    });

    // ==================== NEW TABLES ====================

    // Notes table - for keeping track of anything
    db.run(`CREATE TABLE IF NOT EXISTS notes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        category TEXT DEFAULT 'general',
        priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
        is_pinned INTEGER DEFAULT 0,
        is_archived INTEGER DEFAULT 0,
        created_by INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (created_by) REFERENCES users (id) ON DELETE SET NULL
    )`, (err) => {
        if (err) console.error('Error creating notes table:', err.message);
        else console.log('✓ notes table created');
    });

    // Invoices table - for storing invoice information
    db.run(`CREATE TABLE IF NOT EXISTS invoices (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        invoice_number TEXT,
        supplier_id INTEGER,
        title TEXT NOT NULL,
        description TEXT,
        amount REAL,
        invoice_date DATE,
        due_date DATE,
        status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'overdue', 'cancelled')),
        file_path TEXT,
        file_name TEXT,
        file_size INTEGER,
        file_type TEXT,
        uploaded_by INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (supplier_id) REFERENCES suppliers (id) ON DELETE SET NULL,
        FOREIGN KEY (uploaded_by) REFERENCES users (id) ON DELETE SET NULL
    )`, (err) => {
        if (err) console.error('Error creating invoices table:', err.message);
        else console.log('✓ invoices table created');
    });

    // Invoice tags table - for categorizing invoices
    db.run(`CREATE TABLE IF NOT EXISTS invoice_tags (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        invoice_id INTEGER NOT NULL,
        tag TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (invoice_id) REFERENCES invoices (id) ON DELETE CASCADE
    )`, (err) => {
        if (err) console.error('Error creating invoice_tags table:', err.message);
        else console.log('✓ invoice_tags table created');
    });

    // Insert default settings
    db.run(`INSERT OR IGNORE INTO settings (key, value) VALUES 
        ('partner_percentage', '50'),
        ('app_name', 'Business Summary Dashboard'),
        ('currency', 'GBP'),
        ('require_login', 'true'),
        ('session_timeout', '3600'),
        ('max_login_attempts', '5'),
        ('lockout_duration', '900'),
        ('max_file_size', '10485760'),
        ('allowed_file_types', 'pdf,jpg,jpeg,png,gif,doc,docx,xls,xlsx')
    `, (err) => {
        if (err) console.error('Error inserting default settings:', err.message);
        else console.log('✓ Default settings inserted');
    });

    // Insert sample staff members
    db.run(`INSERT OR IGNORE INTO staff_members (name) VALUES 
        ('John'),
        ('Sarah'),
        ('Mike'),
        ('Emma')
    `, (err) => {
        if (err) console.error('Error inserting sample staff:', err.message);
        else console.log('✓ Sample staff members inserted');
    });

    // Insert sample suppliers
    db.run(`INSERT OR IGNORE INTO suppliers (name) VALUES 
        ('Supplier A'),
        ('Supplier B'),
        ('Supplier C')
    `, (err) => {
        if (err) console.error('Error inserting sample suppliers:', err.message);
        else console.log('✓ Sample suppliers inserted');
    });

    // Insert sample notes
    db.run(`INSERT OR IGNORE INTO notes (title, content, category, priority) VALUES 
        ('Welcome Note', 'Welcome to your Business Dashboard! Use this notes section to keep track of important information, reminders, or anything you need to remember.', 'general', 'normal'),
        ('Monthly Review', 'Remember to review all supplier invoices at the end of each month.', 'reminder', 'high')
    `, (err) => {
        if (err) console.error('Error inserting sample notes:', err.message);
        else console.log('✓ Sample notes inserted');
    });

});

// Close database connection
db.close((err) => {
    if (err) {
        console.error('Error closing database:', err.message);
        return;
    }
    console.log('\n✅ Database initialization complete!');
    console.log(`Database file: ${dbPath}`);
    console.log(`Uploads directory: ${uploadsDir}`);
});