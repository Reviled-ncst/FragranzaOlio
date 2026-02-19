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
8. [Troubleshooting](#troubleshooting)

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

### Phase 6: Planned Features 📋
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

## 🔧 Troubleshooting

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
