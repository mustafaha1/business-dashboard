# 🚀 Business Dashboard Backend

A secure, full-featured backend for your Business Summary Dashboard with authentication, database storage, and HTTPS support.

> **🆕 First Time Here?** This is your first website? No problem! Start with our **[First-Time Setup Guide](FIRST_TIME_SETUP.md)** for step-by-step instructions written for beginners!

---

## 📚 Documentation Index

| Guide | For | Description |
|-------|-----|-------------|
| **[FIRST_TIME_SETUP.md](FIRST_TIME_SETUP.md)** | 🌟 Beginners | Complete step-by-step setup for first-time users |
| **[DEPLOY_STEP_BY_STEP.md](DEPLOY_STEP_BY_STEP.md)** | 🌟 Beginners | Visual deployment guide with screenshots descriptions |
| **[QUICK_COMMANDS.md](QUICK_COMMANDS.md)** | 🌟 Everyone | Quick reference cheat sheet |
| **[TROUBLESHOOTING.md](TROUBLESHOOTING.md)** | 🌟 Everyone | Fix common problems |
| **[DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)** | 🔧 Advanced | Detailed deployment options |
| **[API_QUICK_REFERENCE.md](API_QUICK_REFERENCE.md)** | 🔧 Developers | Complete API documentation |

---

## ⚡ Super Quick Start (For Experienced Users)

```bash
npm install
npm run init-db
npm run create-admin
npm run dev
```

Then open: http://localhost:3000

---

## 🌟 Features

## 🌟 Features

### ✅ Core Features
- **SQLite Database** - Persistent data storage
- **RESTful API** - All operations via HTTP endpoints
- **Staff Management** - Add, delete, and manage staff members
- **Supplier Management** - Add, delete, and manage suppliers
- **Partner Management** - Add, delete, and manage partners
- **Time Clock System** - Clock in/out with automatic time tracking
- **Sales Data** - Daily sales entry and reporting
- **Business Reports** - Comprehensive financial summaries

### 🔐 Security Features
- **User Authentication** - JWT-based login system
- **Password Hashing** - BCrypt with salt rounds
- **Role-Based Access** - Admin, User, and Viewer roles
- **Rate Limiting** - Prevent brute force attacks
- **Account Lockout** - Auto-lock after failed attempts
- **HTTPS Support** - SSL/TLS encryption
- **Security Headers** - Helmet.js protection
- **Input Sanitization** - XSS and injection protection
- **CORS Configuration** - Cross-origin request control

## 🚀 Quick Start

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn

### Installation

```bash
# 1. Install dependencies
npm install

# 2. Copy environment file
cp .env.example .env

# 3. Initialize database
npm run init-db

# 4. Create admin user
npm run create-admin

# 5. Start server
npm run dev
```

Access at: `http://localhost:3000`

Default login page: `http://localhost:3000/login`

## 📁 Project Structure

```
business-dashboard-backend/
├── server.js                 # Main Express server
├── init-db.js               # Database initialization
├── package.json             # Dependencies and scripts
├── .env.example             # Environment variables template
├── .env                     # Your environment variables
├── .gitignore               # Git ignore file
├── database.sqlite          # SQLite database (created)
├── ssl/                     # SSL certificates
│   ├── key.pem             # Private key
│   └── cert.pem            # Certificate
├── middleware/              # Express middleware
│   ├── auth.js             # Authentication middleware
│   └── security.js         # Security middleware
├── scripts/                 # Helper scripts
│   ├── create-admin.js     # Create admin user
│   └── generate-ssl.js     # Generate SSL certificates
├── public/                  # Frontend files
│   ├── index.html          # Dashboard (protected)
│   └── login.html          # Login page
└── docs/                    # Documentation
    ├── README.md           # This file
    ├── SETUP_GUIDE.md      # Detailed setup guide
    ├── DEPLOYMENT_GUIDE.md # Deployment instructions
    ├── API_QUICK_REFERENCE.md # API reference
    └── CHANGES_SUMMARY.md  # What's changed
```

## 🔐 Authentication

### User Roles

| Role | Description | Permissions |
|------|-------------|-------------|
| **admin** | Full access | All operations |
| **user** | Standard user | Create, read, update (no delete) |
| **viewer** | Read-only | View only, no modifications |

### Creating Users

```bash
# Create admin user (interactive)
npm run create-admin

# Or via API (admin only)
POST /api/auth/register
{
  "username": "newuser",
  "email": "user@example.com",
  "password": "SecurePass123!",
  "role": "user"
}
```

### Login

```bash
POST /api/auth/login
{
  "username": "admin",
  "password": "yourpassword"
}
```

Response:
```json
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": 1,
    "username": "admin",
    "email": "admin@example.com",
    "role": "admin"
  }
}
```

### Using the Token

Include the token in all API requests:

```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
     http://localhost:3000/api/staff
```

## 🔒 HTTPS Configuration

### Development (Self-Signed)

```bash
# Generate certificates
npm run generate-ssl

# Enable HTTPS in .env
ENABLE_HTTPS=true

# Restart server
npm start
```

Access at: `https://localhost:3443`

### Production (Let's Encrypt)

```bash
# Install Certbot
sudo apt install certbot

# Obtain certificate
sudo certbot certonly --standalone -d yourdomain.com

# Update .env
SSL_KEY_PATH=/etc/letsencrypt/live/yourdomain.com/privkey.pem
SSL_CERT_PATH=/etc/letsencrypt/live/yourdomain.com/fullchain.pem
ENABLE_HTTPS=true
```

## 📊 API Endpoints

### Authentication
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/auth/login` | Login | No |
| POST | `/api/auth/register` | Create user | Admin |
| GET | `/api/auth/me` | Get current user | Yes |
| POST | `/api/auth/change-password` | Change password | Yes |
| POST | `/api/auth/logout` | Logout | Yes |

### Staff Management
| Method | Endpoint | Description | Role Required |
|--------|----------|-------------|---------------|
| GET | `/api/staff` | List all staff | Any |
| POST | `/api/staff` | Add staff | Admin/User |
| DELETE | `/api/staff/:id` | Delete staff | Admin |

### Sales Data
| Method | Endpoint | Description | Role Required |
|--------|----------|-------------|---------------|
| GET | `/api/sales` | Get sales range | Any |
| GET | `/api/sales/:date` | Get sales by date | Any |
| POST | `/api/sales` | Save sales | Admin/User |

### Reports
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/reports/summary` | Business summary | Yes |
| GET | `/api/reports/account` | Account statement | Yes |

See [API_QUICK_REFERENCE.md](API_QUICK_REFERENCE.md) for complete documentation.

## ⚙️ Configuration

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | 3000 | HTTP port |
| `HTTPS_PORT` | 3443 | HTTPS port |
| `NODE_ENV` | development | Environment |
| `JWT_SECRET` | - | JWT signing key |
| `JWT_EXPIRES_IN` | 7d | Token expiration |
| `BCRYPT_ROUNDS` | 12 | Password hashing rounds |
| `ENABLE_HTTPS` | false | Enable HTTPS |
| `CORS_ORIGIN` | * | Allowed origins |
| `RATE_LIMIT_MAX` | 100 | API rate limit |
| `AUTH_RATE_LIMIT_MAX` | 10 | Login rate limit |

### Security Settings

```bash
# Production security checklist
JWT_SECRET=your-secure-random-string-here
NODE_ENV=production
CORS_ORIGIN=https://yourdomain.com
ENABLE_HTTPS=true
REQUIRE_LOGIN=true
ENABLE_REGISTRATION=false
```

## 🛡️ Security Features

### Implemented Protections

1. **Password Security**
   - BCrypt hashing (12 rounds)
   - Minimum 8 characters
   - Requires uppercase, lowercase, number, special char

2. **Rate Limiting**
   - 100 requests per 15 minutes (API)
   - 10 login attempts per 15 minutes (Auth)
   - Account lockout after 5 failed attempts

3. **JWT Security**
   - Secure random secret required
   - Configurable expiration (default 7 days)
   - Token validation on every request

4. **HTTP Security Headers**
   - Content Security Policy (CSP)
   - X-Frame-Options
   - X-Content-Type-Options
   - Strict-Transport-Security (HSTS)
   - Referrer Policy

5. **Input Protection**
   - XSS filtering
   - SQL injection prevention (parameterized queries)
   - Input validation and sanitization

## 🚀 Deployment

### Local Development
```bash
npm run dev
```

### Production Server
```bash
# Using PM2
npm install -g pm2
pm2 start server.js --name "dashboard"
pm2 save
pm2 startup
```

### Cloud Platforms
- **Railway**: See [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)
- **Render**: See [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)
- **Heroku**: See [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)
- **VPS/DigitalOcean**: See [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)

## 📈 Monitoring

### PM2 Commands
```bash
pm2 status              # View status
pm2 logs dashboard      # View logs
pm2 monit               # Monitor dashboard
pm2 restart dashboard   # Restart app
```

### Database Backup
```bash
# Manual backup
cp database.sqlite backups/backup_$(date +%Y%m%d).sqlite

# Automated (add to crontab)
0 2 * * * /path/to/backup.sh
```

## 🐛 Troubleshooting

### Common Issues

**Port already in use:**
```bash
lsof -ti:3000 | xargs kill -9
```

**Database locked:**
```bash
# Stop server, then:
rm database.sqlite
npm run init-db
npm run create-admin
```

**Permission denied:**
```bash
chmod 755 .
```

**Module not found:**
```bash
rm -rf node_modules
npm install
```

## 📚 Documentation

- [SETUP_GUIDE.md](SETUP_GUIDE.md) - Step-by-step setup instructions
- [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) - Deployment to various platforms
- [API_QUICK_REFERENCE.md](API_QUICK_REFERENCE.md) - Complete API documentation
- [CHANGES_SUMMARY.md](CHANGES_SUMMARY.md) - What's changed from local storage

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 📄 License

This project is open source. Feel free to modify and distribute as needed.

## 🙏 Acknowledgments

- Express.js - Web framework
- SQLite - Database
- bcryptjs - Password hashing
- jsonwebtoken - JWT authentication
- Helmet - Security headers

---

**Need Help?** Check the documentation files or open an issue.

**Happy Business Managing! 🚀**