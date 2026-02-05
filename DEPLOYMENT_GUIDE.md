# 🚀 Complete Deployment Guide

This guide will walk you through deploying your Business Dashboard with authentication and HTTPS to various platforms.

## 📋 Table of Contents

1. [Local Deployment](#local-deployment)
2. [Cloud Deployment Options](#cloud-deployment-options)
3. [Production Server Setup](#production-server-setup)
4. [HTTPS Configuration](#https-configuration)
5. [Security Checklist](#security-checklist)
6. [Troubleshooting](#troubleshooting)

---

## 🏠 Local Deployment

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn
- Git (optional)

### Step 1: Download and Extract
```bash
# If you have the zip file
unzip business-dashboard-backend.zip
cd business-dashboard-backend
```

### Step 2: Install Dependencies
```bash
npm install
```

### Step 3: Configure Environment
```bash
# Copy the example environment file
cp .env.example .env

# Edit the .env file with your settings
nano .env  # or use any text editor
```

### Step 4: Initialize Database
```bash
npm run init-db
```

### Step 5: Create Admin User
```bash
npm run create-admin
```
Follow the prompts to create your first admin account.

### Step 6: Start the Server
```bash
# Development mode (with auto-restart)
npm run dev

# Production mode
npm start
```

### Step 7: Access the Dashboard
- Open browser to: `http://localhost:3000`
- You'll be redirected to the login page
- Login with the admin credentials you created

---

## ☁️ Cloud Deployment Options

### Option 1: Railway (Recommended for Beginners)

**Free tier available**

1. **Create Railway Account**
   - Go to [railway.app](https://railway.app)
   - Sign up with GitHub or email

2. **Create New Project**
   - Click "New Project"
   - Select "Deploy from GitHub repo" or "Empty Project"

3. **Upload Your Code**
   ```bash
   # Initialize git repository
   git init
   git add .
   git commit -m "Initial commit"
   
   # Create GitHub repository and push
   git remote add origin https://github.com/YOUR_USERNAME/business-dashboard.git
   git push -u origin main
   ```

4. **Configure Environment Variables**
   - In Railway dashboard, go to Variables
   - Add all variables from `.env.example`
   - **Important:** Change `JWT_SECRET` to a secure random string
   - Set `NODE_ENV=production`

5. **Deploy**
   - Railway will automatically deploy when you push to GitHub
   - Or click "Deploy" button

6. **Set Up Domain**
   - Click on your service
   - Go to Settings → Domains
   - Click "Generate Domain" or add custom domain

### Option 2: Render

**Free tier available**

1. **Create Render Account**
   - Go to [render.com](https://render.com)
   - Sign up with GitHub

2. **Create New Web Service**
   - Click "New +" → "Web Service"
   - Connect your GitHub repository

3. **Configure Service**
   - Name: `business-dashboard`
   - Runtime: `Node`
   - Build Command: `npm install && npm run init-db`
   - Start Command: `npm start`

4. **Add Environment Variables**
   - Click "Advanced" → "Add Environment Variable"
   - Add all variables from `.env`

5. **Deploy**
   - Click "Create Web Service"
   - Render will build and deploy automatically

### Option 3: Heroku

**Free tier discontinued, paid plans available**

1. **Install Heroku CLI**
   ```bash
   # Mac
   brew tap heroku/brew && brew install heroku
   
   # Windows
   # Download from https://devcenter.heroku.com/articles/heroku-cli
   ```

2. **Login and Create App**
   ```bash
   heroku login
   heroku create your-dashboard-name
   ```

3. **Add PostgreSQL (Optional)**
   ```bash
   heroku addons:create heroku-postgresql:mini
   ```

4. **Set Environment Variables**
   ```bash
   heroku config:set NODE_ENV=production
   heroku config:set JWT_SECRET=your-secure-secret-key
   # Add other variables...
   ```

5. **Deploy**
   ```bash
   git push heroku main
   ```

### Option 4: DigitalOcean App Platform

**Free tier for static sites, paid for dynamic**

1. **Create DigitalOcean Account**
   - Go to [digitalocean.com](https://digitalocean.com)
   - Sign up and add payment method

2. **Create App**
   - Go to Apps → Create App
   - Choose GitHub as source
   - Select your repository

3. **Configure**
   - Type: Web Service
   - Build Command: `npm install`
   - Run Command: `npm start`

4. **Add Environment Variables**
   - Click "Edit" on your component
   - Add all environment variables

5. **Launch**
   - Review and launch
   - DigitalOcean will provide a URL

### Option 5: VPS (DigitalOcean Droplet, Linode, AWS EC2)

**Full control, requires Linux knowledge**

1. **Create VPS**
   - Choose provider (DigitalOcean, Linode, AWS, etc.)
   - Create a new server (Ubuntu 22.04 recommended)
   - Minimum specs: 1GB RAM, 1 CPU

2. **Connect to Server**
   ```bash
   ssh root@your-server-ip
   ```

3. **Install Node.js**
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
   sudo apt-get install -y nodejs
   ```

4. **Install PM2**
   ```bash
   sudo npm install -g pm2
   ```

5. **Upload Your Code**
   ```bash
   # On your local machine
   scp -r business-dashboard-backend root@your-server-ip:/opt/
   ```

6. **Setup Application**
   ```bash
   cd /opt/business-dashboard-backend
   npm install
   npm run init-db
   npm run create-admin
   ```

7. **Create Environment File**
   ```bash
   nano .env
   # Add all your environment variables
   ```

8. **Start with PM2**
   ```bash
   pm2 start server.js --name "dashboard"
   pm2 startup
   pm2 save
   ```

9. **Install Nginx (Reverse Proxy)**
   ```bash
   sudo apt install nginx
   ```

10. **Configure Nginx**
    ```bash
    sudo nano /etc/nginx/sites-available/dashboard
    ```
    
    Add this configuration:
    ```nginx
    server {
        listen 80;
        server_name your-domain.com;

        location / {
            proxy_pass http://localhost:3000;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_cache_bypass $http_upgrade;
        }
    }
    ```

11. **Enable Site**
    ```bash
    sudo ln -s /etc/nginx/sites-available/dashboard /etc/nginx/sites-enabled/
    sudo nginx -t
    sudo systemctl restart nginx
    ```

---

## 🔒 HTTPS Configuration

### Option 1: Let's Encrypt (Recommended for Production)

1. **Install Certbot**
   ```bash
   sudo apt install certbot python3-certbot-nginx
   ```

2. **Obtain Certificate**
   ```bash
   sudo certbot --nginx -d your-domain.com
   ```

3. **Auto-Renewal**
   Certbot automatically sets up renewal. Test with:
   ```bash
   sudo certbot renew --dry-run
   ```

### Option 2: Self-Signed Certificate (Development Only)

```bash
# Generate certificates
npm run generate-ssl

# Enable HTTPS in .env
ENABLE_HTTPS=true

# Restart server
npm start
```

---

## 🔐 Production Security Checklist

### Before Deploying to Production:

- [ ] **Change JWT_SECRET**
  ```bash
  # Generate secure secret
  openssl rand -base64 64
  ```

- [ ] **Set NODE_ENV=production**

- [ ] **Disable Registration**
  ```
  ENABLE_REGISTRATION=false
  ```

- [ ] **Enable HTTPS**
  - Use Let's Encrypt for free SSL
  - Or purchase SSL certificate

- [ ] **Set Strong CORS Policy**
  ```
  CORS_ORIGIN=https://yourdomain.com
  ```

- [ ] **Configure Rate Limiting**
  ```
  RATE_LIMIT_MAX=100
  AUTH_RATE_LIMIT_MAX=5
  ```

- [ ] **Enable Request Logging**
  ```
  LOG_LEVEL=info
  ENABLE_REQUEST_LOGGING=true
  ```

- [ ] **Database Backups**
  - Set up automated backups
  - Store backups offsite

- [ ] **Server Security**
  - Enable firewall (UFW)
  - Disable password login (use SSH keys)
  - Keep system updated

### Firewall Configuration (UFW)
```bash
# Allow SSH
sudo ufw allow 22

# Allow HTTP
sudo ufw allow 80

# Allow HTTPS
sudo ufw allow 443

# Enable firewall
sudo ufw enable
```

---

## 🐳 Docker Deployment (Optional)

### Dockerfile
```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

RUN npm run init-db

EXPOSE 3000

CMD ["npm", "start"]
```

### docker-compose.yml
```yaml
version: '3.8'

services:
  dashboard:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - JWT_SECRET=${JWT_SECRET}
    volumes:
      - ./data:/app/data
    restart: unless-stopped
```

### Build and Run
```bash
docker-compose up -d
```

---

## 📊 Monitoring & Maintenance

### PM2 Monitoring
```bash
# View dashboard
pm2 monit

# View logs
pm2 logs dashboard

# Restart app
pm2 restart dashboard

# Update app
pm2 reload dashboard
```

### Log Rotation
```bash
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 100M
pm2 set pm2-logrotate:retain 10
```

### Database Backup Script
```bash
#!/bin/bash
# backup.sh

BACKUP_DIR="/backups"
DATE=$(date +%Y%m%d_%H%M%S)
DB_FILE="/opt/business-dashboard-backend/database.sqlite"

# Create backup
cp "$DB_FILE" "$BACKUP_DIR/dashboard_backup_$DATE.sqlite"

# Keep only last 7 backups
ls -t "$BACKUP_DIR"/dashboard_backup_*.sqlite | tail -n +8 | xargs rm -f

echo "Backup completed: dashboard_backup_$DATE.sqlite"
```

Add to crontab:
```bash
# Daily backup at 2 AM
0 2 * * * /opt/business-dashboard-backend/backup.sh
```

---

## 🚨 Troubleshooting

### Issue: App won't start
```bash
# Check logs
pm2 logs

# Check Node version
node --version

# Reinstall dependencies
rm -rf node_modules
npm install
```

### Issue: Database errors
```bash
# Reset database (WARNING: loses all data)
rm database.sqlite
npm run init-db
npm run create-admin
```

### Issue: Port already in use
```bash
# Find process
sudo lsof -i :3000

# Kill process
sudo kill -9 <PID>

# Or use different port
PORT=3001 npm start
```

### Issue: SSL certificate errors
```bash
# Check certificate
openssl x509 -in ssl/cert.pem -text -noout

# Regenerate
npm run generate-ssl
```

### Issue: CORS errors
- Check `CORS_ORIGIN` in .env
- For development, use `CORS_ORIGIN=*`
- For production, use your exact domain

---

## 📞 Support

If you encounter issues:
1. Check the logs: `pm2 logs` or `npm start`
2. Verify environment variables
3. Check firewall settings
4. Review this guide for your deployment method

---

**Happy Deploying! 🚀**