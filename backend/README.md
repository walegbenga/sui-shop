# 🚀 Sui Shop Backend API

Complete Node.js backend for Sui Shop mobile app with social login wallet creation.

---

## 📋 What This Does

This backend provides **two critical services**:

1. **Social Authentication** - Verify Google/Apple OAuth, send magic links
2. **Wallet Seed Generation** - Create deterministic Sui wallets from social logins

**Security:** All wallet seeds are generated server-side using cryptographically secure methods.

---

## 🎯 Quick Start

### Step 1: Install Dependencies

```bash
cd backend
npm install
```

### Step 2: Configure Environment

```bash
# Copy environment template
cp .env.example .env

# Edit .env with your values
nano .env
```

**Minimum required:**
```env
JWT_SECRET=your-random-secret-key
MASTER_SALT=your-random-master-salt
SENDGRID_API_KEY=your-sendgrid-key (for email)
GOOGLE_CLIENT_ID=your-google-client-id
```

### Step 3: Run Development Server

```bash
npm run dev
```

Server starts at: `http://localhost:3001`

---

## 📡 API Endpoints

### **Authentication**

**Send Magic Link (Email)**
```http
POST /api/auth/send-magic-link
Content-Type: application/json

{
  "email": "user@example.com"
}

Response:
{
  "success": true,
  "message": "Magic link sent to your email",
  "expiresIn": "15 minutes"
}
```

**Verify Magic Link**
```http
POST /api/auth/verify-magic-link
Content-Type: application/json

{
  "token": "abc123..."
}

Response:
{
  "success": true,
  "valid": true,
  "email": "user@example.com",
  "authToken": "jwt-token-here",
  "expiresIn": "24 hours"
}
```

**Verify Google OAuth**
```http
POST /api/auth/verify-google
Content-Type: application/json

{
  "idToken": "google-id-token"
}

Response:
{
  "success": true,
  "valid": true,
  "email": "user@gmail.com",
  "googleId": "123456789",
  "name": "John Doe",
  "authToken": "jwt-token-here"
}
```

**Verify Apple Sign-In**
```http
POST /api/auth/verify-apple
Content-Type: application/json

{
  "identityToken": "apple-identity-token",
  "user": { "name": "John Doe" }
}

Response:
{
  "success": true,
  "valid": true,
  "appleId": "001234.abc...",
  "email": "user@privaterelay.appleid.com",
  "authToken": "jwt-token-here"
}
```

### **Wallet Generation**

**Generate Wallet Seed**
```http
POST /api/wallet/generate-seed
Content-Type: application/json

{
  "provider": "google",
  "userIdentifier": "google:123456789",
  "authToken": "jwt-token-from-auth-endpoint"
}

Response:
{
  "success": true,
  "address": "0x1234567890abcdef...",
  "seed": "hex-encoded-seed",
  "publicKey": "base64-public-key"
}
```

**Get User Salt**
```http
POST /api/wallet/get-salt
Content-Type: application/json

{
  "userIdentifier": "user@example.com",
  "authToken": "jwt-token"
}

Response:
{
  "success": true,
  "salt": "hex-salt-value"
}
```

### **Health Check**

```http
GET /health

Response:
{
  "status": "healthy",
  "timestamp": "2024-02-07T...",
  "uptime": 12345
}
```

---

## 🔐 Security Features

### 1. **Deterministic Seed Generation**

```javascript
User Identifier + Master Salt + User Salt + Provider
    ↓ (PBKDF2 with 600,000 iterations)
Secure Seed
    ↓ (BIP44 derivation)
Sui Keypair
```

**Properties:**
- Same user = Same wallet (always)
- Different user = Different wallet (always)
- Unpredictable without secrets
- Industry-standard cryptography

### 2. **Rate Limiting**

```javascript
General API: 100 requests / 15 minutes
Auth endpoints: 5 requests / 15 minutes
Wallet creation: 10 requests / hour
```

### 3. **Input Validation**

All inputs validated with `express-validator`:
- Email format validation
- Token format validation
- Provider whitelist
- Request sanitization

### 4. **Security Headers**

Helmet.js provides:
- Content Security Policy
- X-Frame-Options
- X-Content-Type-Options
- And more...

### 5. **Audit Logging**

All sensitive operations logged:
- Wallet creation (with address, not seed)
- Auth attempts
- Failed verifications

---

## 🏗️ Project Structure

```
backend/
├── src/
│   ├── index.js                 # Main server
│   ├── routes/
│   │   ├── auth.js              # Auth endpoints
│   │   ├── wallet.js            # Wallet endpoints
│   │   └── health.js            # Health check
│   ├── services/
│   │   ├── authService.js       # OAuth & magic links
│   │   └── walletService.js     # Seed generation
│   ├── middleware/
│   │   └── errorHandler.js      # Error handling
│   └── utils/
│       └── logger.js            # Winston logger
├── config/                      # Configuration files
├── logs/                        # Log files
├── package.json
├── .env.example
└── README.md
```

---

## 🔧 Configuration

### Required Environment Variables

**Security (CRITICAL):**
```env
JWT_SECRET=<generate-random-32-bytes>
MASTER_SALT=<generate-random-32-bytes>
```

**Generate secrets:**
```bash
# JWT Secret
openssl rand -base64 32

# Master Salt
openssl rand -hex 32
```

**Email (for magic links):**
```env
SENDGRID_API_KEY=SG.your-key
EMAIL_FROM=noreply@suishop.com
```

**OAuth:**
```env
GOOGLE_CLIENT_ID=your-id.apps.googleusercontent.com
APPLE_CLIENT_ID=com.suishop.signin
```

### Optional (Recommended for Production)

**Database:**
```env
MONGODB_URI=mongodb://localhost:27017/suishop
REDIS_URL=redis://localhost:6379
```

**Frontend:**
```env
FRONTEND_URL=https://suishop.com
ALLOWED_ORIGINS=https://suishop.com,suishop://
```

---

## 🚀 Deployment

### Option 1: Heroku

```bash
# Install Heroku CLI
npm install -g heroku

# Login
heroku login

# Create app
heroku create sui-shop-backend

# Set environment variables
heroku config:set JWT_SECRET=$(openssl rand -base64 32)
heroku config:set MASTER_SALT=$(openssl rand -hex 32)
heroku config:set SENDGRID_API_KEY=your-key
heroku config:set GOOGLE_CLIENT_ID=your-id

# Deploy
git push heroku main

# Check logs
heroku logs --tail
```

### Option 2: AWS Elastic Beanstalk

```bash
# Install EB CLI
pip install awsebcli

# Initialize
eb init

# Create environment
eb create sui-shop-backend-prod

# Set environment variables
eb setenv JWT_SECRET=xxx MASTER_SALT=xxx

# Deploy
eb deploy
```

### Option 3: Google Cloud Run

```bash
# Build Docker image
docker build -t gcr.io/your-project/sui-shop-backend .

# Push to registry
docker push gcr.io/your-project/sui-shop-backend

# Deploy
gcloud run deploy sui-shop-backend \
  --image gcr.io/your-project/sui-shop-backend \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated
```

### Option 4: DigitalOcean App Platform

```bash
# Deploy via web UI or doctl
doctl apps create --spec app.yaml
```

---

## 🔒 Production Security Checklist

Before deploying to production:

**Critical:**
- [ ] Generate unique JWT_SECRET (not default)
- [ ] Generate unique MASTER_SALT (not default)
- [ ] Store MASTER_SALT in AWS KMS/Google Cloud KMS
- [ ] Enable HTTPS only
- [ ] Set NODE_ENV=production
- [ ] Configure proper ALLOWED_ORIGINS

**Recommended:**
- [ ] Set up MongoDB for persistent storage
- [ ] Set up Redis for caching/rate limiting
- [ ] Enable audit logging to external service
- [ ] Set up monitoring (Datadog, New Relic)
- [ ] Configure automated backups
- [ ] Set up error tracking (Sentry)
- [ ] Review and adjust rate limits
- [ ] Set up API key authentication (if public)

**Email:**
- [ ] Verify SendGrid domain
- [ ] Configure SPF/DKIM records
- [ ] Set up email templates
- [ ] Test email deliverability

---

## 🧪 Testing

### Run Tests

```bash
npm test
```

### Manual Testing

**Test magic link:**
```bash
curl -X POST http://localhost:3001/api/auth/send-magic-link \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'
```

**Test wallet generation:**
```bash
curl -X POST http://localhost:3001/api/wallet/generate-seed \
  -H "Content-Type: application/json" \
  -d '{
    "provider":"email",
    "userIdentifier":"test@example.com",
    "authToken":"your-jwt-token"
  }'
```

---

## 📊 Monitoring

### Health Checks

```bash
# Basic health
curl http://localhost:3001/health

# Detailed health
curl http://localhost:3001/health/detailed
```

### Logs

```bash
# Development (console)
npm run dev

# Production (files)
tail -f logs/combined.log
tail -f logs/error.log
```

---

## 🐛 Troubleshooting

### Issue: "Cannot send email"

**Solution:**
```bash
# Check SendGrid API key
echo $SENDGRID_API_KEY

# Verify email configuration
curl https://api.sendgrid.com/v3/user/account \
  -H "Authorization: Bearer $SENDGRID_API_KEY"
```

### Issue: "Google OAuth verification failed"

**Solution:**
```bash
# Verify Google Client ID
echo $GOOGLE_CLIENT_ID

# Check if it matches mobile app configuration
# Must be the same ID in:
# - Backend .env
# - Mobile app OAuth config
# - Google Cloud Console
```

### Issue: "Same user getting different wallets"

**Solution:**
```bash
# Check MASTER_SALT is consistent
# If MASTER_SALT changes, ALL wallets change!
# This is why it MUST be in environment variable

# Verify it's not regenerating
grep "Using generated MASTER_SALT" logs/combined.log
```

---

## 📈 Scaling

### Horizontal Scaling

The backend is stateless and can be scaled horizontally:

```bash
# Heroku
heroku ps:scale web=3

# Kubernetes
kubectl scale deployment sui-shop-backend --replicas=5
```

### Database

For production scale, use:
- **MongoDB Atlas** (managed MongoDB)
- **Redis Cloud** (managed Redis)
- **AWS RDS** (if using PostgreSQL)

### Caching

Implement caching for:
- User salts (after first generation)
- OAuth token verifications
- Rate limit counters

---

## 🔄 CI/CD Pipeline

Example GitHub Actions workflow:

```yaml
name: Deploy Backend
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Deploy to Heroku
        uses: akhileshns/heroku-deploy@v3.12.12
        with:
          heroku_api_key: ${{secrets.HEROKU_API_KEY}}
          heroku_app_name: "sui-shop-backend"
          heroku_email: "your@email.com"
```

---

## 📚 Additional Resources

**Documentation:**
- [Express.js Docs](https://expressjs.com/)
- [JWT Best Practices](https://jwt.io/introduction)
- [SendGrid API](https://docs.sendgrid.com/)
- [Google OAuth](https://developers.google.com/identity/protocols/oauth2)

**Security:**
- [OWASP API Security](https://owasp.org/www-project-api-security/)
- [Node.js Security Checklist](https://github.com/goldbergyoni/nodebestpractices)

---

## ✅ Summary

You have a **production-ready backend** that:

✅ **Generates secure wallet seeds** from social logins  
✅ **Verifies OAuth tokens** (Google, Apple)  
✅ **Sends magic links** for email auth  
✅ **Rate limits** all endpoints  
✅ **Logs** all operations  
✅ **Validates** all inputs  
✅ **Scales** horizontally  
✅ **Deploys** to any platform  

**Ready to deploy in minutes!** 🚀

---

**Questions?** Check the code comments or raise an issue.

**License:** MIT  
**Author:** CoA Tech  
**Version:** 1.0.0
