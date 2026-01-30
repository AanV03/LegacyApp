# Legacy App - Project & Task Management Platform

A modern, full-stack web application for comprehensive project and task management with team collaboration features. Built with Next.js, TypeScript, Prisma ORM, and PostgreSQL, following the T3 Stack architecture.

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Architecture](#project-architecture)
- [Getting Started](#getting-started)
- [Database Setup](#database-setup)
- [Project Structure](#project-structure)
- [Core Modules](#core-modules)
- [API Documentation](#api-documentation)
- [Authentication & Authorization](#authentication--authorization)
- [Development Workflow](#development-workflow)
- [Deployment](#deployment)
- [Contributing](#contributing)

## 🎯 Overview

Legacy App is a comprehensive platform designed to streamline project management, task tracking, and team collaboration. The application migrates traditional localStorage-based task management to a robust, scalable backend with PostgreSQL persistence, real-time notifications, and advanced team features.

**Current Version:** 0.1.0  
**Status:** Active Development

## ✨ Features

### Core Features
- **Project Management**: Create, organize, and manage multiple projects with descriptions
- **Task Management**: Full lifecycle task tracking with status, priority, and time estimation
- **Task Assignment**: Assign tasks to team members with due dates and estimated hours
- **Comments & Collaboration**: Add comments to tasks for team communication
- **Activity History**: Complete audit trail of all task and project changes
- **Real-time Notifications**: Stay updated on task assignments, updates, and completions

### Advanced Features
- **Role-Based Access Control**: User and Admin roles with permission-based actions
- **Team Management**: Organize users into teams (planned)
- **Advanced Reporting**: Project and task analytics dashboards
- **Search Functionality**: Full-text search across tasks and projects
- **Task Filtering & Sorting**: Advanced filtering by status, priority, assignee, and date
- **Dark Mode Support**: Seamless theme toggling between light and dark modes
- **Responsive Design**: Optimized for desktop, tablet, and mobile devices

## 🛠 Tech Stack

### Frontend
- **Framework**: [Next.js](https://nextjs.org) 15.2+ (React 19)
- **Language**: [TypeScript](https://www.typescriptlang.org)
- **Styling**: [Tailwind CSS](https://tailwindcss.com) 4.0 + PostCSS
- **UI Components**: [Radix UI](https://www.radix-ui.com/)
- **State Management**: [React Query](https://tanstack.com/query/latest)
- **Icons**: [Lucide React](https://lucide.dev)
- **Data Visualization**: [Recharts](https://recharts.org)
- **Toast Notifications**: [Sonner](https://sonner.emilkowal.ski)
- **Theme Management**: [Next Themes](https://github.com/pacocoursey/next-themes)

### Backend
- **Framework**: Next.js 15.2+ API Routes
- **API Layer**: [tRPC](https://trpc.io) 11.0+
- **Database ORM**: [Prisma](https://prisma.io) 6.6+
- **Database**: PostgreSQL
- **Authentication**: Custom JWT-based (Next-Auth compatible)
- **Password Hashing**: [bcryptjs](https://github.com/dcodeIO/bcrypt.js)
- **Validation**: [Zod](https://zod.dev)
- **Task Scheduling**: [node-cron](https://github.com/kelektiv/node-cron)

### Developer Tools
- **Package Manager**: pnpm
- **Linting**: [ESLint](https://eslint.org) 9.23+
- **Code Formatting**: [Prettier](https://prettier.io) 3.5+
- **Type Checking**: TypeScript 5.8+

## 🏗 Project Architecture

### Clean Architecture Layers

```
┌─────────────────────────────────────────────────────┐
│            Client Layer (React/Next.js)             │
│  - UI Components, Pages, Hooks, Styling             │
└─────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────┐
│         tRPC API Layer (Type-Safe RPC)             │
│  - Query & Mutation Definitions, Middleware         │
└─────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────┐
│     Business Logic Layer (Services/Routers)        │
│  - Business Rules, Validation, Authorization       │
└─────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────┐
│      Data Access Layer (Prisma ORM)                │
│  - Database Queries, Relationships, Migrations      │
└─────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────┐
│         Database (PostgreSQL)                       │
│  - Data Persistence, Indexes, Constraints           │
└─────────────────────────────────────────────────────┘
```

### Key Design Patterns
- **Type-Safe RPC**: tRPC ensures end-to-end type safety from frontend to backend
- **Repository Pattern**: Prisma models act as repositories
- **Middleware Pipeline**: Request authentication and validation
- **Cascading Deletes**: Maintaining referential integrity in related records

## 🚀 Getting Started

### Prerequisites
- Node.js 18.0+ with npm or pnpm
- PostgreSQL 14+ database instance
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd legacyapp
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```

   Configure the following variables:
   ```env
   DATABASE_URL=postgresql://user:password@localhost:5432/legacyapp
   NEXTAUTH_URL=http://localhost:3000
   NEXTAUTH_SECRET=your-secret-key-here
   ```

4. **Initialize the database**
   ```bash
   pnpm db:push
   ```

5. **Seed sample data (optional)**
   ```bash
   pnpm db:seed
   ```

6. **Start the development server**
   ```bash
   pnpm dev
   ```

   Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🗄 Database Setup

### Prisma Migrations

The project uses Prisma migrations to manage database schema changes:

```bash
# Create a new migration
pnpm db:generate

# Apply pending migrations
pnpm db:migrate

# Sync schema with database (development only)
pnpm db:push

# Open Prisma Studio for visual data management
pnpm db:studio
```

### Schema Overview

**Core Models:**
- **User**: Application users with roles (USER, ADMIN)
- **Project**: Project containers created by users
- **Task**: Tasks with status, priority, assignees, and time tracking
- **Comment**: Threaded comments on tasks for collaboration
- **History**: Audit log of all changes to tasks and projects
- **Notification**: User notifications for task events
- **SystemEvent**: Event queue for cron jobs and async processing

**Authentication Models:**
- **Account**: OAuth account linkage (NextAuth compatible)
- **Session**: User session tokens
- **VerificationToken**: Email verification tokens

**Enums:**
- `TaskStatus`: PENDING, IN_PROGRESS, COMPLETED, CANCELLED
- `TaskPriority`: LOW, MEDIUM, HIGH, CRITICAL
- `UserRole`: USER, ADMIN
- `NotificationType`: TASK_ASSIGNED, TASK_UPDATED, COMMENT_ADDED, etc.
- `HistoryAction`: CREATED, STATUS_CHANGED, ASSIGNED, etc.

## 📁 Project Structure

```
legacyapp/
├── src/
│   ├── app/                      # Next.js app directory
│   │   ├── layout.tsx           # Root layout with providers
│   │   ├── page.tsx             # Home page
│   │   ├── api/
│   │   │   ├── auth/            # Authentication routes
│   │   │   ├── cron/            # Cron job endpoints
│   │   │   └── trpc/            # tRPC API endpoint
│   │   └── manager/             # Manager dashboard
│   │       ├── layout.tsx
│   │       ├── page.tsx
│   │       └── _components/     # Manager-specific components
│   ├── components/
│   │   ├── loginform.tsx        # Login form component
│   │   ├── registerform.tsx     # Registration form component
│   │   ├── ThemeToggle.tsx      # Dark mode toggle
│   │   └── ui/                  # Reusable UI components
│   ├── hooks/                   # Custom React hooks
│   ├── lib/                     # Utility functions
│   ├── server/
│   │   ├── api/
│   │   │   ├── root.ts         # tRPC router root
│   │   │   ├── trpc.ts         # tRPC instance & middleware
│   │   │   ├── routers/        # Feature-specific routers
│   │   │   └── services/       # Business logic services
│   │   ├── auth/               # Authentication logic
│   │   ├── cron/               # Scheduled tasks
│   │   └── db.ts               # Database client
│   ├── styles/                 # Global styles
│   ├── trpc/                   # Client-side tRPC setup
│   └── env.js                  # Environment validation
├── prisma/
│   ├── schema.prisma           # Database schema
│   ├── seed.js                 # Seed script
│   └── migrations/             # Migration history
├── public/                     # Static assets
├── docs/                       # Documentation
├── package.json
├── tsconfig.json
├── tailwind.config.js
├── next.config.js
├── eslint.config.js
└── prettier.config.js
```

## 🔧 Core Modules

### 1. Authentication Module (`src/server/auth/`)
Handles user authentication with JWT tokens and session management.
- User registration and login
- Password hashing with bcryptjs
- Session validation
- Role-based access control

### 2. Project Management (`src/server/api/routers/project.ts`)
CRUD operations for projects:
- Create, read, update, delete projects
- Project associations with tasks
- Permission checks for project access

### 3. Task Management (`src/server/api/routers/task.ts`)
Core task operations:
- Create tasks with all properties (title, description, priority, status)
- Update task status and assignments
- Time tracking (estimated vs. actual hours)
- Automatic history tracking on changes
- Notification generation on assignment

### 4. Collaboration (`src/server/api/routers/comment.ts`)
Task comments and discussion:
- Add comments to tasks
- Comment listing with user information
- Edit and delete comments

### 5. Activity Tracking (`src/server/api/routers/history.ts`)
Complete audit trail:
- Track all modifications to tasks
- Record changes with old/new values
- User attribution for each change
- Timestamps for all events

### 6. Notifications (`src/server/api/routers/notification.ts`)
Real-time user notifications:
- Generate notifications on task events
- Mark notifications as read
- Filter notifications by type and read status

### 7. Reporting & Analytics (`src/server/api/routers/report.ts`)
Dashboard and insights:
- Project statistics
- Task completion metrics
- Team performance data
- Time tracking analysis

### 8. Search (`src/server/api/routers/search.ts`)
Full-text search functionality:
- Search tasks by title and description
- Search projects
- Filter by multiple criteria

## 🔐 API Documentation

### tRPC Router Structure

All API operations are exposed through type-safe tRPC procedures:

```typescript
// Example: Get all projects for current user
trpc.project.list.useQuery()

// Example: Create a new task
trpc.task.create.useMutation({
  onSuccess: () => { /* refresh data */ }
})

// Example: Update task status
trpc.task.updateStatus.useMutation()
```

### Available Routers

| Router | Operations |
|--------|-----------|
| `project` | list, create, update, delete, getWithCount |
| `task` | list, create, update, updateStatus, delete, getById, search |
| `comment` | add, list, delete |
| `history` | list, getByTask, getByProject |
| `notification` | list, create, markAsRead, delete |
| `user` | profile, updateProfile, list |
| `report` | projectStats, taskStats, teamPerformance |
| `search` | tasks, projects |

## 🔐 Authentication & Authorization

### Authentication Flow

1. **Registration**: User creates account with username/email and password
2. **Login**: Credentials validated against database (bcrypt comparison)
3. **Session**: JWT token generated and stored in secure HTTP-only cookie
4. **Protected Routes**: Middleware validates token on each request
5. **Authorization**: Role-based access control on resources

### Authorization Levels

- **Public Routes**: `/`, `/login`, `/register`
- **Authenticated Routes**: All `/manager/*` routes
- **Admin Routes**: Configuration and user management
- **User-Owned Resources**: Users can only access their own projects/tasks

### Security Best Practices Implemented

✅ Password hashing with bcryptjs  
✅ JWT token validation on protected routes  
✅ CORS protection  
✅ SQL injection prevention via Prisma ORM  
✅ XSS protection via React's built-in escaping  
✅ CSRF tokens in forms  
✅ Rate limiting on auth endpoints (recommended)  
✅ Secure HTTP-only cookies for sessions  

## 💻 Development Workflow

### Available Scripts

```bash
# Development
pnpm dev              # Start dev server with Turbopack
pnpm build            # Build for production
pnpm start            # Start production server
pnpm preview          # Build and preview locally

# Database
pnpm db:generate      # Create new migration from schema changes
pnpm db:migrate       # Apply pending migrations
pnpm db:push          # Sync schema (dev only)
pnpm db:studio        # Open Prisma Studio
pnpm db:seed          # Run seed script

# Code Quality
pnpm lint             # Run ESLint checks
pnpm lint:fix         # Auto-fix lint issues
pnpm format:check     # Check Prettier formatting
pnpm format:write     # Auto-format code
pnpm typecheck        # TypeScript type checking
pnpm check            # Run lint + typecheck

# Build
pnpm build            # Production build
```

### Development Best Practices

1. **Type Safety**: Always use TypeScript types; avoid `any`
2. **Components**: Keep components focused and composable
3. **Hooks**: Extract complex logic into custom hooks
4. **Validation**: Use Zod for all input validation
5. **Error Handling**: Implement proper error boundaries
6. **Testing**: Write tests for critical paths
7. **Documentation**: Document complex business logic
8. **Git**: Use meaningful commit messages

### Git Workflow

```bash
# Feature branch
git checkout -b feature/feature-name

# Make changes and commits
git add .
git commit -m "feat: add feature description"

# Push and create pull request
git push origin feature/feature-name
```

## 🚀 Deployment

### Deployment Platforms

The application can be deployed on:

- **[Vercel](https://vercel.com)** (Recommended for Next.js)
  - Environment variables configuration
  - Automatic deployments on push
  - Serverless database compatibility

- **[Netlify](https://netlify.com)**
  - Configure build command: `pnpm build`
  - Configure publish directory: `.next`

- **[Docker](https://www.docker.com/)**
  - Containerized deployment for any platform
  - Include PostgreSQL in docker-compose setup

### Pre-Deployment Checklist

- [ ] All tests passing
- [ ] No TypeScript errors
- [ ] No ESLint warnings
- [ ] Environment variables configured
- [ ] Database migrations applied
- [ ] Build optimization verified
- [ ] Security audit completed
- [ ] Performance metrics reviewed

### Environment Setup for Production

```env
DATABASE_URL=postgresql://prod-user:secure-password@db-host:5432/legacyapp-prod
NEXTAUTH_SECRET=production-secret-key-minimum-32-chars
NEXTAUTH_URL=https://yourdomain.com
NODE_ENV=production
```

## 📚 Additional Resources

### Documentation Files
- [Logic Analysis](./LOGIC_ANALYSIS.md) - Detailed business logic breakdown
- [Migration Analysis](./MIGRATION_ANALYSIS.md) - localStorage to PostgreSQL migration guide
- [Team Implementation](./TEAM-IMPLEMENTATION.md) - Future team module implementation plan

### External Resources
- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [tRPC Documentation](https://trpc.io/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [TypeScript Handbook](https://www.typescriptlang.org/docs)
- [React Documentation](https://react.dev)

## 🤝 Contributing

Contributions are welcome! Please follow these guidelines:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Code Standards
- Follow ESLint and Prettier configurations
- Write meaningful commit messages
- Add comments for complex logic
- Ensure TypeScript types are correct
- Test your changes before submitting

## 📄 License

This project is private and confidential.

## 📞 Support

For issues, questions, or suggestions:
- Open an issue on the repository
- Contact the development team
- Check existing documentation

---

**Last Updated:** January 29, 2026  
**Maintained by:** Development Team
