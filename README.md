# Proposal Share Application

A password-protected proposal sharing system built with SvelteKit, TypeScript, and SQLite. Share markdown proposals with HTML mockups securely.

## Features

- 📝 **Markdown Proposals**: Write proposals in Markdown with Mermaid chart support
- 🎨 **HTML Mockups**: Add up to 5 HTML mockups per proposal with custom titles
- 🔐 **Password Protection**: Each proposal requires a password to view
- 👨‍💼 **Admin System**: Admin authentication for creating and managing proposals
- ✏️ **Edit Functionality**: Edit existing proposals and mockups
- 📄 **PDF Export**: Export proposals to PDF format
- 🆕 **New Tab Mockups**: HTML mockups open in separate browser tabs for full functionality
- 🐳 **Docker Support**: Easy deployment with Docker and Docker Compose

## Tech Stack

- **Frontend**: SvelteKit with TypeScript
- **Runtime**: Bun
- **Database**: SQLite with better-sqlite3
- **Security**: bcrypt for password hashing
- **Styling**: Custom CSS with responsive design
- **Containerization**: Docker & Docker Compose

## 📚 Documentation

- **[Development Guide](README-DEV.md)** - Complete development setup, project structure, and contribution guidelines
- **[Deployment Guide](README-DEPLOY.md)** - Production deployment for Docker, cloud platforms, and VPS

## ⚡ Quick Start

### Option 1: Docker (Recommended for Production)
```bash
git clone <your-repo>
cd proposal-share
cp .env.example .env
# Edit .env and set ADMIN_KEY=your-secure-key
docker-compose up -d
```
→ Visit `http://localhost:3000`

### Option 2: Development Setup
```bash
git clone <your-repo>
cd proposal-share
bun install
cp .env.example .env.local
# Edit .env.local and set ADMIN_KEY=your-dev-key  
bun dev
```
→ Visit `http://localhost:5173`

## 🚀 How to Use

1. **Admin Access**: Visit `/login` and enter your `ADMIN_KEY`
2. **Create Proposals**: Add markdown content and up to 5 HTML mockups
3. **Share Securely**: Each proposal gets a unique URL and password
4. **Manage**: Edit, delete, and view all proposals from the admin dashboard

**Key Features:**
- 📝 Markdown with Mermaid chart support
- 🎨 Multiple HTML mockups that open in new tabs
- 🔐 Password-protected sharing
- 📄 PDF export functionality
- ✏️ Full CRUD operations

## 🔧 Configuration

### Required Environment Variables
```bash
ADMIN_KEY=your-super-secure-admin-key-here  # Required
```

### Optional Variables
```bash
NODE_ENV=production     # Environment mode
PORT=3000              # Application port  
HOST=0.0.0.0          # Bind address
```

## 🛡️ Security & Production Notes

- **Change default `ADMIN_KEY`** before deploying
- **Use HTTPS** in production (reverse proxy recommended)
- **Regular backups** of SQLite database
- **Monitor logs** for unusual activity

## Architecture

- **Frontend**: SvelteKit with TypeScript
- **Backend**: SvelteKit API routes
- **Database**: SQLite with better-sqlite3
- **Authentication**: Session-based admin auth
- **Styling**: Custom CSS with responsive design

## License

MIT License - see LICENSE file for details
