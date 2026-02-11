# Fragranza Olio - Website Development Plan

**Project:** Fragranza Olio Perfume & Cosmetics Trading Manufacturer  
**Document Version:** 1.0  
**Date Created:** January 29, 2026  
**Status:** Planning Phase

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Technology Stack](#technology-stack)
3. [Website Structure](#website-structure)
4. [Database Architecture](#database-architecture)
5. [Design Philosophy](#design-philosophy)
6. [Development Phases](#development-phases)
7. [Progress Tracking](#progress-tracking)

---

## Project Overview

### Business Description
Fragranza Olio is a perfume and cosmetics trading manufacturer requiring a professional e-commerce showcase website to display their product catalog.

### Project Goals
- Create a professional, minimalist e-commerce website
- Showcase products with dynamic content management
- Provide easy product updates via database integration
- Deliver smooth, elegant user experience
- Ensure mobile responsiveness and fast performance

### Key Requirements
- ✅ Minimalist, sleek design
- ✅ Professional UI with subtle animations
- ✅ E-commerce product showcase
- ✅ Dynamic product management (MySQL/XAMPP)
- ✅ Interchangeable images
- ✅ Scalable architecture

---

## Technology Stack

### Frontend (Client)

| Technology | Purpose |
|------------|---------|
| React 18+ | UI Framework |
| TypeScript | Type safety and scalability |
| Vite | Build tool and dev server |
| React Router DOM | Page navigation |
| Tailwind CSS | Utility-first styling |
| Shadcn/ui | Component library |
| Framer Motion | Animations |
| AOS | Scroll animations |
| Swiper | Product carousels |
| Axios | HTTP client |
| Lucide React | Icon library |

### Backend (Server)

| Technology | Purpose |
|------------|---------|
| PHP 8.x | Server-side logic |
| MySQL | Database |
| XAMPP | Local development server |
| RESTful API | Communication architecture |

### Development Tools

| Tool | Purpose |
|------|---------|
| VS Code | Code editor |
| XAMPP | Apache + MySQL server |
| Git | Version control |
| NPM | Package management |

---

## Website Structure

### Site Map

```
Fragranza Website
├── Home (Landing Page)
│   ├── Hero Section
│   ├── Featured Products
│   ├── Category Showcase
│   └── About Preview
│
├── Products (Catalog)
│   ├── Product Grid
│   ├── Category Filters
│   ├── Search
│   └── Sort Options
│
├── Product Detail
│   ├── Image Gallery
│   ├── Product Information
│   ├── Specifications
│   └── Related Products
│
├── About Us
│   ├── Company Story
│   ├── Manufacturing Process
│   └── Values & Mission
│
├── Services
│   ├── Trading Services
│   ├── Manufacturing
│   └── Custom Formulations
│
└── Contact
    ├── Contact Form
    ├── Business Info
    └── Location Map
```

### Project Folder Structure

```
FragranzaWeb/
│
├── documentation/           # Project documentation
│   └── PROJECT_PLAN.md
│
├── frontend/                # React application
│   ├── public/
│   │   └── favicon.ico
│   ├── src/
│   │   ├── components/      # Reusable components
│   │   │   ├── ui/          # Base UI components
│   │   │   ├── layout/      # Layout components
│   │   │   └── product/     # Product components
│   │   ├── pages/           # Page components
│   │   │   ├── Home.tsx
│   │   │   ├── Products.tsx
│   │   │   ├── ProductDetail.tsx
│   │   │   ├── About.tsx
│   │   │   ├── Services.tsx
│   │   │   └── Contact.tsx
│   │   ├── services/        # API service layer
│   │   ├── hooks/           # Custom React hooks
│   │   ├── types/           # TypeScript types
│   │   ├── styles/          # Global styles
│   │   ├── utils/           # Utility functions
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── index.html
│   ├── package.json
│   ├── tailwind.config.js
│   ├── tsconfig.json
│   └── vite.config.ts
│
├── backend/                 # PHP API
│   ├── api/
│   │   ├── products.php
│   │   ├── categories.php
│   │   ├── contact.php
│   │   └── upload.php
│   ├── config/
│   │   └── database.php
│   ├── models/
│   │   ├── Product.php
│   │   └── Category.php
│   ├── middleware/
│   │   └── cors.php
│   └── uploads/             # Product images
│       └── products/
│
├── database/
│   └── fragranza.sql        # Database schema
│
└── assets/
    └── images/
        └── Fragranza LOGO.png
```

---

## Database Architecture

### Entity Relationship Diagram

```
┌─────────────────┐       ┌─────────────────┐
│   categories    │       │    products     │
├─────────────────┤       ├─────────────────┤
│ id (PK)         │───┐   │ id (PK)         │
│ name            │   │   │ name            │
│ slug            │   │   │ description     │
│ description     │   └──►│ category_id(FK) │
│ image           │       │ price           │
│ created_at      │       │ image_main      │
└─────────────────┘       │ image_gallery   │
                          │ ingredients     │
                          │ stock_status    │
                          │ featured        │
                          │ created_at      │
                          └─────────────────┘
                                    
┌─────────────────────┐
│  contact_inquiries  │
├─────────────────────┤
│ id (PK)             │
│ name                │
│ email               │
│ phone               │
│ message             │
│ created_at          │
│ status              │
└─────────────────────┘
```

### Database Tables Schema

#### products
| Column | Type | Description |
|--------|------|-------------|
| id | INT AUTO_INCREMENT | Primary key |
| name | VARCHAR(255) | Product name |
| description | TEXT | Full description |
| category_id | INT | Foreign key to categories |
| price | DECIMAL(10,2) | Product price |
| image_main | VARCHAR(255) | Main image filename |
| image_gallery | JSON | Array of gallery images |
| ingredients | TEXT | Product ingredients |
| stock_status | ENUM | 'in_stock', 'out_of_stock', 'coming_soon' |
| featured | BOOLEAN | Featured on homepage |
| created_at | TIMESTAMP | Creation date |

#### categories
| Column | Type | Description |
|--------|------|-------------|
| id | INT AUTO_INCREMENT | Primary key |
| name | VARCHAR(100) | Category name |
| slug | VARCHAR(100) | URL-friendly name |
| description | TEXT | Category description |
| image | VARCHAR(255) | Category image |
| created_at | TIMESTAMP | Creation date |

#### contact_inquiries
| Column | Type | Description |
|--------|------|-------------|
| id | INT AUTO_INCREMENT | Primary key |
| name | VARCHAR(100) | Contact name |
| email | VARCHAR(100) | Email address |
| phone | VARCHAR(20) | Phone number |
| message | TEXT | Inquiry message |
| status | ENUM | 'new', 'read', 'replied' |
| created_at | TIMESTAMP | Submission date |

### API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/products | Get all products (with filters) |
| GET | /api/products/{id} | Get single product |
| POST | /api/products | Create product (admin) |
| PUT | /api/products/{id} | Update product (admin) |
| DELETE | /api/products/{id} | Delete product (admin) |
| GET | /api/categories | Get all categories |
| POST | /api/contact | Submit contact form |
| POST | /api/upload | Upload product images |

---

## Design Philosophy

### Visual Identity

**Color Palette:**
| Color | Hex Code | Usage |
|-------|----------|-------|
| Gold (Primary) | #D4AF37 | Accents, logo, CTAs |
| Gold Light | #F4D03F | Hover states |
| Black | #1A1A1A | Primary text |
| White | #FFFFFF | Backgrounds |
| Cream | #FAF8F5 | Secondary backgrounds |
| Gray Light | #F5F5F5 | Cards, borders |
| Gray | #6B7280 | Secondary text |

**Typography:**
- **Headings:** Playfair Display (Serif) - Luxury feel
- **Body:** Inter (Sans-serif) - Clean, readable
- **Accents:** Poppins (Sans-serif) - Modern

### Animation Guidelines

**Principles:**
- Subtle, not distracting
- Purpose-driven animations
- Consistent timing (300-500ms)
- 60fps performance maintained

**Animation Types:**
| Animation | Duration | Easing | Usage |
|-----------|----------|--------|-------|
| Fade In | 400ms | ease-out | Page elements on scroll |
| Hover Scale | 200ms | ease-in-out | Cards, buttons |
| Page Transition | 300ms | ease-in-out | Route changes |
| Parallax | Continuous | linear | Hero backgrounds |
| Skeleton Pulse | 1.5s | ease-in-out | Loading states |

### Component Design

**Product Cards:**
- Clean white background
- Subtle shadow on hover
- Image zoom on hover (1.05x)
- Minimal text (name, price)
- Quick view option

**Buttons:**
- Primary: Gold background, white text
- Secondary: White background, gold border
- Hover: Subtle scale (1.02x) + color shift

**Forms:**
- Clean, minimal borders
- Focus states with gold accent
- Inline validation feedback
- Smooth error animations

---

## Development Phases

### Phase 1: Foundation & Setup ⚙️
**Status:** 🔴 Not Started

**Objectives:**
- Initialize project infrastructure
- Set up development environment

**Tasks:**
- [ ] Initialize Vite + React + TypeScript project
- [ ] Configure Tailwind CSS and base styling
- [ ] Install core dependencies
- [ ] Set up project folder structure
- [ ] Create basic routing architecture
- [ ] Configure environment variables

**Deliverables:**
- Running development server
- Routing structure in place
- Base configuration files

---

### Phase 2: Database & Backend API 🗄️
**Status:** 🔴 Not Started

**Objectives:**
- Build data layer and REST API

**Tasks:**
- [ ] Create MySQL database schema
- [ ] Generate SQL initialization script
- [ ] Build PHP API endpoints (CRUD)
- [ ] Set up database connection config
- [ ] Implement CORS handling
- [ ] Create sample data seeds

**Deliverables:**
- MySQL database with tables
- Working PHP REST API
- Sample products in database

---

### Phase 3: Core UI Components 🎨
**Status:** 🔴 Not Started

**Objectives:**
- Build reusable component library

**Tasks:**
- [ ] Create Layout components (Header, Footer, Navigation)
- [ ] Build ProductCard component
- [ ] Create Button variants and inputs
- [ ] Build loading skeletons
- [ ] Create Modal/Dialog components
- [ ] Implement icon system
- [ ] Build form components with validation

**Deliverables:**
- Reusable component library
- Consistent design system
- TypeScript types for all components

---

### Phase 4: Homepage Implementation 🏠
**Status:** 🔴 Not Started

**Objectives:**
- Build engaging landing page

**Tasks:**
- [ ] Create hero section with logo and parallax
- [ ] Build featured products carousel
- [ ] Implement category showcase tiles
- [ ] Add smooth scroll animations
- [ ] Create "About Us" preview section
- [ ] Add call-to-action sections
- [ ] Integrate API calls for featured products

**Deliverables:**
- Fully functional homepage
- Dynamic content from database
- Mobile responsive design

**🔵 REVIEW CHECKPOINT #1**

---

### Phase 5: Products Catalog Page 🛍️
**Status:** 🔴 Not Started

**Objectives:**
- Build main product showcase

**Tasks:**
- [ ] Create product grid layout
- [ ] Implement category filtering
- [ ] Build search functionality
- [ ] Add sort options (price, name, newest)
- [ ] Create pagination or infinite scroll
- [ ] Add hover effects and animations
- [ ] Implement loading states
- [ ] Connect to products API

**Deliverables:**
- Filterable product catalog
- Search and sort functionality
- Responsive grid layout

---

### Phase 6: Product Detail Page 📦
**Status:** 🔴 Not Started

**Objectives:**
- Showcase individual products

**Tasks:**
- [ ] Create product detail layout
- [ ] Build image gallery with zoom
- [ ] Implement image carousel/slider
- [ ] Add product information tabs
- [ ] Create inquiry/contact button
- [ ] Add related products section
- [ ] Implement smooth transitions
- [ ] Connect to single product API

**Deliverables:**
- Detailed product page
- Interactive image gallery
- Related products display

---

### Phase 7: Additional Pages 📄
**Status:** 🔴 Not Started

**Objectives:**
- Complete website structure

**Tasks:**
- [ ] **About Us Page:**
  - [ ] Company story section
  - [ ] Manufacturing process
  - [ ] Values and mission
  - [ ] Timeline animation
- [ ] **Services Page:**
  - [ ] Trading services
  - [ ] Manufacturing capabilities
  - [ ] Custom formulations info
- [ ] **Contact Page:**
  - [ ] Contact form with validation
  - [ ] Business information
  - [ ] Location map (embedded)
  - [ ] Social media links

**Deliverables:**
- All pages implemented
- Forms working with API
- Consistent design across pages

**🔵 REVIEW CHECKPOINT #2**

---

### Phase 8: Animations & Micro-interactions ✨
**Status:** 🔴 Not Started

**Objectives:**
- Polish user experience

**Tasks:**
- [ ] Add scroll-triggered animations (AOS)
- [ ] Implement page transition effects
- [ ] Add hover micro-interactions
- [ ] Create loading animations
- [ ] Add smooth scroll behavior
- [ ] Implement parallax effects
- [ ] Polish button interactions
- [ ] Add skeleton loaders

**Deliverables:**
- Smooth, professional animations
- Enhanced user experience
- 60fps performance maintained

---

### Phase 9: Optimization & Polish ⚡
**Status:** 🔴 Not Started

**Objectives:**
- Ensure performance and quality

**Tasks:**
- [ ] Optimize images and assets
- [ ] Implement lazy loading
- [ ] Add error boundaries
- [ ] Improve SEO (meta tags, titles)
- [ ] Test cross-browser compatibility
- [ ] Mobile responsiveness final check
- [ ] Optimize bundle size
- [ ] Add loading states everywhere

**Deliverables:**
- Fast load times (<3s)
- Mobile-optimized
- Browser compatible
- SEO-ready

---

### Phase 10: Testing & Deployment 🚀
**Status:** 🔴 Not Started

**Objectives:**
- Prepare for production

**Tasks:**
- [ ] Test all API endpoints
- [ ] Test all forms and interactions
- [ ] Verify database connections
- [ ] Build production bundles
- [ ] Create deployment documentation
- [ ] Set up XAMPP configuration guide
- [ ] Final review and bug fixes
- [ ] Create README with setup instructions

**Deliverables:**
- Production-ready code
- Deployment documentation
- Setup instructions

**🔵 FINAL REVIEW CHECKPOINT #3**

---

## Progress Tracking

### Phase Status Legend

| Symbol | Status |
|--------|--------|
| 🔴 | Not Started |
| 🟡 | In Progress |
| 🟢 | Completed |
| 🔵 | Under Review |

### Current Progress

| Phase | Name | Status | Progress |
|-------|------|--------|----------|
| 1 | Foundation & Setup | 🔴 | 0% |
| 2 | Database & Backend | 🔴 | 0% |
| 3 | Core UI Components | 🔴 | 0% |
| 4 | Homepage | 🔴 | 0% |
| 5 | Products Catalog | 🔴 | 0% |
| 6 | Product Detail | 🔴 | 0% |
| 7 | Additional Pages | 🔴 | 0% |
| 8 | Animations | 🔴 | 0% |
| 9 | Optimization | 🔴 | 0% |
| 10 | Testing & Deploy | 🔴 | 0% |

**Overall Progress:** 0%

---

## Notes & Decisions

### Decisions Log
| Date | Decision | Rationale |
|------|----------|-----------|
| Jan 29, 2026 | React + TypeScript + Vite | Modern, fast, type-safe development |
| Jan 29, 2026 | Tailwind CSS | Rapid styling, minimalist design |
| Jan 29, 2026 | XAMPP + MySQL | Easy local development, client preference |
| Jan 29, 2026 | PHP REST API | Compatible with XAMPP, simple deployment |

### Open Questions
- [ ] Product categories to include?
- [ ] Number of initial products to seed?
- [ ] Specific color preferences beyond gold?
- [ ] Social media links to include?
- [ ] Map location details?

---

## Appendix

### Development Commands

```bash
# Frontend
cd frontend
npm install          # Install dependencies
npm run dev          # Start dev server
npm run build        # Production build
npm run preview      # Preview production build

# Database
# Import fragranza.sql via phpMyAdmin or MySQL CLI

# Backend
# Place in XAMPP htdocs folder
# Access at: http://localhost/fragranza/backend/api/
```

### Environment Variables

```env
# Frontend (.env)
VITE_API_BASE_URL=http://localhost/fragranza/backend/api

# Backend (config/database.php)
DB_HOST=localhost
DB_NAME=fragranza
DB_USER=root
DB_PASS=
```

---

**Document maintained by:** Development Team  
**Last Updated:** January 29, 2026
