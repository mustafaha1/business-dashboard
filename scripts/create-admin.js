#!/usr/bin/env node

/**
 * Create Admin User Script
 * 
 * Usage: node scripts/create-admin.js
 * 
 * This script creates the first admin user for the dashboard.
 * Run this after initializing the database.
 */

const readline = require('readline');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const path = require('path');

const dbPath = path.join(__dirname, '..', 'database.sqlite');
const BCRYPT_ROUNDS = 12;

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function question(query) {
    return new Promise(resolve => rl.question(query, resolve));
}

function validatePassword(password) {
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    const errors = [];
    
    if (password.length < minLength) {
        errors.push(`Password must be at least ${minLength} characters long`);
    }
    if (!hasUpperCase) {
        errors.push('Password must contain at least one uppercase letter');
    }
    if (!hasLowerCase) {
        errors.push('Password must contain at least one lowercase letter');
    }
    if (!hasNumbers) {
        errors.push('Password must contain at least one number');
    }
    if (!hasSpecialChar) {
        errors.push('Password must contain at least one special character');
    }

    return errors;
}

async function createAdmin() {
    console.log('========================================');
    console.log('  Create Admin User');
    console.log('========================================\n');

    // Check if database exists
    const db = new sqlite3.Database(dbPath, (err) => {
        if (err) {
            console.error('❌ Error opening database:', err.message);
            console.log('   Please run "npm run init-db" first.');
            process.exit(1);
        }
    });

    // Check if users table exists
    const tableExists = await new Promise((resolve) => {
        db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='users'", [], (err, row) => {
            resolve(!!row);
        });
    });

    if (!tableExists) {
        console.error('❌ Users table does not exist.');
        console.log('   Please run "npm run init-db" first.');
        db.close();
        process.exit(1);
    }

    // Check if admin already exists
    const adminExists = await new Promise((resolve) => {
        db.get("SELECT COUNT(*) as count FROM users WHERE role = 'admin'", [], (err, row) => {
            resolve(row && row.count > 0);
        });
    });

    if (adminExists) {
        console.log('⚠️  An admin user already exists.\n');
        const createAnother = await question('Do you want to create another admin? (y/N): ');
        if (createAnother.toLowerCase() !== 'y') {
            console.log('Cancelled.');
            db.close();
            process.exit(0);
        }
        console.log('');
    }

    // Get username
    let username;
    while (true) {
        username = await question('Username (min 3 characters): ');
        username = username.trim();
        
        if (username.length < 3) {
            console.log('❌ Username must be at least 3 characters.\n');
            continue;
        }

        // Check if username exists
        const exists = await new Promise((resolve) => {
            db.get('SELECT id FROM users WHERE username = ?', [username], (err, row) => {
                resolve(!!row);
            });
        });

        if (exists) {
            console.log('❌ Username already exists.\n');
            continue;
        }

        break;
    }

    // Get email
    let email;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    while (true) {
        email = await question('Email: ');
        email = email.trim();
        
        if (!emailRegex.test(email)) {
            console.log('❌ Please enter a valid email address.\n');
            continue;
        }

        // Check if email exists
        const exists = await new Promise((resolve) => {
            db.get('SELECT id FROM users WHERE email = ?', [email], (err, row) => {
                resolve(!!row);
            });
        });

        if (exists) {
            console.log('❌ Email already exists.\n');
            continue;
        }

        break;
    }

    // Get password
    let password;
    while (true) {
        password = await question('Password: ');
        
        const errors = validatePassword(password);
        if (errors.length > 0) {
            console.log('❌ Password requirements:');
            errors.forEach(error => console.log(`   - ${error}`));
            console.log('');
            continue;
        }

        const confirmPassword = await question('Confirm Password: ');
        if (password !== confirmPassword) {
            console.log('❌ Passwords do not match.\n');
            continue;
        }

        break;
    }

    console.log('\nCreating admin user...');

    // Hash password
    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

    // Insert user
    db.run(
        'INSERT INTO users (username, email, password_hash, role) VALUES (?, ?, ?, ?)',
        [username, email, passwordHash, 'admin'],
        function(err) {
            if (err) {
                console.error('❌ Error creating admin user:', err.message);
                db.close();
                process.exit(1);
            }

            console.log('\n✅ Admin user created successfully!');
            console.log('\nUser Details:');
            console.log(`  ID: ${this.lastID}`);
            console.log(`  Username: ${username}`);
            console.log(`  Email: ${email}`);
            console.log(`  Role: admin`);
            console.log('\nYou can now log in at: http://localhost:3000/login');
            
            db.close();
            process.exit(0);
        }
    );
}

createAdmin().catch(err => {
    console.error('❌ Error:', err);
    process.exit(1);
});