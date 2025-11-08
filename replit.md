# FinanceTracker - Personal Finance Dashboard

## Overview

FinanceTracker is a full-stack personal finance management application that enables users to track transactions, set budgets, visualize spending trends, and manage financial goals. Built as a modern web application with React frontend and Express backend, it provides a comprehensive dashboard for personal financial management with plans for AI-powered insights.

**Core Features:**
- Dashboard with financial summaries and key metrics
- Transaction management (CRUD operations with filtering)
- Budget tracking with category-based limits and progress monitoring
- Financial goals tracking with deadline management
- Reports and analytics with interactive charts
- Theme support (light/dark mode)

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework & Build System:**
- React 18 with TypeScript for type safety
- Vite as the build tool and development server
- Wouter for lightweight client-side routing (SPA architecture)

**UI Component Strategy:**
- Shadcn/ui component library built on Radix UI primitives
- Tailwind CSS for styling with custom design system
- Material Design principles inspired by fintech dashboards (Stripe, Revolut, Mint)
- Comprehensive design system defined in `design_guidelines.md` with typography hierarchy, spacing primitives, and component patterns

**State Management:**
- TanStack Query (React Query) for server state management and data fetching
- Local component state with React hooks
- Query client configured with custom fetch functions and error handling

**Component Architecture:**
- Page-level components in `client/src/pages/` (Dashboard, Transactions, Budgets, Reports)
- Reusable UI components in `client/src/components/` with dedicated example files
- Custom components include: StatCard, BudgetProgressCard, GoalCard, TransactionTable, SpendingChart, TrendChart, EnhancedTrendChart, AIInsightsCard
- Sidebar navigation with responsive mobile support

**Design System:**
- Custom Tailwind theme with CSS variables for theming
- Color system supporting light/dark modes with HSL color space
- Typography using Inter font family from Google Fonts
- Consistent spacing using Tailwind units (2, 4, 6, 8)
- Card-based layouts with elevation shadows

### Backend Architecture

**Server Framework:**
- Express.js with TypeScript
- ESM module system
- Middleware for JSON parsing, logging, and request tracking

**API Design:**
- RESTful endpoints under `/api` namespace
- Resource-based routing for transactions, budgets, goals, categories
- CRUD operations following REST conventions
- Response logging with request duration tracking

**Development Setup:**
- Vite middleware integration for HMR in development
- Custom error handling with runtime error modal
- Static file serving for production builds
- Development-only Replit plugins (cartographer, dev banner)

### Data Layer

**Database:**
- PostgreSQL via Neon serverless driver (`@neondatabase/serverless`)
- Drizzle ORM for type-safe database operations
- Schema-first approach with migrations in `migrations/` directory

**Schema Design:**
- Users table with username/password authentication
- Categories table for transaction categorization with icons and colors
- Transactions table linking users and categories with amount, description, date, and type (income/expense)
- Budgets table with category-based limits, period (monthly/yearly), and year/month tracking
- Goals table for savings targets with current amount, target amount, and optional deadlines

**Data Validation:**
- Drizzle-Zod integration for runtime schema validation
- Insert schemas exported from shared schema file
- Type inference from database schema to TypeScript types

**Storage Interface:**
- Abstract storage interface (`IStorage`) defining all CRUD operations
- Separate interfaces for summary data (TrendDataPoint, SpendingSummary)
- Supports future implementation of different storage backends

### Code Organization

**Monorepo Structure:**
- `client/` - Frontend React application
- `server/` - Backend Express application  
- `shared/` - Shared code between frontend and backend (schema definitions)
- `migrations/` - Database migration files

**Path Aliases:**
- `@/` maps to `client/src/`
- `@shared/` maps to `shared/`
- `@assets/` maps to `attached_assets/`

**Build & Deployment:**
- Frontend builds to `dist/public/`
- Backend bundles with esbuild to `dist/`
- Production server serves static frontend assets

## External Dependencies

**Database:**
- Neon PostgreSQL serverless database (configured via `DATABASE_URL` environment variable)
- Drizzle Kit for schema management and migrations

**UI Libraries:**
- Radix UI primitives for accessible component foundation (19 different primitive packages)
- Recharts for data visualization and charts
- Embla Carousel for image/content carousels
- Lucide React for consistent iconography

**Utilities:**
- date-fns for date manipulation and formatting
- class-variance-authority (CVA) for component variant styling
- clsx and tailwind-merge for className composition
- zod for runtime validation

**Development Tools:**
- TypeScript for type safety across the stack
- Vite plugins for Replit integration (runtime error modal, cartographer, dev banner)
- PostCSS with Autoprefixer for CSS processing

**Authentication (Planned):**
- Session management structure present in code (userId references)
- Currently using demo user (`demo-user-1`) as placeholder
- Session storage infrastructure with `connect-pg-simple` for PostgreSQL session store

**Charts & Visualization:**
- Recharts library for pie charts, line charts, and trend visualizations
- Custom chart color system using CSS variables (`--chart-1` through `--chart-5`)
- Responsive chart containers with configurable dimensions

**Future Integrations:**
- AI-powered insights (placeholder component present with disabled state)
- Potential external financial data sources for transaction syncing