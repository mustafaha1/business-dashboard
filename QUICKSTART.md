# 🚀 Quick Start Guide

Get your secure Business Dashboard running in 5 minutes!

## ⚡ Super Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Initialize database
npm run init-db

# 3. Create admin user
npm run create-admin

# 4. Start server
npm run dev
```

**Done!** Open http://localhost:3000 and login with your admin credentials.

---

## 📋 Step-by-Step Instructions

### Step 1: Install Node.js

**Check if installed:**
```bash
node --version
npm --version
```

**If not installed:**
- **Windows/Mac:** Download from [nodejs.org](https://nodejs.org/)
- **Linux:** `sudo apt install nodejs npm`

### Step 2: Navigate to Project

```bash
cd business-dashboard-backend
```

### Step 3: Install Dependencies

```bash
npm install
```

This downloads all required packages. Wait for it to complete.

### Step 4: Initialize Database

```bash
npm run init-db
```

This creates the SQLite database with all tables.

Expected output:
```
✓ users table created
✓ staff_members table created
✓ suppliers table created
...
✅ Database initialization complete!
```

### Step 5: Create Admin User

```bash
npm run create-admin
```

Follow the prompts:
```
Username (min 3 characters): admin
Email: admin@yourcompany.com
Password: ********
Confirm Password: ********

✅ Admin user created successfully!
```

**Password Requirements:**
- At least 8 characters
- One uppercase letter
- One lowercase letter
- One number
- One special character

### Step 6: Start Server

```bash
# Development mode (auto-restart on changes)
npm run dev

# OR Production mode
npm start
```

Expected output:
```
✅ Connected to SQLite database.
🚀 HTTP Server running on http://localhost:3000
🔒 Authentication: ENABLED
```

### Step 7: Access Dashboard

1. Open browser: http://localhost:3000
2. You'll be redirected to login page
3. Enter your admin credentials
4. Start using your dashboard!

---

## 🔐 First Login

### Login Page
- URL: http://localhost:3000/login
- Enter username and password
- Click "Sign In"

### Dashboard Features
Once logged in, you can:
- ✅ Add/manage staff members
- ✅ Add/manage suppliers
- ✅ Enter daily sales data
- ✅ Track staff hours with time clock
- ✅ Generate business reports
- ✅ Calculate profit sharing
- ✅ View individual accounts

---

## 🛡️ Enable HTTPS (Optional)

### For Development

```bash
# Generate self-signed certificates
npm run generate-ssl

# Edit .env file
ENABLE_HTTPS=true

# Restart server
npm start
```

Access at: https://localhost:3443

⚠️ **Warning:** Browsers will show security warning for self-signed certificates. This is normal for development.

### For Production

Use Let's Encrypt for free SSL certificates:
```bash
# Install Certbot
sudo apt install certbot

# Get certificate
sudo certbot certonly --standalone -d yourdomain.com

# Update .env
SSL_KEY_PATH=/etc/letsencrypt/live/yourdomain.com/privkey.pem
SSL_CERT_PATH=/etc/letsencrypt/live/yourdomain.com/fullchain.pem
ENABLE_HTTPS=true
```

---

## 👥 Managing Users

### Create More Users

**Via API (Admin only):**
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "username": "john",
    "email": "john@company.com",
    "password": "SecurePass123!",
    "role": "user"
  }'
```

**Roles:**
- `admin` - Full access
- `user` - Can add data, can't delete
- `viewer` - View only

### List All Users
```bash
curl http://localhost:3000/api/users \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 📊 Using the Dashboard

### 1. Set Date Range
- Select start and end dates
- Click "Generate Report"

### 2. Enter Sales Data
- Enter daily sales for each category
- Click "Save" for each day

### 3. Add Staff/Suppliers
- Use management cards
- Enter names and click "Add"

### 4. Time Clock
- Select staff member
- Enter hourly rate
- Click "Clock In"
- Click "Clock Out" when done

### 5. Generate Reports
- View sales summary
- See profit calculations
- Check profit sharing distribution

---

## 🚀 Deploy to Cloud (Optional)

### Railway (Easiest)
1. Push code to GitHub
2. Connect Railway to GitHub
3. Add environment variables
4. Deploy automatically

### Render
1. Create Render account
2. Connect GitHub repo
3. Set build/start commands
4. Deploy

See [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) for detailed instructions.

---

## 🔧 Common Commands

```bash
# Start development server
npm run dev

# Start production server
npm start

# Initialize database
npm run init-db

# Create admin user
npm run create-admin

# Generate SSL certificates
npm run generate-ssl

# View all scripts
npm run
```

---

## 🐛 Troubleshooting

### "Cannot find module"
```bash
npm install
```

### "Port 3000 already in use"
```bash
# Kill process
lsof -ti:3000 | xargs kill -9

# Or use different port
PORT=3001 npm start
```

### "Database locked"
```bash
rm database.sqlite
npm run init-db
npm run create-admin
```

### "Permission denied"
```bash
chmod 755 .
```

---

## 📚 Next Steps

1. **Read Full Documentation:**
   - [README.md](README.md) - Complete overview
   - [SETUP_GUIDE.md](SETUP_GUIDE.md) - Detailed setup
   - [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) - Deploy to cloud
   - [API_QUICK_REFERENCE.md](API_QUICK_REFERENCE.md) - API docs

2. **Configure for Production:**
   - Change JWT_SECRET
   - Enable HTTPS
   - Set strong CORS policy
   - Configure rate limiting

3. **Set Up Backups:**
   - Backup database.sqlite regularly
   - Store backups offsite

4. **Monitor:**
   - Check logs regularly
   - Monitor disk space
   - Watch for errors

---

## ✅ Checklist

After setup, verify:
- [ ] Server starts without errors
- [ ] Can login with admin credentials
- [ ] Can add staff members
- [ ] Can save sales data
- [ ] Can use time clock
- [ ] Can generate reports
- [ ] Data persists after restart

---

**🎉 You're ready to go!**

For help, check the documentation files or open an issue.

**Happy Business Managing! 🚀**