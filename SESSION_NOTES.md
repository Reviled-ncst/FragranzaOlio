# FragranzaWeb Development Documentation
**Last Updated:** February 19, 2026

---

## 📋 Table of Contents
1. [Project Overview](#project-overview)
2. [Development Phases](#development-phases)
3. [Quick Start Guide](#quick-start-guide)
4. [Deployment Procedures](#deployment-procedures)
5. [Session Logs](#session-logs)
6. [API Reference](#api-reference)
7. [Database Schema](#database-schema)
8. [Key Files Reference](#key-files-reference)
9. [Process Workflows](#process-workflows)
10. [Recommendations & Best Practices](#recommendations--best-practices)
11. [Troubleshooting](#troubleshooting)

---

## 🏗️ Project Overview

### Tech Stack
| Layer | Technology |
|-------|-----------|
| **Frontend** | React 18 + TypeScript + Vite + TailwindCSS |
| **Backend** | PHP 8 + MySQL via XAMPP |
| **Database** | MySQL `fragranza_db` |
| **Auth** | Firebase Authentication + Supabase |
| **Hosting** | Vercel (frontend) + Cloudflare Tunnel (backend) |

### Project Locations
- **Development:** `C:\Users\User\Documents\Projects\FragranzaWeb`
- **Symlinked Backend:** `C:\xampp\htdocs\backend` → development folder (auto-synced)

### Test Credentials
| Role | Email | Password |
|------|-------|----------|
| Sales | vendor0qw@gmail.com | Test@1234 |
| Admin | renzrusselbauto@gmail.com | (Firebase) |

---

## 🚀 Development Phases

### Phase 1: Core E-commerce ✅
- Product catalog with categories
- Shopping cart functionality
- User authentication (Firebase)
- Basic order placement

### Phase 2: Sales Module ✅
- Sales dashboard with analytics
- Product management (CRUD + variations)
- Order management with status workflow
- Customer management

### Phase 3: Inventory System ✅
- Multi-branch inventory tracking
- Stock-in/stock-out operations
- Transfer between branches
- Stock alerts and notifications
- Inventory transactions audit trail

### Phase 4: Order Flow Enhancement ✅
- Payment verification workflow
- Store pickup with QR/barcode scanning
- COD via Lalamove integration info
- Order status history tracking

### Phase 5: Sales POS & Verification 🔄 IN PROGRESS
- **Barcode/QR scanning for orders** ✅
- **Auto stock deduction on order confirmation** ✅
- **Inventory transaction logging** ✅
- **Sales representative tracking** ✅
- **Customer order verification** ✅
- Pickup flow requires barcode scan ✅
- Customer verifies receipt to complete order ✅

### Phase 6: Security Hardening ✅
- **Auth middleware** - Centralized Bearer token verification (`requireAuth`, `requireRole`, `optionalAuth`)
- **Rate limiting** - IP-based: login (5/min), register (10/hr), password reset (3/hr)
- **Input sanitization** - Centralized trim, htmlspecialchars, length limits across all endpoints
- **CORS rewrite** - Origin whitelist replacing wildcard `*`, plus security headers
- **SQL injection fix** - Parameterized count query in sales.php
- **Auth bypass fix** - Removed X-Admin-Email header bypass in admin_users.php
- **Privilege escalation fix** - Registration restricted to customer/ojt roles
- **File upload hardening** - finfo MIME verification, getimagesize validation
- **Error leak prevention** - Removed `$e->getMessage()` from 50+ client responses
- **Credential management** - Moved DB credentials from hardcoded to `.env` file
- **Password complexity** - Uppercase + lowercase + number + special char required
- **Debug lockdown** - debug.php restricted to localhost only

### Phase 7: Planned Features 📋
- Real-time Lalamove tracking integration
- Push/SMS notifications
- Customer ratings & reviews (partially done)
- Analytics dashboard enhancements
- Multi-language support

---

## ⚡ Quick Start Guide

### 1. Start Development Environment
```powershell
# Start XAMPP (Apache + MySQL)
# Then start frontend dev server:
cd C:\Users\User\Documents\Projects\FragranzaWeb\frontend
npm run dev
```

### 2. Start Cloudflare Tunnel (for Vercel testing)
```powershell
cd C:\Users\User\Documents\Projects\FragranzaWeb
.\start-tunnel.ps1
```

### 3. Update Tunnel URL & Deploy to Vercel
```powershell
# Get new tunnel URL from tunnel-url.txt, then:
.\update-tunnel-url.ps1 -NewUrl "https://your-tunnel-url.trycloudflare.com" -Push
```

### 4. Common Commands
```powershell
# Type check
cd frontend; npx tsc --noEmit

# Test API locally
Invoke-RestMethod -Uri "http://localhost/backend/api/products.php" -Method GET

# View tunnel URL
Get-Content tunnel-url.txt

# Check git status
git status; git log --oneline -5
```

---

## 📦 Deployment Procedures

### Why This Architecture?
- **Vercel** hosts the React frontend (free, fast CDN, auto-deploy from GitHub)
- **XAMPP** runs PHP/MySQL backend locally (development flexibility)
- **Cloudflare Tunnel** exposes local XAMPP to the internet (free, no port forwarding needed)

### Local Development (XAMPP)
1. Backend is symlinked: `C:\xampp\htdocs\backend` → project's `backend` folder
2. Changes to PHP files are immediately live (no copy needed)
3. Frontend runs on `localhost:3000` via Vite
4. Update `.env` for local: `VITE_API_URL=http://localhost/backend/api`

### Vercel Production Deployment

#### Architecture Diagram
```
┌─────────────┐    ┌──────────────────┐    ┌─────────────────────┐    ┌─────────────┐
│   Browser   │───▶│  Vercel (React)  │───▶│  Cloudflare Tunnel  │───▶│  XAMPP PHP  │
│             │    │  /api/proxy.ts   │    │  *.trycloudflare.com│    │  localhost  │
└─────────────┘    └──────────────────┘    └─────────────────────┘    └─────────────┘
```

#### How It Works
1. User visits `fragranza-olio.vercel.app`
2. React app makes API calls to `/api/proxy`
3. Vercel serverless function (`api/proxy.ts`) forwards request to Cloudflare tunnel URL
4. Cloudflare tunnel routes request to `localhost:80` (XAMPP Apache)
5. PHP processes request, returns JSON
6. Response flows back through the chain

#### Starting Cloudflare Tunnel
```powershell
# Basic start (manual URL update)
.\start-tunnel.ps1

# Auto-detect URL and push to deploy (recommended)
.\start-tunnel.ps1 -AutoPush

# Watch mode for URL changes
.\start-tunnel.ps1 -Watch
```

The `start-tunnel.ps1` script:
1. Starts `cloudflared tunnel --url http://localhost:80`
2. **Auto-detects** the tunnel URL from cloudflared output
3. **Auto-updates** `api/proxy.ts` and `api/image.ts`
4. With `-AutoPush`: commits and pushes to GitHub automatically
5. Vercel auto-deploys on push

The tunnel URL looks like: `https://random-words.trycloudflare.com`
- **Changes every time** you restart the tunnel
- Saved automatically to `tunnel-url.txt`

#### Manual Update (if script fails)
```powershell
# 1. Edit api/proxy.ts - change BACKEND_URL
# 2. Edit api/image.ts - change BACKEND_URL
# 3. Commit and push
git add api/proxy.ts api/image.ts tunnel-url.txt
git commit -m "Update tunnel URL"
git push origin main
```

#### Important Files
| File | Purpose |
|------|---------|
| `api/proxy.ts` | Vercel serverless function - forwards API calls to tunnel |
| `api/image.ts` | Vercel serverless function - proxies images from backend |
| `vercel.json` | Build config, rewrites `/api/*` to serverless functions |
| `tunnel-url.txt` | Current active tunnel URL (reference) |
| `start-tunnel.ps1` | **Main script** - starts tunnel, auto-detects URL, updates proxy files |
| `update-tunnel-url.ps1` | Manual URL update (if auto-detect fails) |

#### Keeping Tunnel Running
The tunnel must stay running while testing on Vercel:
- Use `start-tunnel.ps1` which runs in background
- Or run cloudflared in a separate terminal
- If tunnel disconnects, you'll get "Unexpected token '<'" errors (HTML error page)

### Switching Between Local and Vercel Testing

**For Local Development:**
```powershell
# frontend/.env
VITE_API_URL=http://localhost/backend/api
VITE_IMAGE_URL=http://localhost/backend
```

**For Vercel (tunnel):**
- Don't set VITE_API_URL (Vercel uses `/api/proxy` route)
- Frontend code detects production and uses proxy automatically

### Database Updates
```powershell
# Run SQL files via MySQL CLI
C:\xampp\mysql\bin\mysql.exe -u root fragranza_db -e "SOURCE path/to/script.sql"

# Or use phpMyAdmin at http://localhost/phpmyadmin
```

---

## 📝 Session Logs

### February 19, 2026 - Sales POS & Customer Verification
**Focus:** Order pickup flow and customer verification

#### Completed:
1. **Barcode Scan Required for Pickup**
   - Removed manual "Picked Up" button for `paid_ready_pickup` status
   - Added "Scan Barcode to Complete" message
   - Pickup orders must be completed via barcode/QR scan

2. **Customer Verification Endpoint**
   - New endpoint: `POST /sales.php?action=customer-verify-order`
   - Accepts `order_number` + `email` to verify ownership
   - Only allows verification of `delivered` or `picked_up` orders
   - Updates status to `completed` with `customer_verified_at` timestamp

3. **Frontend Customer Verification**
   - Added `verifyOrderReceipt()` to `orderService.ts`
   - Updated Orders.tsx to use verification endpoint
   - Changed button text: "Mark as Completed" → "Verify Receipt"

4. **Database Updates**
   - Added `customer_verified_at DATETIME` column to orders table
   - Added `processed_by INT` and `processed_at DATETIME` columns

#### Files Modified:
- `backend/api/sales.php` - customerVerifyOrder() function
- `frontend/src/services/orderService.ts` - verifyOrderReceipt()
- `frontend/src/pages/Orders.tsx` - customer verification UI
- `frontend/src/pages/SalesOrders.tsx` - scan-only pickup

---

### February 18, 2026 - Auto Stock Deduction & Sales Rep Tracking
**Focus:** Inventory automation

#### Completed:
1. **Auto Stock Deduction**
   - Stock deducted when order status changes to: `confirmed`, `processing`, `picked_up`, `delivered`
   - Handles both product base stock and variation stock
   - Deduction only happens once (checks if already processed)

2. **Inventory Transaction Logging**
   - Creates `stock_out` transaction for each order item
   - Records: quantity, product, reference (order number), sales rep name

3. **Sales Representative Tracking**
   - `processed_by` column stores user ID of sales rep
   - `processed_at` column stores timestamp
   - Sent from frontend via `user_id` in status update request

4. **Physical Barcode Scanner Support**
   - Detects rapid keystrokes (scanner input)
   - Shows confirmation dialog before processing
   - Works with USB/Bluetooth barcode scanners

---

### February 17, 2026 - Customer Data Fix
**Focus:** Customer list showing "No customers found"

#### Issue:
- System was querying non-existent `customers` table

#### Fix:
- Query `users` table where `email_verified = 1`
- Join with orders for stats: total_orders, total_spent, last_order

---

### February 12-14, 2026 - Vercel Deployment Setup
**Focus:** Production deployment architecture

#### Completed:
- Set up Cloudflare Tunnel for XAMPP backend access
- Created Vercel serverless proxy functions
- Implemented auto-update scripts for tunnel URL
- Configured GitHub auto-deploy integration

---

### February 10, 2026 - Checkout & Mobile UX
**Focus:** Checkout experience improvements

#### Completed:
1. **Store Pickup Map** - Google Maps embed showing store location
2. **Lalamove COD Info** - 24-hour delivery estimate, tracking info
3. **Notification Bell** - Added to header
4. **Mobile Responsive SalesOrders** - Card layout on mobile

---

### February 7, 2026 - Inventory System
**Focus:** Multi-branch inventory management

#### Completed:
1. **Branch Management** - Multiple store locations
2. **Stock Operations** - In/out/transfer/adjustment
3. **Transaction History** - Full audit trail
4. **Stock Alerts** - Low stock notifications
5. **Dashboard Stats** - Inventory value, stock health

---

## 📡 API Reference

### Products API (`/api/products.php`)
| Method | Action | Description |
|--------|--------|-------------|
| GET | `?action=list` | List all products |
| GET | `?id=X` | Get single product |
| POST | - | Create product |
| PUT | `?id=X` | Update product |
| DELETE | `?id=X` | Delete product |

### Sales API (`/api/sales.php`)
| Method | Action | Description |
|--------|--------|-------------|
| GET | `?action=orders` | List orders |
| GET | `?action=customers` | List customers |
| POST | `?action=customer-verify-order` | Customer verifies receipt |
| PUT | `?action=order-status` | Update order status |

### Inventory API (`/api/inventory.php`)
| Method | Action | Description |
|--------|--------|-------------|
| GET | `?action=branches` | List branches |
| GET | `?action=stock-levels` | Get stock levels |
| GET | `?action=transactions` | Transaction history |
| POST | `?action=stock-in` | Receive stock |
| POST | `?action=stock-out` | Remove stock |
| POST | `?action=transfer` | Transfer stock |

---

## 🗄️ Database Schema

### Key Tables
| Table | Purpose |
|-------|---------|
| `users` | User accounts (Firebase linked) |
| `products` | Product catalog |
| `categories` | Product categories |
| `orders` | Customer orders |
| `order_items` | Order line items |
| `order_status_history` | Status change log |
| `branches` | Store locations |
| `branch_inventory` | Stock per branch |
| `inventory_transactions` | Stock movement audit |

### Important Columns in `orders`
- `status` - Order status enum
- `processed_by` - Sales rep user ID
- `processed_at` - When order was processed
- `customer_verified_at` - When customer confirmed receipt

### Order Status Flow
```
ordered → paid_waiting_approval → confirmed → processing → in_transit → delivered → completed
                                     ↓
                                paid_ready_pickup → picked_up → completed (via customer verify)
```

---

## � Key Files Reference

### Frontend Files

| File | Purpose | Key Functions |
|------|---------|---------------|
| `frontend/src/pages/SalesOrders.tsx` | Sales order management | Order list, status updates, barcode scanning |
| `frontend/src/pages/Orders.tsx` | Customer order history | View orders, verify receipt, rate products |
| `frontend/src/pages/SalesDashboard.tsx` | Sales analytics dashboard | Stats, charts, tabs for orders/customers |
| `frontend/src/pages/SalesProducts.tsx` | Product CRUD management | Add/edit products, variations, images |
| `frontend/src/pages/SalesInventory.tsx` | Inventory management | Stock levels, transfers, alerts |
| `frontend/src/pages/Checkout.tsx` | Customer checkout flow | Payment selection, shipping, order placement |
| `frontend/src/services/orderService.ts` | Order API calls | Create, update, verify orders |
| `frontend/src/services/api.ts` | Base API configuration | Axios instance, interceptors |
| `frontend/src/context/AuthContext.tsx` | Authentication state | Firebase auth, user roles |

### Backend Files

| File | Purpose | Key Endpoints |
|------|---------|---------------|
| `backend/api/sales.php` | Sales operations | Orders, customers, status updates, verification |
| `backend/api/products.php` | Product CRUD | List, create, update, delete products |
| `backend/api/inventory.php` | Stock management | Stock in/out, transfers, alerts |
| `backend/api/auth.php` | Authentication | Login, register, verify email |
| `backend/api/upload.php` | File uploads | Product images, documents |
| `backend/config/database.php` | DB connection | MySQL PDO config, loads `.env` credentials |
| `backend/middleware/cors.php` | CORS & security headers | Origin whitelist, X-Frame-Options, HSTS, CSP |
| `backend/middleware/auth.php` | Auth middleware | `requireAuth()`, `requireRole()`, `optionalAuth()` |
| `backend/middleware/rate_limit.php` | Rate limiting | IP-based throttling for login/register/reset |
| `backend/middleware/sanitize.php` | Input sanitization | `sanitizeInput()`, `sanitizeEmail()`, `sanitizePhone()` |
| `backend/.env` | Environment secrets | DB credentials (gitignored, never committed) |
| `backend/.env.example` | Env template | Safe template to copy for new setups |

### Deployment Files

| File | Purpose | When to Edit |
|------|---------|--------------|
| `api/proxy.ts` | Vercel serverless proxy | When tunnel URL changes |
| `api/image.ts` | Image proxy for Vercel | When tunnel URL changes |
| `vercel.json` | Vercel build config | Rarely - routes and build settings |
| `start-tunnel.ps1` | Tunnel starter script | Never - just run it |
| `update-tunnel-url.ps1` | Manual URL updater | If auto-detect fails |
| `tunnel-url.txt` | Current tunnel URL | Auto-updated by scripts |

### Database Files

| File | Purpose | When to Run |
|------|---------|-------------|
| `database/COMPLETE_SETUP.sql` | Full schema import | First-time setup |
| `database/inventory_schema.sql` | Inventory tables | Adding inventory feature |
| `database/products_schema.sql` | Products tables | Products feature setup |
| `database/sales_schema.sql` | Sales/orders tables | Sales feature setup |

---

## 📋 Process Workflows

### 1. Starting Development Session
```powershell
# 1. Start XAMPP (Apache + MySQL)
# 2. Start Cloudflare tunnel for Vercel testing
.\start-tunnel.ps1 -AutoPush

# 3. Start frontend dev server (optional, for local testing)
cd frontend; npm run dev
```

### 2. Making Code Changes
```powershell
# 1. Edit files in VS Code
# 2. Backend changes are live immediately (symlinked)
# 3. Frontend changes hot-reload via Vite
# 4. Test locally at http://localhost:3000
```

### 3. Deploying to Vercel
```powershell
# Option A: Use start-tunnel.ps1 with -AutoPush (handles everything)
.\start-tunnel.ps1 -AutoPush

# Option B: Manual commit and push
git add -A
git commit -m "Your message"
git push origin main
# Vercel auto-deploys on push
```

### 4. Database Schema Changes
```powershell
# 1. Create SQL migration file in /database
# 2. Run via MySQL CLI
C:\xampp\mysql\bin\mysql.exe -u root fragranza_db -e "SOURCE database/your_migration.sql"

# Or use phpMyAdmin at http://localhost/phpmyadmin
```

### 5. Order Processing Flow (Sales)
1. Customer places order → status: `ordered`
2. For store pickup: status → `paid_ready_pickup`
3. Sales scans barcode → status → `picked_up`
4. Customer clicks "Verify Receipt" → status → `completed`

### 6. Stock Deduction Flow
1. Order reaches `confirmed/processing/picked_up/delivered` status
2. System auto-deducts from `products.stock_quantity`
3. Creates `inventory_transactions` record
4. Records `processed_by` (sales rep ID) and `processed_at`

---

## 💡 Recommendations & Best Practices

### Development
- **Always use symlinks** for backend to avoid manual file syncing
- **Test locally first** before pushing to Vercel
- **Keep tunnel running** while testing on Vercel
- **Check console errors** - "Unexpected token '<'" usually means wrong tunnel URL

### Code Quality
- **TypeScript strict mode** - Fix type errors before committing
- **Run `npx tsc --noEmit`** to check for type errors
- **Use consistent naming** - camelCase for JS, snake_case for PHP/SQL

### Git Workflow
- **Commit frequently** with descriptive messages
- **Push after completing** each feature
- **Update SESSION_NOTES.md** to document changes

### Security ✅ (Hardened)
- **Credentials in `.env`** - DB passwords loaded from `backend/.env` (gitignored), not hardcoded ✅
- **Auth middleware on all write endpoints** - `requireAuth()`/`requireRole()` on POST/PUT/DELETE ✅
- **Rate limiting active** - Login (5/min), registration (10/hr), password reset (3/hr) ✅
- **Input sanitization** - All user-facing endpoints use `sanitizeInput()` with length limits ✅
- **CORS origin whitelist** - Only fragranza-web.vercel.app and localhost allowed ✅
- **Security headers** - X-Content-Type-Options, X-Frame-Options, HSTS, Referrer-Policy ✅
- **Error messages genericized** - Server errors logged, clients see "An internal error occurred" ✅
- **File uploads validated** - MIME type verified with finfo, extensions derived from content ✅
- **Password complexity enforced** - Uppercase + lowercase + number + special character ✅
- **No admin bypass** - All admin actions require valid Bearer token session ✅

### Performance
- **Lazy load images** using loading="lazy"
- **Cache API responses** where appropriate
- **Use pagination** for large lists (orders, products)

### Debugging
- **Check browser console** first for frontend errors
- **Check XAMPP Apache logs** for PHP errors: `C:\xampp\apache\logs\error.log`
- **Use `console.log`** with emoji prefixes for easy filtering (📦, 🔐, ❌, ✅)

---

## �🔧 Troubleshooting

### "Unexpected token '<'" Error
**Cause:** API returning HTML instead of JSON (wrong URL or server error)

**Fix:**
1. Check tunnel is running: `Get-Content tunnel-url.txt`
2. Verify proxy files have correct URL: `api/proxy.ts`, `api/image.ts`
3. Update and redeploy: `.\update-tunnel-url.ps1 -NewUrl "..." -Push`

### Orders Not Showing
**Cause:** Missing customer_id link or wrong email

**Fix:** Check `orders` table has correct `customer_id` and `shipping_email`

### Stock Not Deducting
**Cause:** Order status not reaching deduction triggers

**Fix:** Verify status is one of: `confirmed`, `processing`, `picked_up`, `delivered`

### Scanner Not Working
**Cause:** Scanner not in HID keyboard mode

**Fix:** Configure scanner to emulate keyboard input with Enter suffix

---

## 🔗 Important URLs

| Resource | URL |
|----------|-----|
| GitHub Repo | https://github.com/Reviled-ncst/FragranzaOlio |
| Vercel Frontend | https://fragranza-olio.vercel.app |
| Local Frontend | http://localhost:3000 |
| Local API | http://localhost/backend/api |
| phpMyAdmin | http://localhost/phpmyadmin |

---

*Documentation maintained by development team*
