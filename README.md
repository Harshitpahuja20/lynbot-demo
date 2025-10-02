# Lync Bot

Full-Stack Next.js LinkedIn Automation Platform for lead generation and outreach campaigns.

*Last updated: MongoDB Atlas configuration updated for Netlify deployment*

## Features

- Automated LinkedIn connection requests
- Personalized messaging campaigns
- AI-powered message generation
- Lead scoring and management
- Analytics and reporting
- User management with role-based access

## Tech Stack

- Frontend: Next.js + TypeScript + Tailwind CSS
- Database: Supabase (PostgreSQL)
- Authentication: JWT
- UI Components: Lucide React Icons

## Getting Started

### Prerequisites

1. **Supabase**: You need a Supabase project
   - Create a free account at [Supabase](https://supabase.com)
   - Create a new project
   - Get your project URL and API keys

### Setup Instructions

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure environment variables:**
   - Copy `.env.example` to `.env.local`
   - Update Supabase configuration with your project details:
     - `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase project URL
     - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase anon key
     - `SUPABASE_SERVICE_ROLE_KEY`: Your Supabase service role key
   - Set a secure `JWT_SECRET`

3. **Set up the database:**
   - Run the SQL migrations in your Supabase dashboard or using the CLI
   - The migration files are in `supabase/migrations/`

4. **Seed the database:**
   ```bash
   npm run db:seed
   ```

5. **Start the development server:**
   ```bash
   npm run dev
   ```

## Default Credentials

- Admin: admin@lyncbot.com / LyncBot123!
- Demo User: demo@example.com / demo123456

## API Routes

- `/api/auth/login` - User authentication
- `/api/auth/register` - User registration
- `/api/user/profile` - User profile management
- `/api/user/dashboard-stats` - Dashboard statistics
- `/api/campaigns` - Campaign management
- `/api/admin/users` - Admin user management

## Development

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run db:seed      # Seed database with default users
```
