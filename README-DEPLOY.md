# Deployment Guide - Proposal Share Application

This guide covers deploying the Proposal Share application to production environments.

## 🐳 Docker Deployment (Recommended)

Docker provides the easiest and most reliable deployment method.

### Prerequisites
- Docker and Docker Compose installed on server
- Domain name (optional, but recommended)
- SSL certificate (for HTTPS)

### Quick Deployment

1. **Server Setup**
   ```bash
   # Update system
   sudo apt update && sudo apt upgrade -y
   
   # Install Docker
   curl -fsSL https://get.docker.com -o get-docker.sh
   sudo sh get-docker.sh
   
   # Install Docker Compose
   sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
   sudo chmod +x /usr/local/bin/docker-compose
   ```

2. **Application Setup**
   ```bash
   # Clone repository
   git clone <your-repo-url>
   cd proposal-share
   
   # Configure environment
   cp .env.example .env
   nano .env  # Set your ADMIN_KEY
   ```

3. **Deploy**
   ```bash
   # Build and start
   docker-compose up -d
   
   # Check status
   docker-compose ps
   docker-compose logs -f
   ```

4. **Access Application**
   - Visit: `http://your-server-ip:3000`
   - Admin: `http://your-server-ip:3000/login`

### Production Docker Configuration

#### Environment Variables
```bash
# .env file for production
ADMIN_KEY=super-secure-random-key-here-change-this
NODE_ENV=production
PORT=3000
HOST=0.0.0.0
```

#### Custom Docker Compose
For production with reverse proxy:

```yaml
# docker-compose.prod.yml
version: '3.8'

services:
  proposal-share:
    build: .
    container_name: proposal-share
    restart: unless-stopped
    environment:
      - NODE_ENV=production
      - ADMIN_KEY=${ADMIN_KEY}
      - PORT=3000
      - HOST=0.0.0.0
    volumes:
      - proposal_data:/app/data
      - ./logs:/app/logs
    networks:
      - web
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.proposals.rule=Host(`your-domain.com`)"
      - "traefik.http.routers.proposals.tls.certresolver=letsencrypt"

  traefik:
    image: traefik:v3.0
    container_name: traefik
    restart: unless-stopped
    command:
      - --providers.docker=true
      - --entrypoints.web.address=:80
      - --entrypoints.websecure.address=:443
      - --certificatesresolvers.letsencrypt.acme.tlschallenge=true
      - --certificatesresolvers.letsencrypt.acme.email=your-email@domain.com
      - --certificatesresolvers.letsencrypt.acme.storage=/letsencrypt/acme.json
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
      - letsencrypt_data:/letsencrypt
    networks:
      - web

volumes:
  proposal_data:
  letsencrypt_data:

networks:
  web:
    external: true
```

## 🌐 Cloud Platform Deployments

### 1. Railway

Railway offers simple deployment with automatic HTTPS.

1. **Setup**
   ```bash
   # Install Railway CLI
   npm install -g @railway/cli
   
   # Login and initialize
   railway login
   railway init
   ```

2. **Configure**
   ```bash
   # Set environment variables
   railway variables set ADMIN_KEY=your-secure-admin-key
   railway variables set NODE_ENV=production
   ```

3. **Deploy**
   ```bash
   # Deploy from current directory
   railway up
   ```

**Railway Configuration** (`railway.json`):
```json
{
  "build": {
    "builder": "nixpacks"
  },
  "deploy": {
    "startCommand": "node build",
    "healthcheckPath": "/"
  }
}
```

### 2. Fly.io

Fly.io provides global edge deployment.

1. **Setup**
   ```bash
   # Install Fly CLI
   curl -L https://fly.io/install.sh | sh
   
   # Login
   fly auth login
   ```

2. **Initialize**
   ```bash
   # Create fly.toml
   fly launch --no-deploy
   ```

3. **Configure** (`fly.toml`):
   ```toml
   app = "your-app-name"
   primary_region = "fra"
   
   [build]
   
   [env]
     NODE_ENV = "production"
     PORT = "8080"
     HOST = "0.0.0.0"
   
   [http_service]
     internal_port = 8080
     force_https = true
   
   [[mounts]]
     source = "data_volume"
     destination = "/app/data"
   ```

4. **Deploy**
   ```bash
   # Set secrets
   fly secrets set ADMIN_KEY=your-secure-admin-key
   
   # Create volume for database
   fly volumes create data_volume --size 1
   
   # Deploy
   fly deploy
   ```

### 3. Render

1. **Connect Repository**
   - Go to [Render Dashboard](https://dashboard.render.com)
   - Connect your GitHub repository

2. **Configure Service**
   - **Type**: Web Service
   - **Build Command**: `bun install && bun run build`
   - **Start Command**: `node build`
   - **Environment**: 
     - `NODE_ENV=production`
     - `ADMIN_KEY=your-secure-admin-key`

3. **Add Persistent Disk**
   - Create disk for `/app/data`
   - Size: 1GB (minimum)

### 4. Vercel

1. **Setup**
   ```bash
   npm install -g vercel
   vercel login
   ```

2. **Configure** (`vercel.json`):
   ```json
   {
     "builds": [
       {
         "src": "package.json",
         "use": "@vercel/node"
       }
     ],
     "env": {
       "NODE_ENV": "production"
     }
   }
   ```

3. **Deploy**
   ```bash
   vercel --prod
   vercel env add ADMIN_KEY
   ```

**Note**: Vercel has limitations with SQLite. Consider using a hosted database.

## 🖥️ VPS Deployment

### Prerequisites
- Ubuntu 20.04+ server
- Domain name with DNS pointing to server
- SSL certificate (Let's Encrypt recommended)

### 1. Server Preparation

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install Bun (optional, but faster)
curl -fsSL https://bun.sh/install | bash
source ~/.bashrc

# Install PM2 for process management
npm install -g pm2

# Install Nginx
sudo apt install -y nginx

# Install Certbot for SSL
sudo apt install -y certbot python3-certbot-nginx
```

### 2. Application Setup

```bash
# Create app user
sudo useradd -m -s /bin/bash appuser
sudo usermod -aG sudo appuser

# Switch to app user
sudo -u appuser -i

# Clone and setup
git clone <your-repo-url> /home/appuser/proposal-share
cd /home/appuser/proposal-share

# Install dependencies
bun install  # or npm install

# Create environment file
cp .env.example .env
nano .env  # Set ADMIN_KEY and other vars

# Build application
bun run build  # or npm run build
```

### 3. Process Management

**PM2 Configuration** (`ecosystem.config.js`):
```javascript
module.exports = {
  apps: [{
    name: 'proposal-share',
    script: './build/index.js',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 3000,
      HOST: '127.0.0.1'
    }
  }]
};
```

**Start Application**:
```bash
# Start with PM2
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Setup PM2 startup
pm2 startup
# Follow the generated command
```

### 4. Nginx Configuration

```nginx
# /etc/nginx/sites-available/proposal-share
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 86400;
    }
}
```

**Enable Site**:
```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/proposal-share /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
```

### 5. SSL Certificate

```bash
# Get Let's Encrypt certificate
sudo certbot --nginx -d your-domain.com -d www.your-domain.com

# Test auto-renewal
sudo certbot renew --dry-run
```

## 📊 Monitoring & Maintenance

### Health Checks

**Basic Health Check Endpoint**:
```typescript
// src/routes/health/+server.ts
export async function GET() {
  return new Response(JSON.stringify({ 
    status: 'ok', 
    timestamp: new Date().toISOString() 
  }), {
    headers: { 'Content-Type': 'application/json' }
  });
}
```

### Logging

**PM2 Logs**:
```bash
# View logs
pm2 logs proposal-share

# Monitor in real-time
pm2 monit
```

**Docker Logs**:
```bash
# View logs
docker-compose logs -f proposal-share

# Export logs
docker-compose logs proposal-share > app.log
```

### Backup Strategy

**Database Backup**:
```bash
#!/bin/bash
# backup.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups"

# Docker backup
docker cp proposal-share:/app/data/proposals.db "$BACKUP_DIR/proposals_$DATE.db"

# VPS backup
cp /home/appuser/proposal-share/proposals.db "$BACKUP_DIR/proposals_$DATE.db"

# Keep only last 30 days
find $BACKUP_DIR -name "proposals_*.db" -mtime +30 -delete
```

**Automated Backups**:
```bash
# Add to crontab
crontab -e

# Daily backup at 2 AM
0 2 * * * /path/to/backup.sh
```

### Updates

**Docker Updates**:
```bash
# Update application
git pull
docker-compose build --no-cache
docker-compose up -d
```

**VPS Updates**:
```bash
# Update application
git pull
bun install
bun run build
pm2 restart proposal-share
```

## 🔒 Security Hardening

### 1. Server Security

```bash
# Firewall setup
sudo ufw allow 22    # SSH
sudo ufw allow 80    # HTTP
sudo ufw allow 443   # HTTPS
sudo ufw enable

# Disable root login
sudo nano /etc/ssh/sshd_config
# Set: PermitRootLogin no

# Setup fail2ban
sudo apt install fail2ban
```

### 2. Application Security

- **Strong Admin Key**: Use at least 32 random characters
- **HTTPS Only**: Force HTTPS in production
- **Regular Updates**: Keep dependencies updated
- **Database Permissions**: Restrict file permissions

```bash
# Secure database file
chmod 600 proposals.db
chown appuser:appuser proposals.db
```

### 3. Environment Variables

Never expose sensitive data:
```bash
# .env should contain
ADMIN_KEY=super-long-random-string-here-min-32-chars
NODE_ENV=production

# Never commit .env to version control
echo ".env" >> .gitignore
```

## 🚀 Performance Optimization

### 1. Database Optimization

```sql
-- Add indexes for better performance
CREATE INDEX idx_proposals_created_at ON proposals(createdAt);
CREATE INDEX idx_proposals_title ON proposals(title);
```

### 2. Caching Headers

Add to Nginx configuration:
```nginx
location /static/ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

### 3. Compression

```nginx
# Enable gzip
gzip on;
gzip_vary on;
gzip_min_length 1024;
gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;
```

## 📈 Scaling Considerations

### Horizontal Scaling
- Use external database (PostgreSQL/MySQL)
- Implement session storage (Redis)
- Load balancer for multiple instances

### Vertical Scaling
- Increase server resources
- Optimize database queries
- Enable caching layers

## 🆘 Troubleshooting

### Common Issues

1. **Database Permission Errors**
   ```bash
   # Fix permissions
   sudo chown -R appuser:appuser /path/to/data
   ```

2. **Port Already in Use**
   ```bash
   # Find process using port
   sudo lsof -i :3000
   # Kill process
   sudo kill -9 <PID>
   ```

3. **Out of Memory**
   ```bash
   # Check memory usage
   free -h
   # Restart application
   pm2 restart proposal-share
   ```

4. **SSL Certificate Issues**
   ```bash
   # Renew certificate
   sudo certbot renew
   # Restart Nginx
   sudo systemctl restart nginx
   ```

### Monitoring Commands

```bash
# System resources
htop
df -h

# Application status
pm2 status
docker-compose ps

# Network connections
netstat -tulpn

# Application logs
pm2 logs
docker-compose logs -f
```

This deployment guide covers all major deployment scenarios. Choose the method that best fits your infrastructure and requirements!