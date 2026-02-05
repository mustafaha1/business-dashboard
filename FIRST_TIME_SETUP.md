# 🌟 First-Time Setup Guide - Your First Website!

Welcome! This guide will walk you through installing and deploying your Business Dashboard step by step. Don't worry - I'll explain everything in simple terms!

---

## 📚 What You'll Learn

1. **Install Node.js** - The engine that runs your website
2. **Set up your dashboard** - Get it running on your computer
3. **Deploy online** - Make it accessible from anywhere
4. **Troubleshoot** - Fix common problems

---

## Part 1: Install Node.js (The Website Engine)

### What is Node.js?
Think of Node.js as the engine that powers your website. Just like a car needs an engine to run, your website needs Node.js to work.

### Step 1.1: Download Node.js

**For Windows:**
1. Open your web browser
2. Go to: https://nodejs.org/
3. Click the big green button that says **"LTS"** (Long Term Support)
4. Download the installer
5. Run the downloaded file
6. Click "Next" through the installation (accept all defaults)
7. When done, click "Finish"

**For Mac:**
1. Open your web browser
2. Go to: https://nodejs.org/
3. Click the big green button that says **"LTS"**
4. Download the .pkg file
5. Double-click the downloaded file
6. Follow the installation wizard
7. Enter your Mac password when asked

**For Linux (Ubuntu/Debian):**
1. Open Terminal (Ctrl+Alt+T)
2. Copy and paste these commands one by one:
```bash
curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
sudo apt-get install -y nodejs
```

### Step 1.2: Verify Installation

**For Windows:**
1. Press `Windows key + R`
2. Type `cmd` and press Enter
3. In the black window, type:
```
node --version
```
4. Press Enter
5. You should see something like: `v18.17.0`
6. Now type:
```
npm --version
```
7. You should see something like: `9.6.7`

**For Mac:**
1. Open Terminal (press Cmd+Space, type "Terminal", press Enter)
2. Type:
```bash
node --version
```
3. Press Enter
4. You should see something like: `v18.17.0`
5. Now type:
```bash
npm --version
```
6. You should see something like: `9.6.7`

**✅ Success!** If you see version numbers, Node.js is installed correctly!

---

## Part 2: Set Up Your Dashboard on Your Computer

### Step 2.1: Find Your Downloaded Files

1. Look for the `business-dashboard-backend` folder on your Desktop
2. If it's a ZIP file, right-click it and select "Extract All" (Windows) or double-click to extract (Mac)
3. Remember where this folder is located (we'll need it!)

### Step 2.2: Open Command Line

**For Windows:**
1. Press `Windows key + R`
2. Type `cmd` and press Enter
3. A black window opens - this is your command line

**For Mac:**
1. Press `Cmd + Space`
2. Type "Terminal"
3. Press Enter
4. A window opens - this is your command line

### Step 2.3: Navigate to Your Dashboard Folder

In the command line, type this (replace the path with where your folder is):

**For Windows:**
```cmd
cd Desktop\business-dashboard-backend
```

**For Mac:**
```bash
cd ~/Desktop/business-dashboard-backend
```

**Tip:** You can also drag the folder into the command line window and it will type the path for you!

### Step 2.4: Install Dependencies

Type this command and press Enter:
```bash
npm install
```

**What this does:** Downloads all the tools your website needs to run.

**Wait time:** 2-5 minutes depending on your internet speed.

**You'll see:** Lots of text scrolling by - this is normal!

**When it's done:** You'll see something like:
```
added 245 packages in 45s
```

### Step 2.5: Initialize the Database

Type this command and press Enter:
```bash
npm run init-db
```

**What this does:** Creates the database where all your data will be stored.

**When it's done:** You'll see:
```
✅ Database initialization complete!
Database file: .../database.sqlite
Uploads directory: .../uploads/invoices
```

### Step 2.6: Create Your Admin Account

Type this command and press Enter:
```bash
npm run create-admin
```

**What this does:** Creates the first user account (you!) that can access the dashboard.

**Follow the prompts:**
```
Username (min 3 characters): admin
Email: your-email@example.com
Password: ********
Confirm Password: ********
```

**Password Requirements:**
- At least 8 characters
- One uppercase letter (A-Z)
- One lowercase letter (a-z)
- One number (0-9)
- One special character (!@#$%^&*)

**Example good password:** `MyBusiness2024!`

**When it's done:** You'll see:
```
✅ Admin user created successfully!
You can now log in at: http://localhost:3000/login
```

### Step 2.7: Start Your Website!

Type this command and press Enter:
```bash
npm run dev
```

**What this does:** Starts your website on your computer.

**You'll see:**
```
✅ Connected to SQLite database.
🚀 HTTP Server running on http://localhost:3000
🔒 Authentication: ENABLED
```

**🎉 Congratulations! Your website is now running!**

### Step 2.8: Access Your Dashboard

1. Open your web browser (Chrome, Firefox, Safari, Edge)
2. Go to: http://localhost:3000
3. You'll see the login page
4. Enter your username and password
5. Click "Sign In"
6. Welcome to your Business Dashboard!

---

## Part 3: Deploy Your Website Online (Make It Accessible From Anywhere)

Now that your website works on your computer, let's put it online so you can access it from anywhere!

### Option A: Railway (Recommended - Easiest & Free)

**Why Railway?** It's free, easy, and perfect for beginners!

#### Step A.1: Create a GitHub Account

1. Go to: https://github.com
2. Click "Sign up"
3. Enter your email
4. Create a password
5. Choose a username
6. Verify your email

#### Step A.2: Install Git

**For Windows:**
1. Go to: https://git-scm.com/download/win
2. Download the installer
3. Run it and click "Next" through all the steps

**For Mac:**
1. Open Terminal
2. Type:
```bash
git --version
```
3. If not installed, it will prompt you to install - click "Install"

#### Step A.3: Upload Your Code to GitHub

1. Open command line
2. Navigate to your dashboard folder:
```bash
cd Desktop/business-dashboard-backend
```

3. Initialize Git:
```bash
git init
```

4. Add all your files:
```bash
git add .
```

5. Commit (save) your files:
```bash
git commit -m "Initial commit"
```

6. Connect to GitHub (replace YOUR_USERNAME with your GitHub username):
```bash
git remote add origin https://github.com/YOUR_USERNAME/business-dashboard.git
```

7. Push your code:
```bash
git push -u origin main
```

8. Enter your GitHub username and password when asked

**✅ Your code is now on GitHub!**

#### Step A.4: Deploy to Railway

1. Go to: https://railway.app
2. Click "Login" and sign in with GitHub
3. Click "New Project"
4. Click "Deploy from GitHub repo"
5. Select your `business-dashboard` repository
6. Railway will automatically deploy your website!

#### Step A.5: Add Environment Variables

1. In Railway, click on your project
2. Click "Variables" tab
3. Add these variables one by one:

| Name | Value |
|------|-------|
| `NODE_ENV` | `production` |
| `JWT_SECRET` | (Generate a random string below) |
| `PORT` | `3000` |

**To generate JWT_SECRET:**
1. Go to: https://www.random.org/strings/
2. Generate a 64-character string
3. Copy and paste it as the value

4. Click "Add" for each variable

#### Step A.6: Get Your Website URL

1. In Railway, click "Settings" tab
2. Click "Generate Domain"
3. Railway will give you a URL like: `https://business-dashboard-production.up.railway.app`
4. **This is your live website URL!**

#### Step A.7: Create Admin Account on Live Site

1. In Railway, click "Deployments" tab
2. Click on the latest deployment
3. Click "View Logs"
4. Wait for "Server running" message
5. Click the URL from Step A.6
6. You'll see an error - that's normal!
7. In Railway, click "Shell" tab
8. Type:
```bash
npm run create-admin
```
9. Follow the prompts to create your admin account
10. Now visit your URL and login!

**🎉 Your website is now live on the internet!**

---

### Option B: Render (Also Free & Easy)

#### Step B.1: Push Code to GitHub

Follow Steps A.1, A.2, and A.3 from above.

#### Step B.2: Create Render Account

1. Go to: https://render.com
2. Click "Get Started for Free"
3. Sign up with GitHub

#### Step B.3: Create Web Service

1. Click "New +" button
2. Select "Web Service"
3. Connect your GitHub repository
4. Configure:
   - **Name:** `business-dashboard`
   - **Runtime:** `Node`
   - **Build Command:** `npm install && npm run init-db`
   - **Start Command:** `npm start`

5. Click "Create Web Service"

#### Step B.4: Add Environment Variables

1. Click "Environment" tab
2. Add:
   - `NODE_ENV` = `production`
   - `JWT_SECRET` = (random 64-character string)

3. Click "Save Changes"

#### Step B.5: Deploy

1. Render will automatically build and deploy
2. Wait for the build to complete (5-10 minutes)
3. Click the URL at the top
4. Your website is live!

#### Step B.6: Create Admin Account

1. In Render, click "Shell" tab
2. Type: `npm run create-admin`
3. Follow prompts
4. Login to your live site!

---

## Part 4: Important Things to Know

### Keeping Your Website Running

**On Railway/Render:**
- Your website runs 24/7 automatically
- Free tier may sleep after inactivity (wakes up on next visit)
- Upgrade to paid plan for always-on

**On Your Computer:**
- Website only runs when your computer is on
- Command line window must stay open
- Close window = website stops

### Updating Your Website

**If you make changes:**
1. Save your changes
2. In command line:
```bash
git add .
git commit -m "My changes"
git push
```
3. Railway/Render will automatically redeploy!

### Backing Up Your Data

**Your database file is:** `database.sqlite`

**To backup:**
1. Copy the file to another location
2. Or use automated backup tools

### Security Tips

1. **Never share your JWT_SECRET**
2. **Use strong passwords**
3. **Keep Node.js updated**
4. **Regularly backup your database**

---

## Part 5: Troubleshooting

### Problem: "node is not recognized"
**Solution:** Node.js isn't installed properly. Reinstall from nodejs.org

### Problem: "Cannot find module"
**Solution:** Run `npm install` again

### Problem: "Port 3000 already in use"
**Solution:** 
```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID [number] /F

# Or use different port
PORT=3001 npm start
```

### Problem: "Database is locked"
**Solution:**
```bash
rm database.sqlite
npm run init-db
npm run create-admin
```

### Problem: Can't login
**Solution:** Clear browser cache and try again

### Problem: Website not loading online
**Solution:**
1. Check Railway/Render logs for errors
2. Verify environment variables are set
3. Make sure admin account was created

---

## 🎯 Quick Reference Commands

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

# Install dependencies
npm install
```

---

## 📞 Need More Help?

1. **Check the logs** - They tell you what's wrong
2. **Google the error** - Someone else probably had the same issue
3. **Ask for help** - Stack Overflow, Reddit, or GitHub issues

---

## ✅ Setup Checklist

- [ ] Node.js installed
- [ ] Dependencies installed (`npm install`)
- [ ] Database initialized (`npm run init-db`)
- [ ] Admin account created (`npm run create-admin`)
- [ ] Website running locally (`npm run dev`)
- [ ] Can login at http://localhost:3000
- [ ] Code pushed to GitHub
- [ ] Deployed to Railway/Render
- [ ] Environment variables set
- [ ] Admin account created on live site
- [ ] Can access live website URL

---

**🎉 Congratulations on building and deploying your first website!**

You're now a website owner! 🚀