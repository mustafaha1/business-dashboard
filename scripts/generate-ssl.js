#!/usr/bin/env node

/**
 * Generate SSL Certificates Script
 * 
 * Usage: node scripts/generate-ssl.js
 * 
 * This script generates self-signed SSL certificates for HTTPS.
 * For production, use certificates from a trusted CA (Let's Encrypt, etc.)
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const sslDir = path.join(__dirname, '..', 'ssl');
const keyPath = path.join(sslDir, 'key.pem');
const certPath = path.join(sslDir, 'cert.pem');

console.log('========================================');
console.log('  SSL Certificate Generator');
console.log('========================================\n');

// Check if OpenSSL is available
try {
    execSync('openssl version', { stdio: 'ignore' });
} catch (error) {
    console.error('❌ OpenSSL is not installed or not in PATH.');
    console.log('\nPlease install OpenSSL:');
    console.log('  - Windows: https://slproweb.com/products/Win32OpenSSL.html');
    console.log('  - Mac: brew install openssl');
    console.log('  - Linux: sudo apt-get install openssl');
    process.exit(1);
}

// Create ssl directory if it doesn't exist
if (!fs.existsSync(sslDir)) {
    fs.mkdirSync(sslDir, { recursive: true });
    console.log('✅ Created ssl directory');
}

// Check if certificates already exist
if (fs.existsSync(keyPath) && fs.existsSync(certPath)) {
    console.log('⚠️  SSL certificates already exist.\n');
    const readline = require('readline');
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });
    
    rl.question('Do you want to regenerate them? (y/N): ', (answer) => {
        rl.close();
        if (answer.toLowerCase() !== 'y') {
            console.log('Cancelled.');
            process.exit(0);
        }
        generateCertificates();
    });
} else {
    generateCertificates();
}

function generateCertificates() {
    console.log('\n🔐 Generating self-signed SSL certificates...\n');

    try {
        // Generate private key and certificate
        const config = `
[req]
distinguished_name = req_distinguished_name
x509_extensions = v3_req
prompt = no

[req_distinguished_name]
CN = localhost

[v3_req]
keyUsage = keyEncipherment, dataEncipherment
extendedKeyUsage = serverAuth
subjectAltName = @alt_names

[alt_names]
DNS.1 = localhost
DNS.2 = *.localhost
IP.1 = 127.0.0.1
IP.2 = ::1
`;

        const configPath = path.join(sslDir, 'openssl.cnf');
        fs.writeFileSync(configPath, config);

        // Generate certificate
        execSync(
            `openssl req -x509 -nodes -days 365 -newkey rsa:2048 ` +
            `-keyout "${keyPath}" ` +
            `-out "${certPath}" ` +
            `-config "${configPath}"`,
            { stdio: 'inherit' }
        );

        // Remove config file
        fs.unlinkSync(configPath);

        console.log('\n✅ SSL certificates generated successfully!');
        console.log('\nCertificate Details:');
        console.log(`  Private Key: ${keyPath}`);
        console.log(`  Certificate: ${certPath}`);
        console.log(`  Valid for: 365 days`);
        console.log(`  Common Name: localhost`);
        console.log(`  Subject Alternative Names: localhost, 127.0.0.1, ::1`);
        
        console.log('\n⚠️  IMPORTANT:');
        console.log('  These are self-signed certificates.');
        console.log('  Browsers will show a security warning.');
        console.log('  For production, use certificates from a trusted CA.');
        console.log('  (e.g., Let\'s Encrypt: https://letsencrypt.org/)');
        
        console.log('\n🚀 To enable HTTPS:');
        console.log('  1. Set ENABLE_HTTPS=true in your .env file');
        console.log('  2. Restart the server: npm start');
        console.log('  3. Access: https://localhost:3443');

    } catch (error) {
        console.error('\n❌ Error generating certificates:', error.message);
        process.exit(1);
    }
}