# ShopNova API

A modern, full-featured e-commerce backend API built with NestJS, featuring comprehensive authentication, role-based authorization, payment processing, real-time notifications, and advanced async task processing.

## 🚀 Overview

ShopNova API is a production-ready e-commerce platform backend that demonstrates industry best practices and modern architectural patterns. The system provides complete user and admin functionality with robust security, scalability, and maintainability at its core.

### Key Features

- **Advanced Authentication & Authorization**
  - JWT-based authentication with Passport strategies
  - **Google OAuth 2.0 integration** for social login
  - Role-based access control (USER & ADMIN)
  - Custom OTP verification system for email and phone
  - Password reset flow with secure token management
  - Protected routes with custom guards
  - Session management with automatic token refresh

- **Payment Processing**
  - **Stripe integration** for secure card payments
  - Payment intent creation and confirmation
  - Order-payment linking with transaction IDs
  - Support for multiple payment methods (Card, Cash on Delivery)
  - Secure payment flow with client-side confirmation

- **User Management**
  - Complete profile management with image upload
  - Multiple address support with default selection
  - Password change functionality
  - Email and phone verification
  - User preferences and settings
  - Google account linking

- **Product & Catalog Management**
  - Full CRUD operations for products
  - Category-based organization
  - Product search and filtering
  - Inventory management with stock tracking
  - Multi-image support with file upload
  - Product variants and pricing

- **Shopping Cart & Orders**
  - Real-time cart operations
  - Order creation with payment integration
  - Order status management (PENDING, PROCESSING, SHIPPED, DELIVERED, CANCELLED)
  - Order history and details
  - Cart total calculations
  - Shipping address management

- **Notification System**
  - Email notifications via Nodemailer
  - In-app notification center
  - Async email processing with BullMQ
  - Customizable notification templates
  - Unread notification tracking
  - Order status update notifications

- **Admin Panel**
  - Dashboard with analytics and charts
  - User management with role assignment
  - Product and category management
  - Order oversight and status updates
  - Real-time statistics

- **Background Processing**
  - BullMQ integration for async tasks
  - Email queue management
  - Scheduled tasks with cron jobs
  - Task monitoring and error handling

## 🛠️ Technology Stack

### Core Framework
- **NestJS 11+** - Progressive Node.js framework
- **TypeScript 5.7+** - Type-safe JavaScript
- **Node.js** - Runtime environment

### Database & ORM
- **Prisma 6.19** - Next-generation ORM
- **MySQL** - Relational database
- **Prisma Client** - Auto-generated type-safe database client

### Authentication & Security
- **Passport.js** - Authentication middleware
- **JWT (JSON Web Tokens)** - Secure token-based auth
- **passport-google-oauth20** - Google OAuth strategy
- **bcryptjs** - Password hashing
- **passport-jwt** - JWT strategy for Passport
- **passport-local** - Local strategy for Passport

### Payment Processing
- **Stripe** - Payment processing platform
- **stripe (Node.js SDK)** - Official Stripe SDK
- Payment intent API for secure transactions

### Queue & Background Jobs
- **BullMQ 5.x** - Redis-based queue system
- **Redis** - In-memory data store for queues
- **@nestjs/schedule** - Cron job scheduling

### Email & Notifications
- **Nodemailer 7.x** - Email sending
- **Handlebars** - Email template engine
- **@nestjs-modules/mailer** - NestJS mailer integration

### File Upload & Storage
- **Multer** - File upload middleware
- **@nestjs/platform-express** - Express platform adapter
- Local file storage with configurable paths

### Validation & Transformation
- **class-validator** - Decorator-based validation
- **class-transformer** - Object transformation
- **DTOs (Data Transfer Objects)** - Type-safe data validation

### Development Tools
- **ESLint** - Code linting
- **Prettier** - Code formatting
- **TypeScript ESLint** - TypeScript-specific linting rules

### Testing
- **Jest** - Testing framework
- **Supertest** - HTTP assertion library
- **ts-jest** - TypeScript support for Jest

## 📁 Project Structure

```
shopnova-api/
├── prisma/
│   ├── schema.prisma          # Database schema
│   └── prisma.config.ts       # Prisma configuration
├── src/
│   ├── admin/                 # Admin panel module
│   ├── auth/                  # Authentication & authorization
│   │   ├── dto/              # Auth DTOs
│   │   ├── guards/           # Auth guards
│   │   └── strategies/       # Passport strategies (JWT, Local, Google)
│   ├── cart/                  # Shopping cart module
│   ├── common/                # Shared utilities
│   │   ├── decorators/       # Custom decorators
│   │   └── guards/           # Common guards
│   ├── notifications/         # Notification system
│   ├── orders/                # Order management
│   ├── payment/               # Payment processing (Stripe)
│   ├── prisma/                # Prisma service
│   ├── products/              # Product & category management
│   ├── scheduling/            # Cron jobs & scheduled tasks
│   ├── users/                 # User management
│   ├── app.module.ts          # Root module
│   └── main.ts                # Application entry point
├── uploads/                   # File upload directory
├── test/                      # E2E tests
└── package.json
```

## 🔄 Application Flow

### User Registration & Authentication Flow

1. **Traditional Registration**
   - User submits registration data
   - Password is hashed using bcrypt
   - OTP is generated and sent via email
   - User record created with `isVerified: false`

2. **Google OAuth Registration/Login**
   - User clicks "Sign in with Google"
   - Redirected to Google OAuth consent screen
   - Google returns user profile data
   - System creates/updates user account
   - JWT token generated and returned
   - User redirected to dashboard

3. **Email Verification**
   - User receives OTP via email (async via BullMQ)
   - User submits OTP for verification
   - Account is activated upon successful verification

4. **Login**
   - User submits credentials (email/password or Google)
   - Strategy validates credentials
   - JWT access token is generated and returned
   - Token includes user ID and role

5. **Protected Routes**
   - JWT token validated on each request
   - Role-based guards check user permissions
   - Custom decorators extract user data

### Shopping & Payment Flow

1. **Browse Products**
   - Users view products and categories
   - Search and filter capabilities
   - Product details with images

2. **Cart Management**
   - Add products to cart
   - Update quantities
   - Remove items
   - View cart total

3. **Checkout Process**
   - Select shipping address
   - Choose payment method (Card or Cash on Delivery)
   - For card payments:
     - Create Stripe payment intent
     - Collect card details securely
     - Confirm payment with Stripe
     - Link payment to order

4. **Order Placement**
   - Convert cart to order
   - Save payment details (method, transaction ID)
   - Order confirmation email sent
   - Cart is cleared
   - Order status tracking begins

5. **Order Tracking**
   - Users view order history
   - Real-time status updates
   - Email notifications on status changes

### Admin Workflow

1. **Dashboard**
   - View system statistics
   - Monitor recent orders
   - User activity overview
   - Revenue analytics

2. **Product Management**
   - Create/update/delete products
   - Upload product images
   - Manage categories
   - Update inventory

3. **Order Management**
   - View all orders
   - Update order status
   - Process fulfillment
   - Track payments

4. **User Management**
   - View user list
   - Update user roles
   - Manage user accounts

### Notification System Flow

1. **Event Triggered**
   - System events (registration, orders, status changes)
   - Email job added to BullMQ queue

2. **Queue Processing**
   - BullMQ workers process email jobs
   - Emails sent via Nodemailer
   - In-app notifications created in database

3. **User Notification Center**
   - Users view in-app notifications
   - Mark as read functionality
   - Unread count tracking

## 🔐 Security Features

- **Password Security**: Bcrypt hashing with salt rounds
- **JWT Tokens**: Secure token-based authentication
- **OAuth 2.0**: Secure Google authentication
- **Role-Based Access Control**: Guards enforce permissions
- **OTP Verification**: Time-limited one-time passwords
- **Input Validation**: class-validator on all inputs
- **SQL Injection Protection**: Prisma parameterized queries
- **Environment Variables**: Sensitive data in .env
- **PCI Compliance**: Stripe handles sensitive payment data
- **HTTPS**: Secure data transmission (production)

## 🎯 Advanced Patterns & Best Practices

### NestJS Patterns Implemented

- **Modules**: Feature-based module organization
- **Guards**: Authentication and authorization guards
- **Interceptors**: Response transformation and logging
- **Pipes**: Validation and transformation pipes
- **Decorators**: Custom parameter decorators
- **Exception Filters**: Centralized error handling
- **Dependency Injection**: Constructor-based DI throughout

### Code Quality

- **TypeScript Strict Mode**: Enhanced type safety
- **ESLint Configuration**: Consistent code style
- **DTOs**: Type-safe data validation
- **Interface Segregation**: Clean service boundaries
- **Single Responsibility**: Focused, maintainable modules

## 📦 Installation

```bash
# Install dependencies
npm install

# Setup environment variables
cp .env.example .env

# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma db push

# Seed database (optional)
npx prisma db seed
```

## 🚀 Running the Application

```bash
# Development mode
npm run start:dev

# Production mode
npm run build
npm run start:prod

# Debug mode
npm run start:debug
```

## 🧪 Testing

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Test coverage
npm run test:cov

# Watch mode
npm run test:watch
```

## 📝 API Documentation

Once running, access Swagger documentation at:
```
http://localhost:3000/api/docs
```

## 🌐 Environment Variables

```env
# Database
DATABASE_URL="mysql://user:password@localhost:3306/shopnova_db"

# JWT
JWT_SECRET="your-secret-key"
JWT_EXPIRES_IN="7d"

# Google OAuth
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
GOOGLE_CALLBACK_URL="http://localhost:3000/auth/google/callback"
FRONTEND_URL="http://localhost:8080"

# Stripe
STRIPE_SECRET_KEY="sk_test_your_stripe_secret_key"
STRIPE_PUBLISHABLE_KEY="pk_test_your_stripe_publishable_key"

# Email
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"
SMTP_FROM="noreply@shopnova.com"

# Redis
REDIS_HOST="localhost"
REDIS_PORT=6379

# Application
PORT=3000
NODE_ENV="development"
```

## 🔧 Available Scripts

| Script | Description |
|--------|-------------|
| `npm run start` | Start the application |
| `npm run start:dev` | Start in watch mode |
| `npm run start:prod` | Start production build |
| `npm run build` | Build the application |
| `npm run lint` | Lint and fix code |
| `npm run format` | Format code with Prettier |
| `npm run test` | Run unit tests |
| `npm run test:e2e` | Run end-to-end tests |

## 📚 Learning Outcomes

This project demonstrates:

- **Enterprise Architecture**: Scalable, maintainable code structure
- **Authentication Patterns**: Modern auth with JWT, Passport, and OAuth
- **Payment Integration**: Secure payment processing with Stripe
- **Queue Management**: Async processing with BullMQ
- **Database Design**: Relational modeling with Prisma
- **API Design**: RESTful endpoints with proper HTTP methods
- **Error Handling**: Comprehensive exception management
- **Testing Strategies**: Unit and E2E test coverage
- **Security Best Practices**: Industry-standard security measures
- **TypeScript Mastery**: Advanced type system usage
- **Third-party Integration**: OAuth and payment gateway integration

## 🤝 Contributing

Contributions are welcome! Please follow the existing code style and patterns.

## 📄 License

This project is licensed under the UNLICENSED license.

## 👨‍💻 Author

ShopNova API by **Atif Maqsood** - A comprehensive e-commerce backend solution

---

**Built with ❤️ using NestJS**