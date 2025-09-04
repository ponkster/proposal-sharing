# Development Guide - Proposal Share Application

This guide covers setting up and developing the Proposal Share application locally.

## Prerequisites

- **Bun** (recommended) or **Node.js 18+**
- **Git**
- **Modern web browser**

## Quick Start

### 1. Clone and Install
```bash
# Clone the repository
git clone <your-repo-url>
cd proposal-share

# Install dependencies
bun install  # or npm install
```

### 2. Environment Setup
```bash
# Create environment file
cp .env.example .env.local

# Edit .env.local and set your admin key
# Example:
ADMIN_KEY=dev-admin-key-123
```

### 3. Start Development Server
```bash
# Using Bun (recommended)
bun dev

# Using npm
npm run dev
```

### 4. Access the Application
- **Main App**: http://localhost:5173
- **Admin Login**: http://localhost:5173/login
- **Create Proposals**: http://localhost:5173/create (after login)
- **Admin Dashboard**: http://localhost:5173/admin (after login)

## Project Structure

```
proposal-share/
├── src/
│   ├── lib/
│   │   ├── auth.ts          # Authentication logic
│   │   └── db.ts           # Database setup and migrations
│   ├── routes/
│   │   ├── +layout.svelte  # Main layout
│   │   ├── +page.svelte    # Homepage
│   │   ├── admin/          # Admin dashboard
│   │   ├── api/           # API endpoints
│   │   │   ├── auth/      # Authentication API
│   │   │   ├── mockup/    # Mockup serving API
│   │   │   ├── proposals/ # Proposal CRUD API
│   │   │   └── unlock/    # Proposal unlock API
│   │   ├── create/        # Proposal creation page
│   │   ├── edit/          # Proposal editing pages
│   │   ├── login/         # Admin login page
│   │   └── p/             # Proposal viewer pages
│   ├── app.html           # HTML template
│   └── app.d.ts           # TypeScript definitions
├── static/                # Static assets
├── proposals.db          # SQLite database (created on first run)
├── package.json
├── svelte.config.js
├── tsconfig.json
└── vite.config.ts
```

## Development Workflow

### 1. Creating Features
1. **Create branch**: `git checkout -b feature/your-feature`
2. **Make changes**: Edit files in `src/`
3. **Test locally**: Visit http://localhost:5173
4. **Check types**: `bun run check` (or `npm run check`)
5. **Commit changes**: `git add . && git commit -m "Add feature"`

### 2. API Development
API routes are in `src/routes/api/`:
- **Proposals**: CRUD operations for proposals
- **Auth**: Admin authentication
- **Unlock**: Password verification for viewing
- **Mockup**: Serving HTML mockups in new tabs

Example API endpoint structure:
```typescript
// src/routes/api/example/+server.ts
import type { RequestHandler } from "@sveltejs/kit";

export const POST: RequestHandler = async ({ request }) => {
  const data = await request.json();
  // Handle request
  return new Response(JSON.stringify({ success: true }));
};
```

### 3. Database Changes
Database is automatically initialized in `src/lib/db.ts`. To add migrations:

```typescript
// Check if migration is needed
const tableInfo = db.prepare("PRAGMA table_info(proposals)").all();
const hasNewColumn = tableInfo.some(column => column.name === 'new_column');

if (!hasNewColumn) {
  db.exec(`ALTER TABLE proposals ADD COLUMN new_column TEXT;`);
}
```

## Available Commands

```bash
# Development
bun dev                 # Start dev server with hot reload
bun run dev:host       # Start dev server accessible from network

# Building
bun run build          # Build for production
bun run preview        # Preview production build locally

# Quality Checks
bun run check          # TypeScript type checking
bun run check:watch    # Type checking with file watching
bun run lint           # Run ESLint (if configured)

# Database
rm proposals.db        # Reset database (creates fresh on next start)
```

## Environment Variables

Create `.env.local` for development:

```bash
# Required
ADMIN_KEY=your-dev-admin-key

# Optional (with defaults)
NODE_ENV=development
PORT=5173
HOST=localhost
```

## Testing

### Manual Testing Checklist

1. **Authentication**:
   - [ ] Admin login works with correct key
   - [ ] Admin login fails with wrong key
   - [ ] Protected pages redirect when not logged in

2. **Proposal Creation**:
   - [ ] Create proposal with markdown and mockups
   - [ ] Add multiple mockups (up to 5)
   - [ ] Validation works for required fields
   - [ ] Generated link is accessible

3. **Proposal Viewing**:
   - [ ] Password protection works
   - [ ] Markdown renders correctly
   - [ ] Mermaid charts display
   - [ ] HTML mockups open in new tabs
   - [ ] PDF export functions

4. **Proposal Management**:
   - [ ] Admin dashboard shows all proposals
   - [ ] Edit existing proposals
   - [ ] Delete proposals with confirmation
   - [ ] Copy proposal links

## Debugging

### Common Issues

1. **Port Already in Use**:
   ```bash
   # Kill process on port 5173
   lsof -ti:5173 | xargs kill -9
   
   # Or use different port
   PORT=5174 bun dev
   ```

2. **Database Locked**:
   ```bash
   # Stop dev server and restart
   # Database might be locked by another process
   ```

3. **Module Not Found**:
   ```bash
   # Clear node_modules and reinstall
   rm -rf node_modules bun.lockb
   bun install
   ```

### Development Tools

1. **Browser DevTools**: Use for debugging frontend
2. **Network Tab**: Monitor API requests
3. **Console**: Check for JavaScript errors
4. **SQLite Browser**: Inspect database directly

### Logging

Add logging to your code:
```typescript
// Server-side logging
console.log('Debug info:', data);

// Client-side logging  
console.log('Frontend debug:', state);
```

## Code Style

- **TypeScript**: Strict mode enabled
- **Formatting**: Follow existing patterns
- **Imports**: Use relative imports for local files
- **Components**: Use PascalCase for component files
- **API Routes**: Use `+server.ts` naming convention

## Database Schema

Current schema (auto-created):
```sql
CREATE TABLE proposals (
  id TEXT PRIMARY KEY,        -- 8-character UUID
  title TEXT,                -- Proposal title
  markdown TEXT,             -- Markdown content
  mockup TEXT,               -- Legacy single mockup (for compatibility)
  mockups TEXT DEFAULT '[]', -- JSON array of mockups
  passwordHash TEXT,         -- bcrypt hashed password
  createdAt TEXT            -- ISO timestamp
);
```

## Contributing

1. **Fork repository**
2. **Create feature branch**: `git checkout -b feature/amazing-feature`
3. **Make changes** and **test thoroughly**
4. **Commit changes**: `git commit -m 'Add amazing feature'`
5. **Push to branch**: `git push origin feature/amazing-feature`
6. **Create Pull Request**

## Architecture Notes

### Frontend
- **SvelteKit**: Full-stack framework
- **TypeScript**: Type safety
- **Vite**: Fast development server
- **Custom CSS**: No external UI library

### Backend
- **SvelteKit API Routes**: Server-side logic
- **SQLite**: File-based database
- **bcrypt**: Password hashing
- **better-sqlite3**: Database driver

### Key Design Decisions
- **Single-user**: Simplified authentication model
- **File-based DB**: Easy deployment, no external dependencies
- **New Tab Mockups**: Better UX than iframes
- **Session Storage**: Simple admin state management

## Performance Considerations

### Development
- Hot reload is fast due to Vite
- Database operations are synchronous (SQLite)
- No external API dependencies

### Production Build
- Static assets are optimized
- Tree-shaking removes unused code
- Database is bundled with application

## Security Notes

### Development
- Use strong `ADMIN_KEY` even in development
- Don't commit `.env.local` to version control
- Database passwords are hashed, never stored plain

### Code Security
- All user inputs are validated
- HTML mockups are served with proper headers
- No SQL injection vulnerabilities (prepared statements)

This development guide should get you up and running quickly! For deployment instructions, see `README-DEPLOY.md`.