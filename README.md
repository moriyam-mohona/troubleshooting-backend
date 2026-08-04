# Troubleshooting Backend API

Production-grade RESTful API built with **Express 5 + TypeScript + Prisma (MongoDB) + Redis**.  
Powers the **Troubleshooting Platform**, an interactive diagnostic system enabling users to step through decision trees (Yes/No troubleshooting nodes), track session progress, submit custom questions with screenshot uploads, raise support tickets, and view analytics.

---

## Table of Contents

- [Project Overview](#project-overview)
- [Key Features](#key-features)
- [Tech Stack](#tech-stack)
- [Architecture & Directory Structure](#architecture--directory-structure)
- [Interactive Decision Tree Engine](#interactive-decision-tree-engine)
  - [Auth Module (`/api/v1/auth`)](#1-auth-module-apiv1auth)
  - [User Management (`/api/v1/users`)](#2-user-management-apiv1users)
  - [Category Module (`/api/v1/categories`)](#3-category-module-apiv1categories)
  - [Subcategory Module (`/api/v1/subcategories`)](#4-subcategory-module-apiv1subcategories)
  - [Decision Tree Engine (`/api/v1/decision-tree`)](#5-decision-tree-engine-apiv1decision-tree)
  - [User Questions (`/api/v1/user-questions`)](#6-user-questions-apiv1user-questions)
  - [Support Tickets (`/api/v1/support`)](#7-support-tickets-apiv1support)
  - [Dashboard & Analytics (`/api/v1/dashboard`)](#8-dashboard--analytics-apiv1dashboard)
- [Database Schema & Prisma Models](#database-schema--prisma-models)
- [Request / Response Format](#request--response-format)
- [Environment Variables](#environment-variables)
- [Quick Start Guide](#quick-start-guide)
  - [Prerequisites](#1-prerequisites)
  - [Local Setup](#2-local-setup)
  - [Docker Setup](#3-docker-setup)
- [CLI Module Scaffold Generator](#cli-module-scaffold-generator)
- [Security Features](#security-features)
- [Logging System](#logging-system)
- [Production Deployment Checklist](#production-deployment-checklist)

---

## Project Overview

Backend API provides a complete backend infrastructure for hardware/software troubleshooting platforms:
- **Interactive Decision Trees**: Categorized diagnostic flows where users answer binary (YES/NO) questions leading either to follow-up questions or actionable recommended fixes.
- **Troubleshooting Sessions**: State-persisted sessions capturing user progress step-by-step, full choice history (`historyPath`), and resolution status (`IN_PROGRESS`, `SOLVED`).
- **Unassisted Custom Assistance**: When decision trees do not resolve an issue, users can submit custom questions attached with uploaded screenshots (`Multer` + `Sharp`). Admins review and reply directly.
- **Support System**: Direct contact messaging for general support inquiries.
- **Admin Management & Dashboard**: Category management, decision tree builder APIs, draft/publish status toggles, user status management, and dashboard activity metrics.

---

## Key Features

- ✅ **Express 5 & TypeScript Architecture**: Strictly typed, modular feature-layer codebase.
- ✅ **JWT Authentication & Token Revocation**: Short-lived Access Tokens, Refresh Token rotation in DB, and instant logout token blacklisting via **Redis**.
- ✅ **Role-Based Authorization**: Fine-grained access control (`USER`, `SUPER_ADMIN`).
- ✅ **OTP Email Flow**: 6-digit OTP codes via Nodemailer for account verification and two-step password reset.
- ✅ **Decision Tree Engine**: Dynamic graph traversal with session persistence and history logging.
- ✅ **Image Upload Processing**: Integrated file upload pipeline with MIME type checking, extension validation (`JPEG`, `PNG`, `WEBP`), and optimized buffer storage via `Sharp`.
- ✅ **Swagger / OpenAPI Documentation**: Pre-configured interactive documentation interface at `/api/docs` (available in non-production).
- ✅ **Winston Logging**: Structured log files with daily rotation for operational info and errors.
- ✅ **CLI Scaffold Tool**: Generator script to instantly bootstrap new modular routes, controllers, services, and schemas.
- ✅ **Container Readiness**: Multi-stage `Dockerfile` and `docker-compose.yml` bundling API server, MongoDB 7, and Redis 7.

---

## Tech Stack

- **Runtime Environment:** Node.js (v20+ recommended)
- **Web Framework:** Express 5
- **Programming Language:** TypeScript 5.9
- **Database & ORM:** MongoDB + Prisma ORM 6.19
- **In-Memory Cache & Session Blacklist:** Redis (`ioredis` 5.10)
- **Authentication & Security:** JWT (`jsonwebtoken`), Bcryptjs, Helmet, HPP, Express Rate Limit
- **Validation Engine:** Zod 4.3
- **File Upload & Image Processing:** Multer 2.0 + Sharp 0.34
- **Mail Service:** Nodemailer 7.0
- **API Documentation:** Swagger UI Express 5.0 + Swagger JSDoc 6.2
- **Logging:** Winston 3.19 + Winston Daily Rotate File 5.0
- **Containerization:** Docker & Docker Compose

---

## Architecture & Directory Structure

This project follows a **Feature Module Architecture**. Each domain entity resides within its own folder containing interfaces, schemas, services, controllers, and routes.

```text
d:/pocotech26-backend/
├── prisma/
│   └── schema.prisma         # Prisma schema definition for MongoDB
├── scripts/
│   └── create-module.js      # CLI module scaffolding generator script
├── src/
│   ├── app/
│   │   ├── db/               # Database seeder (seed.ts)
│   │   ├── helpers/          # File uploader and helper functions
│   │   ├── middlewares/      # Auth, Rate limiting, Validation, Error handler
│   │   ├── modules/          # Feature Modules
│   │   │   ├── Auth/         # Authentication & OTP verification
│   │   │   ├── Category/     # Troubleshooting categories
│   │   │   ├── Dashboard/    # Admin metrics & analytics
│   │   │   ├── DecisionTree/ # Diagnostic tree engine & session traversal
│   │   │   ├── Subcategory/  # Subcategory management
│   │   │   ├── Support/      # Support messaging tickets
│   │   │   ├── User/         # Profile & user management
│   │   │   └── UserQuestion/ # Custom user troubleshooting inquiries
│   │   └── routes/           # Central API router registry
│   ├── config/               # Environment variable configuration loader
│   ├── errors/               # Custom ApiError class & handler wrappers
│   ├── interfaces/           # Global TypeScript interface definitions
│   ├── lib/                  # Database connections (Prisma, Redis) & Swagger setup
│   ├── shared/               # Shared utilities (catchAsync, sendResponse, email templates)
│   ├── utils/                # Logger instance & utility helpers
│   ├── app.ts                # Express application configuration
│   └── server.ts             # Application entry point & process listeners
├── Dockerfile                # Multi-stage production container setup
├── docker-compose.yml        # Services definition (app, mongo, redis)
├── .env.example              # Sample environment variables
└── package.json              # Dependencies and NPM scripts
```

**Request Lifecycle:**
```text
Client Request
  └── Middleware (Helmet -> CORS -> Rate Limiter -> Auth -> Validation)
       └── Route Handler
            └── Controller Layer (catchAsync)
                 └── Service Layer (Business Logic)
                      └── Database / Cache Layer (Prisma MongoDB / Redis)
                           └── Response Helper (sendResponse JSON)
```

---

## Interactive Decision Tree Engine

The core domain feature of is its interactive troubleshooting engine:

```text
               [ SubCategory ]
                      │
               (firstQuestion)
                      │
                      ▼
               ┌──────────────┐
               │   Question   │
               └──────┬───────┘
                      │
         ┌────────────┴────────────┐
         │ YES                     │ NO
         ▼                         ▼
  ┌──────────────┐          ┌──────────────┐
  │ Route: Next  │          │ Route: Next  │
  │ Question OR  │          │ Question OR  │
  │ Answer Fix   │          │ Answer Fix   │
  └──────────────┘          └──────────────┘
```

1. **Graph Setup (Admin)**: An admin builds a troubleshooting flow per subcategory consisting of `Question`, `QuestionRoute` (option: `YES` / `NO`), and `Answer` (fields: `whatsHappening` & `recommendedFix`).
2. **Session Initialization (`POST /session/start`)**: Creates a `UserTreeSession` starting at `firstQuestionId`.
3. **Step Traversal (`POST /traverse`)**: Accepts user response (`YES` or `NO`) for current question:
   - Appends current step choice to `historyPath`.
   - If next route points to a `Question`, advances `currentQuestionId` and increments `currentStep`.
   - If next route points to an `Answer`, sets `finalAnswerId`, returns the resolution, and updates status to `SOLVED`.
4. **Resolution (`POST /session/resolve`)**: Allows users to manually mark a session as solved at any stage.
---

## Database Schema & Prisma Models

The database schema (`prisma/schema.prisma`) uses MongoDB with the following core entities:

- **User**: User accounts (`email`, `password`, `role`: `USER` / `SUPER_ADMIN`, `status`: `ACTIVE` / `BLOCKED`, `isEmailVerified`).
- **OtpToken**: 6-digit OTP records (`purpose`: `EMAIL_VERIFICATION` / `PASSWORD_RESET`, `expiresAt`, `used`).
- **RefreshToken**: Active refresh tokens linked to users.
- **Category**: Top-level troubleshooting categories (`title`, `subtitle`, `isSystem`).
- **SubCategory**: Subcategories belonging to a Category (`firstQuestionId`, `isDraft`).
- **Question**: Diagnostic question node belonging to a SubCategory.
- **Answer**: Outcome solution node (`whatsHappening`, `recommendedFix`).
- **QuestionRoute**: Directed edges linking a `Question` via `YES`/`NO` to either another `Question` or an `Answer`.
- **UserQuestion**: Custom user submitted queries (`description`, `image`, `status`: `PENDING` / `ANSWERED`, `adminReply`).
- **Support**: General inquiry support tickets (`name`, `email`, `subject`, `message`, `status`: `PENDING` / `RESOLVED`).
- **UserTreeSession**: User diagnostic session tracking (`currentStep`, `status`: `IN_PROGRESS` / `SOLVED`, `historyPath` JSON snapshot).

---

## Request / Response Format

### Success Response Format
```json
{
  "statusCode": 200,
  "success": true,
  "message": "Operation completed successfully.",
  "data": {}
}
```

### Error Response Format
```json
{
  "statusCode": 400,
  "success": false,
  "message": "Validation Error",
  "errorMessages": [
    {
      "path": "email",
      "message": "Invalid email address."
    }
  ]
}
```

---

## Environment Variables

Copy `.env.example` to `.env` in the root directory and configure:

| Variable | Required | Default | Description |
| :--- | :--- | :--- | :--- |
| `NODE_ENV` | No | `development` | Environment mode (`development` / `production`) |
| `PORT` | No | `8000` | HTTP server listening port |
| `HOST` | No | `0.0.0.0` | Bind host address |
| `APP_NAME` | No | `Backend` | Display application title |
| `APP_VERSION` | No | `1.0.0` | Application version string |
| `DATABASE_URL` | **Yes** | — | MongoDB connection string URI |
| `JWT_SECRET` | **Yes** | — | Secret string for signing Access Tokens |
| `JWT_REFRESH_SECRET` | **Yes** | — | Secret string for signing Refresh Tokens |
| `JWT_EXPIRES_IN` | No | `15m` | Access token lifespan (e.g. `15m`, `1d`) |
| `JWT_REFRESH_EXPIRES_IN` | No | `7d` | Refresh token lifespan (e.g. `7d`) |
| `REDIS_HOST` | No | `127.0.0.1` | Redis instance host |
| `REDIS_PORT` | No | `6379` | Redis instance port |
| `REDIS_PASSWORD` | No | empty | Redis connection password |
| `EMAIL_SENDER_EMAIL` | No | empty | Gmail/SMTP sender address |
| `EMAIL_SENDER_APP_PASS` | No | empty | App password for SMTP sender |
| `PASSWORD_SALT` | No | `12` | Bcrypt password hashing salt rounds |
| `CORS_ORIGIN` | No | `*` | Allowed CORS origins |
| `RATE_LIMIT_MAX` | No | `100` | Max requests per rate-limit window |
| `RATE_LIMIT_AUTH_MAX` | No | `10` | Max auth requests per window |

---

## Quick Start Guide

### 1. Prerequisites

- **Node.js**: v20+ installed
- **MongoDB**: Active local instance or MongoDB Atlas cluster URL
- **Redis**: Running local Redis server or Redis cloud instance
- **npm** package manager

### 2. Local Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure environment:**
   ```bash
   cp .env.example .env
   # Edit .env and supply DATABASE_URL, JWT_SECRET, and JWT_REFRESH_SECRET
   ```

3. **Generate Prisma Client & Sync Database:**
   ```bash
   npm run gen
   npm run push
   ```

4. **(Optional) Seed Default Seed Accounts:**
   ```bash
   npm run prisma:seed
   ```
   *Seeded default credentials:*
   - Super Admin: `superadmin@example.com` / `SuperAdmin@123`
   - Admin: `admin@example.com` / `Admin@123`
   - User: `user@example.com` / `User@123`

5. **Start Development Server:**
   ```bash
   npm run dev
   ```
   - API Root: `http://localhost:8000/`
   - Health Endpoint: `http://localhost:8000/api/v1/health`
   - Interactive Swagger Docs: `http://localhost:8000/api/docs`

### 3. Docker Setup

Build and run the entire stack (API, MongoDB 7, Redis 7) in isolated containers:

```bash
# 1. Create environment configuration
cp .env.example .env

# 2. Build and launch services in background
docker compose up --build -d

# 3. View running container status
docker compose ps

# 4. Stream application container logs
docker compose logs -f app

# 5. Shutdown services
docker compose down
```

---

## CLI Module Scaffold Generator

This repository includes an automated code generator to quickly scaffold new feature modules following the project's layered architecture:

```bash
# Scaffold a new module (Interface, Validation, Service, Controller, Route + Auto-register in routes/index.ts)
npm run module:create -- Diagnostic

# Scaffold without auto-registering route
npm run module:create:no-route -- Ticket

# Force overwrite existing module files
npm run module:create -- Diagnostic --force
```

Generates:
1. `src/app/modules/Diagnostic/diagnostic.interface.ts`
2. `src/app/modules/Diagnostic/diagnostic.validation.ts`
3. `src/app/modules/Diagnostic/diagnostic.service.ts`
4. `src/app/modules/Diagnostic/diagnostic.controller.ts`
5. `src/app/modules/Diagnostic/diagnostic.route.ts`
6. Automatically mounts `/api/v1/diagnostic` route in `src/app/routes/index.ts`

---

## Security Features

- **HTTP Headers Security**: Hardened HTTP headers using `Helmet`.
- **Cross-Origin Resource Sharing (CORS)**: Configurable origin controls.
- **HTTP Parameter Pollution (HPP)**: Protection against parameter pollution attacks.
- **Rate Limiting**: Tiered limiters protecting auth endpoints from brute-force attempts.
- **Token Invalidation**: Instant logout using Redis token revocation storage.
- **Input Sanitization & Validation**: Request payload filtering using strict Zod schemas.

---

## Logging System

Application runtime logs are formatted by `Winston` and persisted under the `logs/` directory with automatic daily rotation:

- `logs/info-YYYY-MM-DD.log`: Information level logs
- `logs/error-YYYY-MM-DD.log`: Stack traces and runtime error details

---

## Production Deployment Checklist

- [ ] Set `NODE_ENV=production` in environment variables.
- [ ] Specify strong, unpredictable values for `JWT_SECRET` and `JWT_REFRESH_SECRET`.
- [ ] Configure `CORS_ORIGIN` with exact production domain origins.
- [ ] Use SSL/TLS termination at load balancer or reverse proxy (Nginx/Cloudflare).
- [ ] Utilize managed MongoDB (Atlas) and Redis cluster instances with auth credentials.
- [ ] Verify Nodemailer SMTP settings for OTP delivery.
- [ ] Build the TypeScript application using `npm run build` and run production start script `npm run start`.
