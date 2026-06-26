# Sales & Inventory Tracker - MERN Stack

A lightweight, high-fidelity, and mobile-friendly web application for small businesses to track products, check out sales (with manual price adjustments), view analytics, and generate daily reports.

---

## 🛠️ Project Structure
```
sales-inventory-app/
├── server/                 # Express API backend
│   ├── models/             # Product and Sale schemas
│   ├── middleware/         # JWT verify token gatekeeper
│   ├── routes/             # REST endpoint routers (auth, products, sales, reports)
│   ├── .env                # Port, Database URI, and JWT Secret settings
│   ├── server.js           # Server initializer & DB seeder
│   └── package.json
└── client/                 # React frontend (Vite)
    ├── src/
    │   ├── components/     # Dashboard, Products CRUD, POS Checkout, History log, Reports
    │   ├── utils/          # Axios API wrapper (attaches JWT automatically)
    │   ├── App.jsx         # Router & Theme control (Light/Dark themes)
    │   ├── index.css       # Core layout styles & Print CSS variables
    │   └── main.jsx
    ├── index.html
    ├── package.json
    └── vite.config.js      # Runs Vite dev server on port 3000, proxies requests to port 5000
```

---

## 🚀 How to Run Locally

### Prerequisites
Make sure you have the following installed on your machine:
1. **Node.js** (v18 or higher recommended)
2. **MongoDB** (Local Community Edition running on `mongodb://localhost:27017` or a remote MongoDB Atlas URI)

---

### Step 1: Run the Backend Server
1. Open a terminal and navigate to the `server/` directory:
   ```bash
   cd server
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the development server:
   ```bash
   npm run dev
   ```
   *The server runs on **http://localhost:5000** and will automatically seed the database with starter items if empty.*

---

### Step 2: Run the Frontend App
1. Open a second terminal window/tab and navigate to the `client/` directory:
   ```bash
   cd client
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the Vite server:
   ```bash
   npm run dev
   ```
   *The app is served at **http://localhost:3000**.*

---

## 🔑 Login Credentials

The app uses a single shared authentication account for owner and employees.
- **Email:** `admin@business.com`
- **Password:** `password123`

*(These can be updated inside `/server/.env`)*

---

## 📦 Features Highlighted

1. **Dashboard**: Live counter cards for revenues and warnings. Includes a custom SVG revenue line chart representing a 7-day sales trend and list of active low-stock warnings.
2. **POS Sales module**: Multi-product item selection with custom quantity buttons, automatic price calculation, and an editable "Final Total Override" price field. Stock quantities are decremented by actual sold amounts regardless of overriding totals.
3. **Products CRUD**: List inventory. Highlight stock levels in red when counts fall below a specified threshold warning level. Form triggers inside modals.
4. **Sales History**: Track past sales, date-range and product filters, detailed receipt visual preview, and a **Refund** transaction action that restores original product stock levels.
5. **Daily Reports**: Daily financial metrics, detailed transaction table, export button for CSV (Excel) downloads, and a custom `@media print` style sheet tailored for paper/PDF layout exports.
