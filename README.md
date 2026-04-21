# ShopZone Angular Application

A premium, modern E-commerce web application built with Angular 16+ Standalone Architecture. Features a custom hand-coded glassmorphism design system, full Light/Dark mode support, and an end-to-end shopping experience.

## ✨ Features

- **Modern Architecture**: Built completely with Angular Standalone Components (`app.routes.ts`, `app.config.ts`) and uses reactive Angular Signals for state management.
- **Premium UI/UX**: Includes an ultra-premium dark theme, seamless light theme fallback, 3D card tilt effects, glassmorphism overlays, and smooth CSS animations.
- **Authentication**: Fully protected routes using traditional Angular `CanActivate` Guards and HTTP Interceptors for token/localStorage persistence.
- **Shopping Flow**: Real-time product filtering, a dedicated cart with quantity-driven subtotal calculation, checkout wizard, and an order history dashboard.
- **Performance Optimized**: Uses eager/lazy loading principles and native image lazy-loading to ensure the fastest possible rendering.

## 🚀 Getting Started

To run this project locally, you will need the Angular CLI and a mocked JSON Server backend.

### 1. Install Dependencies
```bash
npm install
```

### 2. Start the Mock Backend (JSON Server)
The application relies on `db.json` for managing users, products, carts, and orders.
```bash
npx json-server --watch db.json --port 3000
```

### 3. Start the Angular Application
Open a new terminal window and run the standard Angular development server:
```bash
npm start
```
Navigate to `http://localhost:4200/` to explore ShopZone.

## 📁 Core Directory Structure

- `/src/app/pages/` - Contains the main routed components (Login, Cart, Products, Orders, etc.)
- `/src/app/components/` - Shared UI logic (Navbar, Footer, Toast Notifications)
- `/src/app/services/` - Business logic using modern Angular Signals
- `/src/app/interceptors/` - Dedicated `auth.interceptor.ts` perfectly handling API authorization
- `/src/styles.css` - The global design system containing both Light and Dark mode variables.
