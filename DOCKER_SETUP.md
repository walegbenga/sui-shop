# 🐳 Docker Setup Guide - Test Sui Shop Locally

Complete guide to run Sui Shop on your local machine using Docker.

---

## 📋 Prerequisites

### **Required:**
- ✅ Docker Desktop installed (you have this!)
- ✅ Docker Compose (included with Docker Desktop)
- ✅ 4GB RAM available
- ✅ 2GB disk space

### **Optional (for full testing):**
- Node.js 18+ (for mobile testing)
- Xcode (for iOS simulator)
- Android Studio (for Android emulator)

---

## 🚀 Quick Start (5 Minutes)

### **Step 1: Extract the Project**

```bash
# Extract the downloaded zip
unzip sui-shop-complete.zip
cd sui-commerce
```

### **Step 2: Set Up Environment Variables**

```bash
# Backend environment
cd backend
cp .env.example .env

# Edit .env (optional for basic testing)
# The docker-compose.yml has defaults that work locally
```

**For basic testing, you can skip editing .env!** Docker Compose has working defaults.

### **Step 3: Start Everything with Docker**

```bash
# From the sui-commerce root directory
docker-compose up --build
```

**What happens:**
```
Building backend... ✓
Building frontend... ✓
Starting containers...
Backend running on http://localhost:3001 ✓
Frontend running on http://localhost:3000 ✓
```

### **Step 4: Open Your Browser**

```
http://localhost:3000
```

**You should see:** Sui Shop landing page! 🎉

---

## 🎯 What You Can Test

### **✅ Features That Work Immediately:**

**1. UI/UX:**
- ✅ Landing page
- ✅ Beautiful design
- ✅ Responsive layout
- ✅ Button interactions

**2. Wallet Extension:**
- ✅ Install Sui Wallet extension
- ✅ Connect wallet
- ✅ View marketplace (mockup)

**3. Backend API:**
- ✅ Health check: http://localhost:3001/health
- ✅ API endpoints responding

### **⚠️ Features That Need Configuration:**

**1. Social Login (Google):**
- ❌ Needs Google Client ID
- 📝 See "Configure Google OAuth" below

**2. Email Magic Link:**
- ❌ Needs SMTP setup
- 📝 See "Configure Email" below

**3. Smart Contracts:**
- ❌ Needs Sui testnet deployment
- 📝 See "Deploy Contracts" below

---

## 📊 Testing Scenarios

### **Scenario 1: Just Look Around (No Config Needed)**

**What works:**
```bash
# Start Docker
docker-compose up

# Open browser
http://localhost:3000

✅ See landing page
✅ Click buttons (UI works)
✅ Responsive design
✅ Navigation
```

**Time needed:** 2 minutes

---

### **Scenario 2: Test With Wallet Extension (5 Minutes)**

**Steps:**

1. **Install Sui Wallet Extension:**
   - Chrome: https://chrome.google.com/webstore
   - Search "Sui Wallet"
   - Click "Add to Chrome"

2. **Create Test Wallet:**
   - Open extension
   - Click "Create New Wallet"
   - Save seed phrase
   - Set password

3. **Get Test Tokens:**
   - Go to: https://faucet.testnet.sui.io
   - Enter your address
   - Click "Request SUI"
   - Wait 10 seconds

4. **Connect to Sui Shop:**
   - Go to http://localhost:3000
   - Click "Connect Wallet Extension"
   - Approve in extension
   - ✅ Connected!

**What you can test:**
- ✅ Wallet connection
- ✅ Address display
- ✅ Balance checking
- ⚠️ Marketplace UI (contracts not deployed yet)

---

### **Scenario 3: Test Social Login (15 Minutes)**

**Setup Google OAuth:**

1. **Go to Google Cloud Console:**
   https://console.cloud.google.com

2. **Create Project:**
   - Click "Select a project" → "New Project"
   - Name: "Sui Shop Test"
   - Click "Create"

3. **Enable Google+ API:**
   - Go to "APIs & Services" → "Library"
   - Search "Google+ API"
   - Click "Enable"

4. **Create OAuth Client:**
   - Go to "APIs & Services" → "Credentials"
   - Click "Create Credentials" → "OAuth client ID"
   - Application type: "Web application"
   - Name: "Sui Shop Local"
   - Authorized JavaScript origins:
     - Add: `http://localhost:3000`
   - Click "Create"

5. **Copy Client ID:**
   - Copy the Client ID
   - It looks like: `123456789-abc.apps.googleusercontent.com`

6. **Update Docker Config:**
   ```bash
   # Edit docker-compose.yml
   nano docker-compose.yml
   
   # Find this line:
   - GOOGLE_CLIENT_ID=your-google-client-id
   
   # Replace with your actual Client ID:
   - GOOGLE_CLIENT_ID=123456789-abc.apps.googleusercontent.com
   
   # Save and exit (Ctrl+X, Y, Enter)
   ```

7. **Restart Docker:**
   ```bash
   docker-compose down
   docker-compose up
   ```

8. **Test It:**
   ```
   http://localhost:3000
   → Click "Sign Up with Email or Google"
   → Click "Continue with Google"
   → Sign in with your Google account
   → ✅ Should create wallet!
   ```

---

### **Scenario 4: Test Email Magic Link (20 Minutes)**

**Setup Mailtrap (Free Email Testing):**

1. **Create Mailtrap Account:**
   - Go to: https://mailtrap.io
   - Sign up (free)

2. **Get SMTP Credentials:**
   - Go to "Email Testing" → "Inboxes"
   - Click "Show Credentials"
   - Copy: Host, Port, Username, Password

3. **Update Docker Config:**
   ```bash
   nano docker-compose.yml
   
   # Update these lines:
   - SMTP_HOST=smtp.mailtrap.io
   - SMTP_PORT=2525
   - SMTP_USER=your-mailtrap-username
   - SMTP_PASS=your-mailtrap-password
   ```

4. **Restart Docker:**
   ```bash
   docker-compose down
   docker-compose up
   ```

5. **Test It:**
   ```
   http://localhost:3000
   → Click "Sign Up with Email or Google"
   → Click "Continue with Email"
   → Enter your email
   → Click "Send Magic Link"
   → Check Mailtrap inbox
   → Click the link
   → ✅ Should create wallet!
   ```

---

## 🔧 Useful Docker Commands

### **Basic Commands:**

```bash
# Start everything
docker-compose up

# Start in background (detached)
docker-compose up -d

# Stop everything
docker-compose down

# View logs
docker-compose logs

# View specific service logs
docker-compose logs backend
docker-compose logs frontend

# Rebuild containers
docker-compose up --build

# Restart a service
docker-compose restart backend

# Remove everything (fresh start)
docker-compose down -v
docker-compose up --build
```

### **Check Status:**

```bash
# See running containers
docker ps

# See all containers
docker ps -a

# Check resource usage
docker stats
```

### **Access Container Shell:**

```bash
# Enter backend container
docker exec -it sui-shop-backend sh

# Enter frontend container
docker exec -it sui-shop-frontend sh

# Check files inside
ls -la

# Exit container
exit
```

---

## 🐛 Troubleshooting

### **Problem: Containers won't start**

```bash
# Check logs
docker-compose logs

# Common issues:
# 1. Port already in use (3000 or 3001)
# 2. Not enough memory
# 3. Node modules issue

# Solution:
docker-compose down
docker-compose up --build
```

### **Problem: Port 3000 already in use**

```bash
# Find what's using port 3000
# Mac/Linux:
lsof -i :3000

# Windows:
netstat -ano | findstr :3000

# Kill the process or change port in docker-compose.yml
```

### **Problem: Changes not showing**

```bash
# Rebuild containers
docker-compose down
docker-compose up --build

# Clear browser cache
# Or use incognito mode
```

### **Problem: Cannot connect to backend**

```bash
# Check backend is running
docker ps

# Check backend logs
docker-compose logs backend

# Check health endpoint
curl http://localhost:3001/health

# Should return: {"status":"healthy"}
```

### **Problem: Google login not working**

**Check:**
1. ✅ Google Client ID correct?
2. ✅ http://localhost:3000 in authorized origins?
3. ✅ Containers restarted after changes?

```bash
# Check environment variable is set
docker exec sui-shop-backend env | grep GOOGLE

# Should show your Client ID
```

---

## 📱 Testing Mobile Apps

Mobile apps don't run in Docker. Test separately:

### **iOS (Mac only):**

```bash
cd mobile
npm install

# Start backend first (Docker)
docker-compose up -d

# Then run iOS
npm run ios
```

### **Android:**

```bash
cd mobile
npm install

# Start backend first (Docker)
docker-compose up -d

# Then run Android
npm run android
```

**Note:** Mobile needs the backend running!

---

## 🎯 Complete Testing Checklist

### **Basic Testing (5 minutes):**
- [ ] Docker containers start
- [ ] Frontend loads (http://localhost:3000)
- [ ] Backend responds (http://localhost:3001/health)
- [ ] UI looks good
- [ ] Buttons work

### **Wallet Testing (10 minutes):**
- [ ] Install Sui Wallet extension
- [ ] Create test wallet
- [ ] Get test SUI tokens
- [ ] Connect wallet to app
- [ ] Wallet address displays

### **Social Login Testing (20 minutes):**
- [ ] Configure Google OAuth
- [ ] Test Google sign-in
- [ ] Wallet created automatically
- [ ] Address displayed

### **Email Testing (20 minutes):**
- [ ] Configure Mailtrap
- [ ] Send magic link
- [ ] Receive email
- [ ] Click link
- [ ] Wallet created

### **Mobile Testing (30 minutes):**
- [ ] Backend running in Docker
- [ ] Mobile dependencies installed
- [ ] iOS simulator works
- [ ] Android emulator works
- [ ] Social login works on mobile

---

## 🎨 Customization

### **Change Ports:**

Edit `docker-compose.yml`:

```yaml
services:
  backend:
    ports:
      - "4001:3001"  # Change left number (host port)
  
  frontend:
    ports:
      - "4000:3000"  # Change left number (host port)
```

Then access:
- Frontend: http://localhost:4000
- Backend: http://localhost:4001

### **Add Database:**

Add to `docker-compose.yml`:

```yaml
services:
  postgres:
    image: postgres:15-alpine
    container_name: sui-shop-db
    environment:
      POSTGRES_USER: suishop
      POSTGRES_PASSWORD: password
      POSTGRES_DB: suishop
    ports:
      - "5432:5432"
    volumes:
      - postgres-data:/var/lib/postgresql/data
    networks:
      - sui-shop-network

volumes:
  postgres-data:
```

### **Add Redis Cache:**

Add to `docker-compose.yml`:

```yaml
services:
  redis:
    image: redis:7-alpine
    container_name: sui-shop-redis
    ports:
      - "6379:6379"
    networks:
      - sui-shop-network
```

---

## 📊 Performance

**Resources Used:**
- Backend: ~100MB RAM
- Frontend: ~200MB RAM
- Total: ~300MB RAM

**Build Time:**
- First build: 3-5 minutes
- Rebuild: 30-60 seconds
- Start up: 10-20 seconds

**Disk Space:**
- Images: ~500MB
- Containers: ~100MB
- Total: ~600MB

---

## ✅ Success Criteria

**You know it's working when:**

1. ✅ Both containers running: `docker ps`
2. ✅ Frontend loads: http://localhost:3000
3. ✅ Backend responds: http://localhost:3001/health
4. ✅ No errors in logs: `docker-compose logs`
5. ✅ Can click around UI
6. ✅ (Optional) Social login works
7. ✅ (Optional) Wallet extension connects

---

## 🚀 Next Steps

**After local testing:**

1. **Deploy Backend:**
   - Heroku, Railway, or DigitalOcean
   - See: `/backend/README.md`

2. **Deploy Frontend:**
   - Vercel or Netlify
   - See: `/frontend/README.md`

3. **Deploy Smart Contracts:**
   - Sui testnet then mainnet
   - See: `/docs/DEPLOYMENT.md`

4. **Submit Mobile Apps:**
   - App Store & Play Store
   - See: `/mobile/README.md`

---

## 💡 Tips

**Development Mode:**
```bash
# Better for development (hot reload)
cd backend
npm run dev

cd frontend
npm run dev

# Better than Docker for active development
```

**Production Mode:**
```bash
# Docker is great for:
- Testing final build
- Demonstrating to others
- Deployment rehearsal
- Consistent environment
```

**Quick Demo:**
```bash
# Want to show someone?
docker-compose up -d
# Send them: http://your-ip:3000
# They can see it on your network!
```

---

## 📚 Resources

**Docker:**
- Docs: https://docs.docker.com
- Compose: https://docs.docker.com/compose/

**Sui Shop:**
- Backend: `backend/README.md`
- Frontend: `frontend/WEB_SOCIAL_LOGIN_GUIDE.md`
- Mobile: `mobile/README.md`

---

## ✅ Summary

**To test locally with Docker:**

```bash
# 1. Extract project
unzip sui-shop-complete.zip
cd sui-commerce

# 2. Start Docker
docker-compose up

# 3. Open browser
http://localhost:3000

# That's it! 🎉
```

**For full testing (optional):**
- Configure Google OAuth (15 min)
- Configure email (20 min)
- Test mobile apps (30 min)

**Total time:** 5 minutes basic, 1 hour full testing

---

**Happy testing!** 🐳🚀
