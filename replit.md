# FinFlow - SME FinTech Dashboard

## Overview

FinFlow is a comprehensive financial management platform designed specifically for Small and Medium Enterprises (SMEs). The application provides a unified dashboard for loan applications, invoice management, UPI payments, and GST compliance tracking. Built as a full-stack TypeScript application with a modern React frontend and Express.js backend, it leverages PostgreSQL for data persistence and integrates with Replit's authentication system.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter for client-side routing
- **State Management**: TanStack Query (React Query) for server state management
- **UI Framework**: Radix UI primitives with shadcn/ui components
- **Styling**: Tailwind CSS with CSS variables for theming
- **Build Tool**: Vite with custom configuration for development and production

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **Authentication**: Replit Auth with OpenID Connect (OIDC)
- **Session Management**: Express sessions with PostgreSQL storage
- **API Design**: RESTful endpoints with proper error handling
- **Validation**: Zod schemas for request validation

### Database Design
- **Primary Database**: PostgreSQL with Neon serverless connection
- **ORM**: Drizzle ORM for type-safe database operations
- **Schema Management**: Drizzle Kit for migrations and schema evolution
- **Tables**: Users, loan applications, invoices, UPI payments, GST filings, KYC documents, and sessions

## Key Components

### Authentication System
- **Provider**: Replit Auth integration with OIDC discovery
- **Session Storage**: PostgreSQL-backed sessions with 7-day TTL
- **User Management**: Automatic user creation/update on login
- **Security**: HTTP-only cookies with secure flag for production

### Dashboard Features
1. **Overview Cards**: Real-time metrics for revenue, loans, invoices, and payments
2. **Loan Applications**: Multi-step form with document upload capability
3. **Invoice Management**: CRUD operations with filtering and search
4. **UPI Payments**: Payment link generation with QR codes and sharing options
5. **GST Compliance**: Filing alerts with calendar integration
6. **KYC Management**: Document upload and verification status tracking

### UI/UX Design
- **Design System**: Based on shadcn/ui with consistent theming
- **Responsive Layout**: Mobile-first approach with collapsible sidebar
- **Accessibility**: WCAG-compliant components from Radix UI
- **User Experience**: Progressive loading states and error handling

## Data Flow

### Request Flow
1. Client sends authenticated requests with session cookies
2. Express middleware validates session and extracts user context
3. Route handlers validate input using Zod schemas
4. Storage layer executes database operations via Drizzle ORM
5. Response data is formatted and returned to client
6. React Query manages caching and synchronization

### Authentication Flow
1. User initiates login via `/api/login` endpoint
2. Replit Auth redirects to OIDC provider
3. Successful authentication creates/updates user record
4. Session is established with PostgreSQL storage
5. Client receives session cookie for subsequent requests

### Data Persistence
- **User Profiles**: Stored with KYC status and company information
- **Financial Records**: Loan applications, invoices, and payments with user association
- **Compliance Data**: GST filing records with due date tracking
- **Document Storage**: KYC document metadata with file references

## External Dependencies

### Core Dependencies
- **@neondatabase/serverless**: PostgreSQL connection for Neon database
- **drizzle-orm**: Type-safe ORM for database operations
- **@tanstack/react-query**: Server state management
- **@radix-ui/***: Accessible UI primitives
- **express-session**: Session management
- **passport**: Authentication middleware

### Development Tools
- **Vite**: Build tool and development server
- **TypeScript**: Type safety across the stack
- **Tailwind CSS**: Utility-first styling
- **ESBuild**: Production bundle optimization

### Third-Party Services
- **Replit Auth**: Authentication provider
- **Neon Database**: Serverless PostgreSQL hosting
- **WebSocket Support**: Real-time capabilities via Neon

## Deployment Strategy

### Development Environment
- **Local Development**: Vite dev server with Express middleware
- **Hot Module Replacement**: React components with Vite HMR
- **Database**: Development connection to Neon instance
- **Authentication**: Replit Auth configured for development domain

### Production Build
- **Frontend Build**: Vite production build to `dist/public`
- **Backend Build**: ESBuild bundle to `dist/index.js`
- **Static Assets**: Served via Express static middleware
- **Process Management**: Single Node.js process handling both API and static content

### Environment Configuration
- **DATABASE_URL**: PostgreSQL connection string (required)
- **SESSION_SECRET**: Session encryption key (required)
- **REPL_ID**: Replit environment identifier
- **NODE_ENV**: Environment flag for production optimizations

## Changelog

```
Changelog:
- June 30, 2025. Initial setup
```

## User Preferences

```
Preferred communication style: Simple, everyday language.
```