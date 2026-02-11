# Fragranza Olio - Migration Checklist (Supabase → XAMPP)
## Status: In Progress

---

## ✅ COMPLETED

### Backend (PHP/MySQL)
- ✅ Database schema created (`COMPLETE_SETUP.sql`)
- ✅ Products API (`backend/api/products.php`)
- ✅ Categories API (`backend/api/categories.php`)
- ✅ Auth API (`backend/api/auth.php`)
- ✅ Contact API (`backend/api/contact.php`)
- ✅ Newsletter API (`backend/api/newsletter.php`)
- ✅ Database config (`backend/config/database.php`)
- ✅ CORS middleware (`backend/middleware/cors.php`)

### Frontend Services
- ✅ Product Service PHP (`frontend/src/services/productServicePHP.ts`) - CREATED
- ✅ SalesProducts page - USING PHP service ✓
- ✅ ProductsDB page - USING PHP service ✓

---

## ⚠️ NEEDS ATTENTION

### 1. Auth Service - STILL USING SUPABASE
**File**: `frontend/src/services/authService.ts`
**Status**: ❌ Using Supabase auth
**Impact**: Login/Register/Logout won't work with XAMPP
**Action Needed**: Create `authServicePHP.ts` and update imports

**Affected Files**:
- `frontend/src/context/AuthContext.tsx` - imports supabase directly
- `frontend/src/components/ui/AuthModal.tsx` - imports UserRole from supabase
- `frontend/src/services/authService.ts` - all auth logic uses supabase

### 2. ProductDetail Page
**File**: Check if it exists and which service it uses
**Status**: UNKNOWN
**Action**: Verify it uses productServicePHP

### 3. Supabase Library
**File**: `frontend/src/lib/supabase.ts`
**Status**: Still exists but not needed for XAMPP
**Action**: Can be removed or kept for backwards compatibility

---

## 📋 MIGRATION STEPS NEEDED

### Step 1: Create PHP Auth Service
```bash
CREATE FILE: frontend/src/services/authServicePHP.ts
```
- Login endpoint: `POST /backend/api/auth.php` (action=login)
- Register endpoint: `POST /backend/api/auth.php` (action=register)
- Logout endpoint: `POST /backend/api/auth.php` (action=logout)
- Get current user: `GET /backend/api/auth.php` (action=current-user)
- Update profile: `PUT /backend/api/auth.php` (action=update-profile)

### Step 2: Update AuthContext
```bash
EDIT: frontend/src/context/AuthContext.tsx
```
- Remove Supabase imports
- Use session storage/cookies instead of Supabase auth state
- Update auth state listener to use PHP sessions

### Step 3: Update AuthModal
```bash
EDIT: frontend/src/components/ui/AuthModal.tsx
```
- Change import from `lib/supabase` to `services/authServicePHP`
- Update UserRole type definition

### Step 4: Test All Pages
- [  ] Home page
- [  ] Products page
- [  ] Product Detail page
- [  ] Login/Register
- [  ] Sales Dashboard
- [  ] Sales Products (Add/Edit/Delete)
- [  ] Profile page
- [  ] Contact form

---

## 🔍 FILES TO CHECK

### High Priority
1. **frontend/src/services/authService.ts** - Main auth logic
2. **frontend/src/context/AuthContext.tsx** - Auth state management
3. **frontend/src/components/ui/AuthModal.tsx** - Login/Register UI
4. **frontend/src/pages/ProductDetail.tsx** - Product details page
5. **frontend/src/pages/Profile.tsx** - User profile page

### Medium Priority
6. **frontend/src/services/dashboardService.ts** - Sales dashboard data
7. **frontend/src/lib/supabase.ts** - Can be removed
8. **backend/api/auth.php** - Verify all endpoints work
9. **backend/api/products.php** - Verify CRUD operations

### Low Priority
10. **frontend/src/services/api.ts** - Base API config
11. **frontend/src/services/index.ts** - Service exports

---

## 🚀 TESTING CHECKLIST

### Backend API Testing
Visit these URLs in browser or Postman:
- [ ] http://localhost/FragranzaWeb/backend/api/products.php
- [ ] http://localhost/FragranzaWeb/backend/api/categories.php
- [ ] http://localhost/FragranzaWeb/backend/api/auth.php (should return error for GET)

### Database Verification
Run in phpMyAdmin:
```sql
SELECT COUNT(*) FROM users;         -- Should be 4
SELECT COUNT(*) FROM categories;    -- Should be 8  
SELECT COUNT(*) FROM products;      -- Should be 30
```

### Frontend Testing
1. Start dev server: `npm run dev`
2. Visit: http://localhost:3000
3. Test:
   - [ ] Products page loads (should be FAST now!)
   - [ ] Login with vendor0qw@gmail.com / Test@1234
   - [ ] Sales Products page shows products
   - [ ] Add Product modal works
   - [ ] Save product (test create)
   - [ ] Edit product (test update)

---

## 🐛 KNOWN ISSUES

1. **Auth still uses Supabase** - Login will fail
2. **ProductDetail might use old service** - Needs verification
3. **Dashboard service has no backend** - Uses mock data
4. **No session management yet** - Need to implement PHP sessions

---

## 📊 MIGRATION PROGRESS

```
Backend:   ████████████████████ 100%
Products:  ████████████████████ 100%
Auth:      ████░░░░░░░░░░░░░░░░  20%
Overall:   ████████████░░░░░░░░  65%
```

---

## 🎯 NEXT STEPS

1. **IMMEDIATE**: Create authServicePHP.ts
2. **IMMEDIATE**: Update AuthContext to use PHP auth
3. **SOON**: Test login/logout flow
4. **LATER**: Implement PHP session management
5. **LATER**: Remove Supabase dependencies

---

## 📝 NOTES

- Password in DB: All test users use `Test@1234` (bcrypt hashed)
- API Base URL: `http://localhost/FragranzaWeb/backend/api`
- XAMPP should be running (Apache + MySQL)
- Products now load instantly from local MySQL!
