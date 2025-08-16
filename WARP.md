# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Commands

### Development
```bash
# Start development server with Turbopack
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linting
npm run lint

# Install dependencies
npm install
```

### Database Operations
The project includes several SQL files for database management:
- `database_schema.sql` - Main database schema
- `database_enums.sql` - Database enums and types  
- `apply_enums_to_tables_complete.sql` - Latest complete enum migrations
- `fix_database_issues_v2.sql` - Database fixes and updates

### Testing
The project doesn't currently have test scripts configured. Consider adding:
```bash
# Example commands that could be added
npm test        # Run tests
npm run test:watch  # Watch mode
npm run test:coverage  # Coverage report
```

## Architecture Overview

### Tech Stack
- **Frontend**: Next.js 15 with App Router, React 19, TypeScript
- **Styling**: Tailwind CSS 4.x
- **Database**: Supabase (PostgreSQL) with Row Level Security (RLS)
- **Authentication**: Supabase Auth with automatic profile creation
- **Build Tool**: Turbopack (Next.js development)

### Project Structure

#### Core Directories
- `app/` - Next.js App Router pages and layouts
- `components/` - Reusable React components (Navbar, etc.)
- `lib/supabase/` - Database client and type definitions
- `public/` - Static assets

#### Key App Routes
The application is a Russian-language government portal for GTA5RP with these main sections:
- `/` - Homepage with service grid
- `/acts-government` - Government acts/documents
- `/acts-court` - Court decisions and rulings
- `/fines` - Fines and penalties system
- `/wanted` - Federal wanted list
- `/cases` - Legal cases management
- `/court-sessions` - Court sessions registry
- `/lawyers` - Lawyer management system
- `/inspections` - Government inspections
- `/appointment` - Appointment booking system
- `/admin` - Administrative panel with multiple subsections

### Database Architecture

#### User System
- **Profiles**: Automatic creation via trigger on user registration
- **Roles**: Complex role system with Faction, GovRole, LeaderRole, and OfficeRole
- **Verification**: Multi-step verification system for different roles

#### Government Functions
- **Acts**: Government and court document publishing system
- **Warrants**: Law enforcement warrant system with status tracking
- **Cases**: Legal case management with assignment and events
- **Fines**: Penalty system with payment status tracking
- **Inspections**: Government inspection system

#### Access Control
- **Row Level Security (RLS)**: Enabled on all tables
- **Role-based Access**: Different permissions based on user roles
- **Administrative Levels**: TECH_ADMIN, ATTORNEY_GENERAL, CHIEF_JUSTICE have elevated access

### Type System

The project uses comprehensive TypeScript types defined in `lib/supabase/client.ts`:

#### Key Types
- `Profile` - User profile with roles and verification status
- `Faction` - User faction (CIVILIAN, GOV, COURT, etc.)
- `GovRole` - Government role (PROSECUTOR, JUDGE, TECH_ADMIN, etc.)
- `LeaderRole` - Leadership positions in factions
- `Department` - Government departments for appointments
- `Appointment` - Appointment booking system
- `Warrant`, `Case`, `Fine` - Law enforcement entities

### Component Architecture

#### Layout System
- `app/layout.tsx` - Root layout with Navbar and footer
- Multi-language support (Russian/Cyrillic with Inter font)
- Responsive grid system with Tailwind CSS

#### Navigation
- `components/Navbar.tsx` - Complex navigation with dropdowns
- Role-based menu visibility
- User authentication state management
- Notification system integration

### State Management
- Uses React hooks and Supabase real-time subscriptions
- No external state management library (Redux, Zustand)
- Authentication state managed through Supabase client
- Profile data fetched and cached in components

### Security Model

#### Authentication
- Supabase Auth with session persistence
- Automatic profile creation via database trigger
- Role verification system

#### Authorization  
- Row Level Security policies on all database tables
- Role-based access control throughout the application
- Administrative oversight for sensitive operations

### Database Integration

#### Supabase Client
- Centralized client configuration in `lib/supabase/client.ts`
- Environment variables for connection (NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY)
- Auto-refresh tokens and session persistence

#### Real-time Features
- Supabase real-time subscriptions capability
- Automatic updates for collaborative features

## Development Notes

### Role-Based Development
When working on features, always consider the role-based access system:
- Public features: Available to all users
- User features: Require authentication  
- Role features: Require specific government/faction roles
- Admin features: Require TECH_ADMIN, ATTORNEY_GENERAL, or CHIEF_JUSTICE

### Database Changes
- Use the provided SQL migration files as reference
- Always update TypeScript types in `lib/supabase/client.ts` when changing database schema
- Test RLS policies thoroughly when adding new tables or modifying access patterns

### Styling Conventions
- Uses Tailwind CSS with custom classes like `card`, `btn-primary`, `btn-ghost`
- Responsive design with mobile-first approach
- Consistent spacing and color scheme based on blue/slate palette

### Russian Language Support
- All user-facing text is in Russian
- Uses Cyrillic subset of Inter font
- Date/time formatting should consider Russian locale

### Supabase Environment Setup
Ensure these environment variables are set:
```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

### Common Development Patterns

#### Data Fetching
```typescript
// Standard pattern for fetching user profile
const { data: { session } } = await supabase.auth.getSession();
const uid = session?.user?.id;
if (!uid) return;
const { data } = await supabase.from("profiles").select("*").eq("id", uid).maybeSingle();
```

#### Role Checking
```typescript
// Check user permissions
const isAdmin = me?.gov_role === "TECH_ADMIN";
const isJustice = me?.gov_role === "TECH_ADMIN" || me?.gov_role === "ATTORNEY_GENERAL" || me?.gov_role === "CHIEF_JUSTICE";
```

#### Error Handling
- Always handle Supabase errors gracefully
- Provide user feedback for failed operations
- Log errors for debugging but don't expose sensitive information

This codebase represents a comprehensive government portal system for GTA5RP gaming, with emphasis on role-based access, document management, and law enforcement functionality.
