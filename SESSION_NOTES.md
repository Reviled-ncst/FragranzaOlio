# FragranzaWeb Development Session Notes
**Date:** February 7, 2026

## Project Overview
- **Frontend:** React 18 + TypeScript + Vite (localhost:3000)
- **Backend:** PHP 8 + MySQL via XAMPP (localhost/FragranzaWeb/backend/api)
- **Database:** MySQL `fragranza_db`
- **Two Project Locations:**
  - Editing: `C:\Users\User\Documents\Projects\FragranzaWeb`
  - Serving: `C:\xampp\htdocs\FragranzaWeb` (need manual sync)

## Test Credentials
- **Email:** vendor0qw@gmail.com
- **Password:** Test@1234
- **Role:** sales

---

## Completed Features This Session

### 1. Fixed Image Display in Sales Products Table
- **File:** `frontend/src/pages/SalesProducts.tsx`
- **Issue:** Images weren't displaying because they needed full URL prefix
- **Fix:** Added `http://localhost/FragranzaWeb/backend` prefix to image paths

### 2. View Product Details Modal
- **File:** `frontend/src/pages/SalesProducts.tsx`
- **Features:**
  - Image gallery with thumbnails
  - Variation selector (shows different sizes/volumes)
  - Displays all product info: category, status badges, SKU, price, stock
  - Each variation can have its own image

### 3. Product Variations System
- **Files:** 
  - `frontend/src/pages/SalesProducts.tsx`
  - `frontend/src/services/productServicePHP.ts`
  - `backend/api/products.php`

- **ProductVariation Interface:**
```typescript
interface ProductVariation {
  id: string;
  volume: string;
  price: number;
  comparePrice: number;
  stock: number;
  sku: string;
  image?: string;        // URL of uploaded image
  imageFile?: File;      // File object for upload
  description?: string;
  isDefault?: boolean;
}
```

- **Features:**
  - Add/edit/delete variations in "Product Details" tab
  - Each variation has: volume, price, compare price, stock, SKU, image
  - Mark variation as default
  - Upload individual images per variation
  - Preview variation thumbnails in "Basic Info" tab
  - Variations stored as JSON in `variations` column in products table

### 4. Step Validation for Add Product Modal
- **File:** `frontend/src/pages/SalesProducts.tsx`
- **Validation Rules:**
  - **Step 1 (Basic Info):** Name, category, and price required
  - **Step 2 (Details):** Volume required
  - Shows error message if validation fails
  - "Next" button disabled until requirements met

### 5. Fixed Variations Not Saving Bug
- **File:** `backend/api/products.php`
- **Issue:** PHP was referencing `featured` column instead of `is_featured`
- **Fix:** Changed `featured` to `is_featured` in INSERT and UPDATE queries (lines ~218, 224)

### 6. Simplified Header Navigation
- **File:** `frontend/src/components/layout/Header.tsx`
- **Change:** Sales role navigation simplified to:
  - Dashboard
  - Products
  - Inventory
- Removed Orders/Customers from header (they're tabs in Dashboard)

### 7. Created Dedicated Inventory Page
- **New File:** `frontend/src/pages/SalesInventory.tsx`
- **Route:** `/sales/inventory`
- **Features:**
  - Stats grid: Total units, inventory value, in-stock/low-stock/out-of-stock counts
  - Stock levels table with search and filter
  - Stock movement indicators (trending up/down)
  - Restock alerts sidebar
  - Stock health visualization with progress bars
  - Recent activity feed
  - Add/remove stock buttons

### 8. Updated Dashboard Tabs
- **File:** `frontend/src/pages/SalesDashboard.tsx`
- **Tabs:** Overview, Orders, Customers, Reports
- Removed Inventory tab (now separate page)

---

## File Changes Summary

### Modified Files:
1. `frontend/src/pages/SalesProducts.tsx` - Product management, variations, view modal
2. `frontend/src/pages/SalesDashboard.tsx` - Removed inventory tab
3. `frontend/src/components/layout/Header.tsx` - Added Inventory link
4. `frontend/src/App.tsx` - Added `/sales/inventory` route
5. `frontend/src/services/productServicePHP.ts` - ProductVariation interface
6. `backend/api/products.php` - Fixed `is_featured` column, variations JSON handling

### New Files:
1. `frontend/src/pages/SalesInventory.tsx` - Dedicated inventory management page

---

## Database Schema Notes

### Products Table Key Columns:
- `id`, `name`, `description`, `short_description`
- `price`, `compare_price`
- `category_id`
- `image_main`, `image_gallery` (JSON)
- `stock_quantity`, `stock_status`
- `sku`, `volume`
- `is_featured`, `is_new`, `is_on_sale`
- `variations` (JSON) - Stores array of ProductVariation objects
- `status` ('active', 'draft', 'archived')

---

## Pending/Future Work

### Inventory System - COMPLETED ✅
Created a comprehensive inventory management system with:
- Multi-branch/location support
- Stock-in, stock-out, transfer operations
- Transaction history with audit trail
- Stock alerts (low stock, out of stock)
- Branch management

---

## Inventory Management System

### Database Schema
Run `database/inventory_schema.sql` in phpMyAdmin to create:

1. **branches** - Store locations (warehouses and retail branches)
   - Main Warehouse, SM MOA, Greenbelt, Trinoma (default branches)
   
2. **branch_inventory** - Stock levels per branch/product
   - Tracks quantity, min/max levels, last restocked date
   
3. **inventory_transactions** - All stock movements
   - Types: stock_in, stock_out, transfer, adjustment, return, damaged
   - Tracks source/destination for transfers
   - Reference numbers, suppliers, costs, remarks
   
4. **stock_alerts** - Low stock and out-of-stock alerts

### API Endpoints (`/api/inventory.php`)

| Action | Method | Description |
|--------|--------|-------------|
| `?action=branches` | GET | Get all active branches |
| `?action=stock-levels` | GET | Get stock levels (filter by branch/product) |
| `?action=transactions` | GET | Get transaction history |
| `?action=alerts` | GET | Get unresolved stock alerts |
| `?action=dashboard` | GET | Get inventory dashboard stats |
| `?action=stock-in` | POST | Receive stock at a branch |
| `?action=stock-out` | POST | Remove stock from a branch |
| `?action=transfer` | POST | Transfer between branches |
| `?action=adjustment` | POST | Adjust stock count |
| `?action=complete-transfer` | PUT | Complete a pending transfer |
| `?action=branch` | POST | Create a new branch |

### Frontend Components

**SalesInventory.tsx** - Main inventory page with tabs:
- **Overview**: Dashboard stats, alerts, pending transfers
- **Stock Levels**: View/filter stock by branch with actions
- **Transactions**: Full transaction history with filtering
- **Branches**: View all branches and their details

**inventoryService.ts** - TypeScript API service with types

### Stock Operations

1. **Stock In** (Receiving):
   - Select branch, product, quantity
   - Optional: supplier, unit cost, reference number
   - Reasons: Purchase order, return, transfer received, etc.

2. **Stock Out** (Removing):
   - Select branch, product, quantity
   - Required: reason (Sold, Damaged, Expired, Lost, etc.)
   - Optional: reference number, remarks

3. **Transfer**:
   - Select source and destination branches
   - Immediate or in-transit mode
   - Deducts from source, adds to destination
   - Reasons: Branch request, stock balancing, promotional event

4. **Adjustment**:
   - Set new quantity for a product at a branch
   - Required: reason (Physical count, system correction, audit)
   - Logs the difference (+/-) in transactions

---

## Quick Commands

### Start Development Server:
```powershell
cd C:\xampp\htdocs\FragranzaWeb\frontend
npm run dev
```

### Type Check:
```powershell
cd C:\Users\User\Documents\Projects\FragranzaWeb\frontend
npx tsc --noEmit
```

### Test API:
```powershell
Invoke-RestMethod -Uri "http://localhost/FragranzaWeb/backend/api/products.php" -Method GET | ConvertTo-Json -Depth 5
```

### Sync All Frontend Files:
```powershell
Copy-Item -Path "C:\Users\User\Documents\Projects\FragranzaWeb\frontend\src\*" -Destination "C:\xampp\htdocs\FragranzaWeb\frontend\src\" -Recurse -Force
```

---

## Architecture Notes

### Sales Module Routes:
- `/sales` - Dashboard (Overview, Orders, Customers, Reports tabs)
- `/sales/products` - Product management (CRUD, variations)
- `/sales/inventory` - Stock management

### API Endpoints:
- `GET /api/products.php` - List all products
- `GET /api/products.php?id=X` - Get single product
- `POST /api/products.php` - Create product
- `PUT /api/products.php?id=X` - Update product
- `DELETE /api/products.php?id=X` - Delete product
- `POST /api/upload.php` - Upload images

---

*Last updated: February 10, 2026*

---

# Session Notes - February 10, 2026

## Overview
This session focused on enhancing the checkout experience for Fragranza customers, improving notification visibility, and ensuring mobile responsiveness across all pages.

---

## Completed Features

### 1. Store Pickup - Location Map
**File:** `frontend/src/pages/Checkout.tsx`

When customers select "Store Pickup" as their payment method, they now see:
- **Interactive Google Maps embed** showing the exact store location
- **Store details card** with:
  - Store name: Fragranza Store
  - Address: Blk 16 Lot1-A Brgy San Dionisio, Dasmariñas, Cavite
  - Phone: +63 912 345 6789
  - Hours: Mon-Sat: 9AM-7PM, Sun: 10AM-5PM
- **"Get Directions" button** that opens Google Maps navigation

**Store Coordinates:**
- Latitude: 14.3294
- Longitude: 120.9367

---

### 2. Cash on Delivery - Lalamove Integration Info
**File:** `frontend/src/pages/Checkout.tsx`

When customers select "Cash on Delivery via Lalamove":

#### During Checkout:
- **Info banner** explaining Lalamove delivery partnership
- **Estimated delivery time: Within 24 hours**
- Explanation: "We need time to prepare your order and find an available rider"
- Notification reminder about tracking link

#### Order Summary Section:
- Changed "Est. delivery" from showing Lalamove's rider ETA (e.g., "16 mins") to **"Within 24 hours"**
- This reflects the actual business process: order preparation + finding rider

#### After Order Placed (Success Screen):
- Clear indication of COD via Lalamove
- Blue info box with 24-hour delivery estimate
- Gold notification box about upcoming tracking link
- Confirmation email display

---

### 3. Notification Bell in Header
**File:** `frontend/src/components/layout/Header.tsx`

**Changes:**
- Added `NotificationDropdown` component beside the profile dropdown button
- Visible on both desktop and mobile views
- **Removed** the redundant "Notifications & Help" option from inside the user dropdown menu

**Desktop:** Notification bell appears next to shopping cart icon
**Mobile:** Notification bell appears with slightly scaled down size (scale-90)

---

### 4. Mobile Responsiveness - SalesOrders Page
**File:** `frontend/src/pages/SalesOrders.tsx`

**Improvements Made:**

#### Stats Cards:
- Changed grid from `grid-cols-2 lg:grid-cols-5` to `grid-cols-2 sm:grid-cols-3 lg:grid-cols-5`
- Reduced padding on mobile: `p-3 sm:p-4`
- Smaller text on mobile with `text-base sm:text-xl`

#### Filter Form:
- Split into two responsive rows:
  - Row 1: Search input + Barcode scan button
  - Row 2: Filter dropdowns + Clear/Refresh buttons
- Better spacing and sizing for mobile

#### Orders Table → Mobile Cards:
- **Desktop (lg+):** Traditional table view
- **Mobile (<lg):** Card-based layout showing:
  - Order number with status badge
  - Customer name and email
  - Order summary (items, total, date)
  - Payment status
  - Quick action buttons (View, Update Status)

---

## Payment Methods Configuration

```typescript
const paymentMethods = [
  { 
    id: 'cod', 
    name: 'Cash on Delivery via Lalamove', 
    icon: Truck, 
    description: 'Delivered within 24 hours. Tracking link sent via notification.' 
  },
  { 
    id: 'store_pickup', 
    name: 'Store Pickup', 
    icon: Store, 
    description: 'Pick up your order at our store and pay in cash or via QR' 
  },
];
```

---

## Files Modified (Feb 10, 2026)

| File | Changes |
|------|---------|
| `frontend/src/pages/Checkout.tsx` | Store map, Lalamove info, 24hr delivery estimate |
| `frontend/src/components/layout/Header.tsx` | Notification bell beside profile |
| `frontend/src/pages/SalesOrders.tsx` | Mobile card view, responsive filters |

---

## Technical Notes

### Google Maps Embed API
```html
<iframe
  src="https://www.google.com/maps/embed/v1/place?key=API_KEY&q=14.3294,120.9367&zoom=16"
  width="100%"
  height="200"
  allowFullScreen
  loading="lazy"
/>
```

### Responsive Breakpoints Used
- `sm`: 640px
- `md`: 768px  
- `lg`: 1024px
- `xl`: 1280px

### Icons Added/Used
- `Clock` - For delivery time estimates
- `Bell` - For notification reminders
- `Truck` - For COD/delivery
- `Store` - For store pickup
- `Navigation2` - For directions
- `Phone` - For store contact
- `ExternalLink` - For external links
- `Info` - For info banners

---

## Deployment
All modified files were copied to XAMPP:
```
C:\xampp\htdocs\FragranzaWeb\frontend\src\pages\Checkout.tsx
C:\xampp\htdocs\FragranzaWeb\frontend\src\components\layout\Header.tsx
C:\xampp\htdocs\FragranzaWeb\frontend\src\pages\SalesOrders.tsx
```

---

## Future Considerations

1. **Customer Ratings** - Add rating system after order completion
2. **Real-time Tracking** - Integrate actual Lalamove tracking API
3. **Push Notifications** - Browser push notifications for order updates
4. **SMS Notifications** - Send tracking links via SMS as backup
5. **Order Preparation Time** - Track and display actual preparation time

---

*Session End: February 10, 2026*
