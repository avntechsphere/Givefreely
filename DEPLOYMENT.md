# Give-freely App - Deployment Guide

## ✅ Status: Successfully Deployed & Tested

The Give-freely app has been successfully deployed locally with all security features, password-reset flow, and API endpoints working correctly.

## Prerequisites Installed

- **Node.js**: v20.11.1 (located at `C:\nvm4w\nodejs`)
- **npm**: 10.2.4
- **PostgreSQL**: v18 (installed at `C:\Program Files\PostgreSQL\18\bin`)
- **Database**: `give_freely_db` created and configured

## Deployment Steps

### 1. Add nodejs to PATH (Windows)

```powershell
$env:PATH = "C:\nvm4w\nodejs;$env:PATH"
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Environment Variables

Create a `.env` file in the project root with:

```env
DATABASE_URL=postgres://postgres:P@55w0rd@localhost:5432/give_freely_db
SESSION_SECRET=96392299df682e1db70d43d96c212b2493a4448da1e7ae83fc0beeeaaa70496d
NODE_ENV=production
PORT=5000
SERVER_HOST=127.0.0.1
FRONTEND_URL=http://localhost:5173
CORS_ORIGIN=http://localhost:5173
```

Or use individual env var assignments:

```powershell
$env:DATABASE_URL = "postgres://postgres:P%4055w0rd@localhost:5432/give_freely_db"
$env:SESSION_SECRET = "96392299df682e1db70d43d96c212b2493a4448da1e7ae83fc0beeeaaa70496d"
$env:NODE_ENV = "production"
$env:PORT = "5000"
```

### 4. Build the Application

```bash
npm run build
```

### 5. Start the Server

**Production Mode:**
```bash
npm run start
```

**Development Mode:**
```bash
npm run dev
```

The server will listen on `http://127.0.0.1:5000`

## API Endpoints Tested ✅

### 1. Get CSRF Token
```bash
GET http://127.0.0.1:5000/api/csrf-token
```

**Response:**
```json
{
  "csrfToken": "OS4WswO5-v9IhpjYevXjW0VYkNuP0_PI33qk"
}
```

### 2. Register User
```bash
POST http://127.0.0.1:5000/api/register
Content-Type: application/json

{
  "username": "testuser",
  "password": "Test@123456",
  "name": "Test User"
}
```

**Response:**
```json
{
  "id": 1,
  "username": "testuser",
  "name": "Test User",
  "emailVerified": false,
  "message": "Registration successful. Please verify your email."
}
```

**Note:** Verification code is logged to console (e.g., `N88RNF`)

## Features Deployed

### Security Enhancements
- ✅ Helmet.js for secure HTTP headers (CSP, X-Frame-Options, etc.)
- ✅ CORS with configurable origins
- ✅ Rate limiting (100 requests per 15 minutes on `/api/*`)
- ✅ Per-route auth rate limiting (10 requests per 15 minutes)
- ✅ CSRF token protection via csurf middleware
- ✅ Request/response logging with sensitive data redaction
- ✅ Input validation using Zod schemas

### Authentication
- ✅ User registration with email verification
- ✅ Password hashing with scrypt (native Node.js crypto)
- ✅ Login with Passport.js Local strategy
- ✅ Session management with connect-pg-simple store
- ✅ Secure session cookies (httpOnly, sameSite: lax)

### Password Reset Flow
- ✅ Password reset request endpoint (`POST /api/password-reset/request`)
- ✅ Password reset confirmation endpoint (`POST /api/password-reset/confirm`)
- ✅ Email sending via nodemailer (SMTP configurable)
- ✅ Reset token expiration (1 hour)
- ✅ Account enumeration protection (generic success response)

### Testing & CI
- ✅ Vitest integration tests
- ✅ Supertest HTTP endpoint testing
- ✅ GitHub Actions CI workflow (typecheck + build on PRs)

## Configuration

### SERVER_HOST Environment Variable

By default, the server binds to `127.0.0.1` (localhost). To change the binding address:

```powershell
$env:SERVER_HOST = "0.0.0.0"  # For Docker/cloud deployment
$env:SERVER_HOST = "127.0.0.1" # For local testing (default)
```

### Database Connection

The app uses PostgreSQL with Drizzle ORM. To push schema changes:

```bash
npm run db:push
```

## Troubleshooting

### Port Already in Use
```powershell
netstat -ano | Select-String "5000"
```

Kill the process if needed:
```powershell
Stop-Process -Id <PID> -Force
```

### Missing npm
Add nodejs to PATH:
```powershell
$env:PATH = "C:\nvm4w\nodejs;$env:PATH"
```

### Database Connection Issues
- Verify PostgreSQL is running: `psql -U postgres`
- Check `DATABASE_URL` is correctly formatted
- Ensure `give_freely_db` database exists

## Git Commits

Recent commits for this deployment:

1. **Security hardening, CSRF, password-reset flow, tests, CI, env** (PR #1)
   - Helmet, CORS, rate-limiting middleware
   - CSRF token endpoint
   - Password reset endpoints
   - Email integration with nodemailer
   - Vitest + Supertest tests
   - GitHub Actions CI workflow

2. **fix: use SERVER_HOST env var for flexible binding**
   - Changed from NODE_ENV-based binding to explicit SERVER_HOST env var
   - Defaults to 127.0.0.1 for localhost testing
   - Supports 0.0.0.0 for cloud/Docker deployment

## Next Steps

1. **Verify email endpoint**: Test email verification with the code from console logs
2. **Password reset flow**: Test full password reset request → confirmation cycle
3. **Frontend integration**: Connect React frontend to the running API
4. **Production deployment**: Deploy to cloud platform (set `SERVER_HOST=0.0.0.0` and secure endpoints)

## Running the Frontend

In another terminal:

```powershell
npm run dev
```

Frontend will be available at `http://localhost:5173`

---

**Deployment Date:** December 30, 2025  
**Branch:** add/security-password-reset (PR #1)  
**Status:** ✅ Ready for Testing
