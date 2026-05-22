# LiveShopping Backend Engine

The core backend infrastructure for **LiveShopping** — Pakistan's premium live-streaming e-commerce and real-time bidding platform for imported container lots and exclusive fashion brand leftovers. 

This repository handles user authentication, wallet management (token deposits), B2C/B2B inventory orchestration, and the high-performance, real-time WebSocket architecture required to process thousands of simultaneous bids per second with ultra-low latency.

---

## 🚀 Core Features

- **Real-Time Bidding Engine:** Powered by WebSockets (Socket.io) and memory-cached through Redis to guarantee sub-second bid state sync across all clients.
- **Live Stream Orchestration:** Direct integration with AWS IVS / Agora APIs to track live stream states, active items, and stream metrics.
- **Wallet & Anti-Fraud Token System:** A secure digital wallet system requiring a refundable token deposit (e.g., Rs. 500/1000) to authorize active bidding and eliminate fake bids.
- **B2C to B2B Architecture:** Robust database design optimized for high-volume consumer retail today, easily scalable to multi-vendor bulk container trading tomorrow.
- **Secure Payments Integration:** Unified API layer for popular Pakistani payment processors (Easypaisa, JazzCash, and direct Bank Transfers) for wallet top-ups.

---

## 🛠️ Tech Stack

- **Runtime Environment:** Node.js (v18+ LTS)
- **Framework:** Express.js (Asynchronous, event-driven architecture)
- **Primary Database:** PostgreSQL (Complex transactional integrity for users, orders, and products)
- **ORM:** Prisma or Sequelize
- **Caching & Event Broker:** Redis (For high-speed live bid trackers and session cache)
- **Real-Time Networking:** Socket.io (WebSockets)
- **Authentication:** JSON Web Tokens (JWT) with secure HTTP-only cookies

---

## 🗺️ Architectural Highlights

To handle flash traffic when top-tier brands (e.g., Bonanza Satrangi) go live, the server separates standard CRUD operations from transient live data:
1. **HTTP REST Endpoints:** Handles login, onboarding, wallet history, and catalogs.
2. **WebSocket Gateway:** Isolated connection channel exclusively handling the live chat stream, bid submission events, and global highest-bid countdown broadcast loops.

---

## 📂 Repository Structure

```text
├── config/             # Database, Redis, and AWS/Agora API configurations
├── src/
│   ├── controllers/    # Request handlers (Auth, Wallet, Inventory)
│   ├── middleware/     # Auth guards, role validation (User, Admin, B2B Vendor)
│   ├── models/         # PostgreSQL schema definition definitions
│   ├── routes/         # Express REST API route definitions
│   ├── services/       # Core business logic (Bidding handling, payment verifications)
│   ├── sockets/        # Socket.io event handlers (bid:submit, chat:message)
│   └── app.js          # Main application entry point & server setup
├── .env.example        # Environment variables template
└── README.md
```

---

## ⚙️ Quick Start & Setup

### 1. Prerequisites
Ensure you have the following installed on your local machine:
- Node.js (v18 or higher)
- PostgreSQL Server
- Redis Server

### 2. Clone and Install
```bash
git clone <your-repository-url>
cd liveshopping-backend
npm install
```

### 3. Environment Configuration
Create a `.env` file in the root directory and copy the contents of `.env.example`:
```bash
cp .env.example .env
```
Fill in your local database credentials, JWT secrets, and Redis connection strings.

### 4. Database Migrations
```bash
# Run database migrations to set up your tables
npm run db:migrate
```

### 5. Running the Application
```bash
# Start development server with hot-reloading
npm run dev

# Start production server
npm start
```

---

## 🔒 Security & Fraud Controls

- **Bid Throttling:** Strict rate-limiting per socket connection to avoid bot spamming.
- **Dynamic Lockout:** Automated wallet check ensuring the user's available token deposit balance is `>= Rs. 500` before authorizing the `bid:submit` event.
