# 🚀 Quick Commands Cheat Sheet

Keep this handy! These are the most common commands you'll use.

---

## 📂 Navigate to Your Project

```bash
# Windows
cd Desktop\business-dashboard-backend

# Mac/Linux
cd ~/Desktop/business-dashboard-backend
```

---

## ⚡ Most Used Commands

| Command | What It Does | When to Use |
|---------|--------------|-------------|
| `npm install` | Install dependencies | First time setup, or after updating code |
| `npm run init-db` | Create database | First time setup, or if database is corrupted |
| `npm run create-admin` | Create admin user | First time setup, or to add more admins |
| `npm run dev` | Start development server | Every time you want to work on your website |
| `npm start` | Start production server | For production use (slower to start, faster to run) |

---

## 🔄 Daily Workflow

### Starting Your Website (Local)
```bash
cd Desktop/business-dashboard-backend
npm run dev
```
Then open: http://localhost:3000

### Stopping Your Website
Press `Ctrl + C` in the command line window

### Restarting Your Website
```bash
# Stop first (Ctrl + C), then:
npm run dev
```

---

## 📤 Deploy Updates (GitHub → Railway/Render)

```bash
# After making changes to your code:
git add .
git commit -m "Description of changes"
git push
```

Railway/Render will automatically redeploy!

---

## 🛠️ Troubleshooting Commands

| Problem | Command |
|---------|---------|
| "Cannot find module" | `npm install` |
| "Port already in use" | `lsof -ti:3000 \| xargs kill -9` (Mac/Linux) or restart computer |
| Database locked/corrupted | `rm database.sqlite && npm run init-db && npm run create-admin` |
| Need fresh start | Delete folder, re-extract ZIP, run `npm install` |

---

## 🌐 Access Your Website

| Location | URL |
|----------|-----|
| Local (your computer) | http://localhost:3000 |
| Railway (online) | https://your-app-name.up.railway.app |
| Render (online) | https://your-app-name.onrender.com |

---

## 📋 Checklist: First Time Setup

Copy this and check off as you go:

```
☐ Install Node.js from nodejs.org
☐ Extract business-dashboard-backend folder
☐ Open command line
☐ Navigate to project folder
☐ Run: npm install
☐ Run: npm run init-db
☐ Run: npm run create-admin
☐ Run: npm run dev
☐ Open http://localhost:3000 in browser
☐ Login with your admin account
☐ Create GitHub account
☐ Install Git
☐ Push code to GitHub
☐ Deploy to Railway or Render
☐ Add environment variables
☐ Create admin account on live site
☐ Test live website URL
```

---

## 🆘 Emergency Reset

If everything breaks, start fresh:

```bash
# 1. Stop the server (Ctrl + C)

# 2. Delete database
rm database.sqlite

# 3. Delete node_modules (optional but recommended)
rm -rf node_modules

# 4. Reinstall
npm install

# 5. Reinitialize
npm run init-db

# 6. Recreate admin
npm run create-admin

# 7. Start again
npm run dev
```

---

## 💡 Pro Tips

1. **Keep the command line window open** - Closing it stops your website
2. **Use Up arrow** in command line to repeat previous commands
3. **Tab key** auto-completes file/folder names
4. **Ctrl + C** stops running processes
5. **Copy/Paste** in command line: Right-click (Windows) or Cmd+V (Mac)

---

**Save this file and keep it handy!** 📌