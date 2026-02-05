# 🔧 Troubleshooting Guide

Having problems? Don't worry! This guide will help you fix common issues.

---

## 🚨 Before You Start

**First, check these basics:**
- [ ] Is Node.js installed? (`node --version`)
- [ ] Are you in the correct folder? (`pwd` or `cd`)
- [ ] Did you run `npm install`?
- [ ] Is your command line window still open?

---

## Common Problems & Solutions

### ❌ "'node' is not recognized as an internal or external command"

**What this means:** Node.js is not installed or not in your system path.

**Solution:**
1. Go to https://nodejs.org/
2. Download and install the LTS version
3. **Restart your command line window** (close and reopen)
4. Try again

**Still not working?**
- Windows: Restart your computer
- Mac: Try `brew install node` (if you have Homebrew)

---

### ❌ "Cannot find module 'express'" (or any other module)

**What this means:** Dependencies are not installed.

**Solution:**
```bash
npm install
```

**Still not working?**
```bash
# Delete node_modules and reinstall
rm -rf node_modules
npm install
```

---

### ❌ "Port 3000 is already in use"

**What this means:** Another program is using port 3000.

**Quick Fix - Use Different Port:**
```bash
PORT=3001 npm run dev
```
Then access: http://localhost:3001

**Permanent Fix - Kill the Process:**

**Windows:**
```cmd
netstat -ano | findstr :3000
taskkill /PID [NUMBER] /F
```

**Mac/Linux:**
```bash
lsof -ti:3000 | xargs kill -9
```

---

### ❌ "SQLITE_BUSY: database is locked"

**What this means:** The database file is being used by another process.

**Solution:**
1. Stop the server (Ctrl + C)
2. Wait 10 seconds
3. Start again: `npm run dev`

**Still locked?**
```bash
# Reset the database (WARNING: You'll lose all data!)
rm database.sqlite
npm run init-db
npm run create-admin
```

---

### ❌ "Error: Cannot find module '../middleware/auth'"

**What this means:** Files are missing or in wrong location.

**Solution:**
1. Make sure you extracted the entire ZIP file
2. Check that `middleware/` folder exists
3. If missing, re-download and extract

---

### ❌ "Login failed" or "Invalid credentials"

**What this means:** Wrong username or password.

**Solution:**
1. Make sure Caps Lock is OFF
2. Try typing password in a text editor first to see it
3. If you forgot password, create new admin:
```bash
npm run create-admin
```

---

### ❌ "Token expired" or "Session expired"

**What this means:** Your login session timed out.

**Solution:**
1. Clear browser cache (Ctrl+Shift+Delete)
2. Refresh the page
3. Login again

---

### ❌ Website shows blank page

**What this means:** JavaScript error or loading problem.

**Solution:**
1. Open browser console (F12 or right-click → Inspect → Console)
2. Look for red error messages
3. Common fixes:
   - Clear browser cache
   - Hard refresh: Ctrl+F5
   - Try different browser

---

### ❌ "EACCES: permission denied"

**What this means:** You don't have permission to access a file/folder.

**Solution:**

**Mac/Linux:**
```bash
sudo chown -R $(whoami) .
chmod -R 755 .
```

**Windows:**
1. Right-click the folder
2. Properties → Security
3. Click "Edit" → "Add"
4. Type your username
5. Give "Full Control"

---

### ❌ "npm ERR! code ENOENT"

**What this means:** npm can't find a file it needs.

**Solution:**
1. Make sure you're in the right folder
2. Check that `package.json` exists:
```bash
ls
# or on Windows: dir
```
3. If missing, re-extract the ZIP file

---

### ❌ "Cannot GET /" or "404 Not Found"

**What this means:** The server is running but can't find the page.

**Solution:**
1. Make sure `public/index.html` exists
2. Check server logs for errors
3. Restart the server

---

### ❌ Git push fails with "fatal: Authentication failed"

**What this means:** GitHub login failed.

**Solution:**
1. GitHub no longer accepts passwords for Git operations
2. Create a Personal Access Token:
   - Go to GitHub → Settings → Developer settings → Personal access tokens
   - Click "Generate new token"
   - Select "repo" scope
   - Generate and copy the token
3. Use the token as your password when pushing

---

### ❌ Railway deployment fails

**What this means:** Something went wrong during deployment.

**Solution:**
1. Check Railway logs for specific error
2. Common fixes:
   - Make sure `package.json` has a "start" script
   - Add `NODE_ENV=production` variable
   - Add `JWT_SECRET` variable
3. Try redeploying

---

### ❌ "Module not found: Error: Can't resolve 'multer'"

**What this means:** Dependencies are outdated.

**Solution:**
```bash
npm install
```

If that doesn't work:
```bash
rm -rf node_modules package-lock.json
npm install
```

---

### ❌ File upload not working

**What this means:** Upload directory doesn't exist or no permission.

**Solution:**
```bash
# Create uploads directory
mkdir -p uploads/invoices

# Check permissions
chmod -R 755 uploads
```

---

### ❌ "Error: secretOrPrivateKey must have a value"

**What this means:** JWT_SECRET is not set.

**Solution:**
1. Create `.env` file in project root
2. Add:
```
JWT_SECRET=your-super-secret-random-string-here
```
3. Or set as environment variable

---

## 🔄 The Nuclear Option (Start Fresh)

If nothing works, start completely fresh:

```bash
# 1. Stop the server (Ctrl + C)

# 2. Go to your Desktop
cd ~/Desktop  # Mac
# or
cd Desktop    # Windows

# 3. Delete the old folder
rm -rf business-dashboard-backend  # Mac/Linux
# or
rmdir /s business-dashboard-backend  # Windows

# 4. Re-extract the ZIP file

# 5. Navigate to new folder
cd business-dashboard-backend

# 6. Start from scratch
npm install
npm run init-db
npm run create-admin
npm run dev
```

---

## 📞 Getting More Help

### 1. Check the Logs
The error message usually tells you what's wrong. Look for:
- File names
- Line numbers
- Error codes

### 2. Google the Error
Copy the error message into Google. Someone else has probably had the same problem!

### 3. Ask for Help
- Stack Overflow: https://stackoverflow.com
- Reddit r/webdev: https://reddit.com/r/webdev
- GitHub Issues: Create an issue on the project

### 4. Include This Information When Asking for Help
```
- Operating System: (Windows 10, Mac OS 13, etc.)
- Node.js version: (output of `node --version`)
- npm version: (output of `npm --version`)
- Exact error message: (copy and paste)
- What you were trying to do:
- What you've already tried:
```

---

## ✅ Quick Fixes Checklist

Try these in order:

1. [ ] Restart the server (Ctrl+C, then `npm run dev`)
2. [ ] Clear browser cache (Ctrl+Shift+Delete)
3. [ ] Hard refresh page (Ctrl+F5)
4. [ ] Run `npm install` again
5. [ ] Check you're in the right folder
6. [ ] Restart your computer
7. [ ] Delete `node_modules` and reinstall
8. [ ] Start fresh with new folder

---

## 🎯 Prevention Tips

1. **Always backup your database** before major changes
2. **Don't delete files** unless you know what they do
3. **Keep the command line window open** while developing
4. **Save files frequently** (Ctrl+S)
5. **Test locally before deploying**

---

**Remember: Every developer faces these problems. You're not alone! 🚀**