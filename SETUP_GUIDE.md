# 📋 Complete Setup Guide

This guide will walk you through setting up your Business Dashboard Backend step by step.

## 🎯 What This Backend Does

This backend replaces your browser's local storage with a proper database that:
- ✅ Saves all your business data permanently
- ✅ Allows multiple users to access the same data
- ✅ Provides a professional API for your dashboard
- ✅ Handles staff clock-in/out automatically
- ✅ Calculates profits and partner shares
- ✅ Generates reports and account statements

## 🚀 Quick Start (5 Minutes)

### Step 1: Install Node.js

**Windows:**
1. Go to https://nodejs.org/
2. Download the LTS version (recommended for most users)
3. Run the installer and follow the prompts
4. Restart your computer

**Mac:**
1. Open Terminal
2. Install Homebrew (if not already installed):
   ```bash
   /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
   ```
3. Install Node.js:
   ```bash
   brew install node
   ```

**Linux (Ubuntu/Debian):**
```bash
curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
sudo apt-get install -y nodejs
```

### Step 2: Verify Installation

Open a terminal/command prompt and run:

```bash
node --version
npm --version
```

You should see version numbers (e.g., v18.17.0 and 9.6.7)

### Step 3: Navigate to Backend Folder

Open a terminal and navigate to the backend folder:

```bash
cd path/to/business-dashboard-backend
```

Replace `path/to/` with the actual path where you extracted the files.

### Step 4: Install Dependencies

Run this command:

```bash
npm install
```

This will download and install all the required packages. It may take a few minutes.

You should see a `node_modules` folder created and a `package-lock.json` file.

### Step 5: Initialize Database

Run this command:

```bash
npm run init-db
```

This will:
- Create a database file called `database.sqlite`
- Create all the tables needed
- Add sample data (John, Sarah, Mike, Emma as staff members)

You should see success messages like:
- ✅ staff_members table created
- ✅ suppliers table created
- ✅ Sample staff members inserted

### Step 6: Start the Server

For development (recommended):
```bash
npm run dev
```

For production:
```bash
npm start
```

You should see:
```
🚀 Server running on http://localhost:3000
📁 Database: /path/to/database.sqlite
```

### Step 7: Test Your Backend

1. Open your web browser
2. Go to: http://localhost:3000
3. You should see your dashboard!

## 🧪 Testing Everything Works

### Test 1: View Dashboard
- Open http://localhost:3000
- You should see the Business Summary Dashboard
- The page should load without errors

### Test 2: Add Staff
1. Scroll to "Staff Management"
2. Enter a name like "Alice"
3. Click "Add Staff"
4. The staff member should appear in the list

### Test 3: Add Sales Data
1. Set your date range (e.g., this week)
2. Click "Generate Report"
3. Enter some sales numbers for a day
4. Click "Save" next to that day
5. You should see a success message

### Test 4: Clock In/Out
1. Go to "Staff Time Clock"
2. Select a staff member
3. Enter an hourly rate (e.g., 15.50)
4. Click "Clock In"
5. The staff should appear in "Active Clock Sessions"
6. Click "Clock Out" - the session should end

### Test 5: Generate Report
1. Set a date range that includes days with data
2. Click "Generate Report"
3. You should see tables populated with your data

## 📁 Understanding Your Files

After setup, you'll have:

```
business-dashboard-backend/
├── database.sqlite          # Your database (created after init)
├── server.js               # The server that runs everything
├── init-db.js              # Database setup script
├── package.json            # Project configuration
├── node_modules/           # Dependencies (created after npm install)
├── public/                 # Your frontend files
│   └── index.html         # The dashboard interface
└── README.md              # Full documentation
```

## 🔧 Common Issues & Solutions

### Issue: "Cannot find module" error
**Solution:**
```bash
npm install
```

### Issue: "Port 3000 is already in use"
**Solution 1:** Kill the existing process:
```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Mac/Linux
lsof -ti:3000 | xargs kill -9
```

**Solution 2:** Use a different port:
```bash
PORT=3001 npm start
```

### Issue: "Permission denied" on Mac/Linux
**Solution:**
```bash
chmod 755 .
```

### Issue: Database errors
**Solution:** Reset the database:
```bash
rm database.sqlite
npm run init-db
```

### Issue: Frontend not loading data
**Solution:** 
1. Make sure the backend is running
2. Check browser console for errors (F12)
3. Verify the API_BASE_URL in the frontend code

## 🔒 Security Notes

⚠️ **Current Setup:**
- No login required
- Anyone on your network can access
- Suitable for local/small business use

🔒 **For Internet Access:**
- Add password protection
- Use HTTPS
- Add user authentication
- Consider cloud hosting (Heroku, Railway, etc.)

## 💾 Backing Up Your Data

Your data is stored in `database.sqlite`. To backup:

### Method 1: Copy the File
```bash
# Windows
copy database.sqlite backup_2024_01_15.sqlite

# Mac/Linux
cp database.sqlite backup_2024_01_15.sqlite
```

### Method 2: Automated Backup (Advanced)
Create a backup script:

```bash
#!/bin/bash
# backup.sh
date=$(date +%Y%m%d_%H%M%S)
cp database.sqlite backups/backup_$date.sqlite
echo "Backup created: backup_$date.sqlite"
```

## 🌐 Accessing from Other Devices

### On Your Local Network:

1. Find your computer's IP address:
   ```bash
   # Windows
   ipconfig
   
   # Mac/Linux
   ifconfig
   ```
   Look for something like `192.168.1.100`

2. Start the server to listen on all interfaces:
   ```bash
   # Edit server.js and change:
   const PORT = process.env.PORT || 3000;
   
   # To:
   const PORT = process.env.PORT || 3000;
   const HOST = '0.0.0.0'; // Add this line
   
   # And change:
   app.listen(PORT, () => {
   
   # To:
   app.listen(PORT, HOST, () => {
   ```

3. Access from other devices:
   ```
   http://192.168.1.100:3000
   ```

### On the Internet (Advanced):

Options:
- **Free:** Railway.app, Render.com, Fly.io
- **Paid:** Heroku, DigitalOcean, AWS, Google Cloud

## 🔄 Updating Your Frontend

If you want to use the backend with a different frontend:

1. The API endpoints are at `/api/...`
2. All data is returned as JSON
3. See `server.js` for all available endpoints
4. Update `API_BASE_URL` in your frontend if needed

## 📊 Database Structure

You can view your data using tools like:
- **DB Browser for SQLite** (Free, GUI)
- **SQLite Studio** (Free, GUI)
- **Command line:** `sqlite3 database.sqlite`

## 🎨 Customization

### Change Colors/Styles:
Edit `public/index.html` - look for the `<style>` section

### Add New Features:
1. Add new API endpoints in `server.js`
2. Add new database tables in `init-db.js`
3. Update the frontend in `public/index.html`

### Add Authentication:
Look for "Security" section in README.md for guidance

## 🐛 Still Having Issues?

1. Check the terminal where the server is running - look for error messages
2. Open browser developer tools (F12) - check the Console tab
3. Make sure all steps were followed in order
4. Try restarting the server
5. If all else fails, delete everything and start fresh

## 📞 Getting Help

When asking for help, provide:
1. What operating system you're using (Windows/Mac/Linux)
2. What version of Node.js you have (`node --version`)
3. The exact error message you're seeing
4. What step you're stuck on

## ✅ Next Steps

Once everything is working:

1. **Test all features** - make sure everything saves correctly
2. **Import your existing data** - manually enter your current data
3. **Set up regular backups** - don't lose your data!
4. **Train your team** - show others how to use it
5. **Consider security** - add authentication if needed

## 🎉 Congratulations!

You now have a fully functional business dashboard with:
- ✅ Permanent data storage
- ✅ Professional API backend
- ✅ Multi-user capability
- ✅ Automatic calculations
- ✅ Report generation

Your data is now safe and accessible from anywhere on your network!

---

**Need more help?** Check the full README.md file for detailed documentation.