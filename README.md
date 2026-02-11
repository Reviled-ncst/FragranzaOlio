# Fragranza Olio Website

Premium Perfume and Cosmetics Trading Manufacturer Website

## 🚀 Quick Start

### Prerequisites

- **Node.js** (v18 or higher) - [Download](https://nodejs.org/)
- **XAMPP** (for PHP & MySQL) - [Download](https://www.apachefriends.org/)

### Installation

#### 1. Clone/Setup the Project

```bash
cd FragranzaWeb
```

#### 2. Frontend Setup

```bash
cd frontend
npm install
```

#### 3. Backend Setup

1. **Start XAMPP** and ensure Apache and MySQL are running
2. **Copy backend folder** to XAMPP htdocs:
   ```
   Copy the entire 'backend' folder to: C:\xampp\htdocs\fragranza\
   ```
   Or create a symbolic link:
   ```bash
   mklink /D "C:\xampp\htdocs\fragranza\backend" "C:\Users\User\Documents\Projects\FragranzaWeb\backend"
   ```

#### 4. Database Setup

1. Open **phpMyAdmin** (http://localhost/phpmyadmin)
2. Create a new database named `fragranza_db`
3. Import the SQL file:
   - Click on `fragranza_db` database
   - Go to "Import" tab
   - Select file: `database/fragranza.sql`
   - Click "Go"

#### 5. Run the Development Server

```bash
cd frontend
npm run dev
```

The site will be available at: **http://localhost:3000**

## 📁 Project Structure

```
FragranzaWeb/
├── frontend/              # React + TypeScript + Vite
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   ├── pages/         # Page components
│   │   ├── services/      # API service layer
│   │   └── App.tsx        # Main application
│   └── public/            # Static assets
│
├── backend/               # PHP REST API
│   ├── api/               # API endpoints
│   ├── config/            # Database configuration
│   ├── middleware/        # CORS handling
│   └── uploads/           # Uploaded files
│
├── database/              # SQL schema and seeds
│   └── fragranza.sql
│
├── documentation/         # Project documentation
│   └── PROJECT_PLAN.md
│
└── assets/                # Brand assets
    └── images/
```

## 🛠 Tech Stack

### Frontend
- React 18
- TypeScript
- Vite
- Tailwind CSS
- Framer Motion
- React Router DOM
- Axios
- Swiper
- Lucide Icons

### Backend
- PHP 8.x
- MySQL
- RESTful API

## 📡 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/products.php | Get all products |
| GET | /api/products.php?id={id} | Get single product |
| POST | /api/products.php | Create product |
| PUT | /api/products.php | Update product |
| DELETE | /api/products.php?id={id} | Delete product |
| GET | /api/categories.php | Get all categories |
| POST | /api/contact.php | Submit contact form |
| POST | /api/newsletter.php | Subscribe to newsletter |
| POST | /api/upload.php | Upload image |

## 🎨 Design System

### Colors
- **Gold Primary**: #D4AF37
- **Charcoal**: #1A1A1A
- **Cream**: #FAF8F5

### Fonts
- **Display**: Playfair Display (headings)
- **Body**: Inter (body text)
- **Accent**: Poppins (buttons, labels)

## 📝 Available Scripts

### Frontend

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run preview  # Preview production build
npm run lint     # Run ESLint
```

## 🔧 Environment Variables

Create a `.env` file in the frontend folder:

```env
VITE_API_BASE_URL=http://localhost/fragranza/backend/api
```

## 📄 License

© 2026 Fragranza Olio. All rights reserved.
