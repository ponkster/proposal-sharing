# Deployment Guide for proposhare.djianco.uk

## Prerequisites

1. **Domain DNS Setup**
   - Point `proposhare.djianco.uk` A record to your server IP
   - Ensure the domain resolves correctly

2. **Server Requirements**
   - Ubuntu/Debian server with Docker and Docker Compose
   - At least 1GB RAM, 10GB disk space
   - Port 80 and 443 open

## Deployment Steps

### 1. Clone and Setup

```bash
# Clone the repository
git clone <your-repo-url> proposhare
cd proposhare

# Set environment variables
cp .env.example .env
nano .env
```

### 2. Environment Configuration

Create `.env` file with:

```bash
# Admin key for creating/editing proposals
ADMIN_KEY=your-secure-admin-key-here

# Optional: Set specific Node environment
NODE_ENV=production
```

### 3. Deploy with Docker Compose

```bash
# Build and start all services
docker compose up -d --build

# Check status
docker compose ps
docker compose logs -f
```

### 4. Verify Deployment

1. **Check HTTP access**: `http://proposhare.djianco.uk`
2. **Test admin login**: Use your `ADMIN_KEY` to access admin panel
3. **Create test proposal**: Verify full functionality

### 5. SSL Setup (Recommended)

#### Option A: Using Certbot with Let's Encrypt

```bash
# Install certbot
sudo apt update
sudo apt install certbot python3-certbot-nginx

# Stop nginx temporarily
docker compose stop nginx

# Get SSL certificate
sudo certbot certonly --standalone -d proposhare.djianco.uk

# Update docker-compose.yml - uncomment SSL volume mount:
# - /etc/letsencrypt:/etc/letsencrypt:ro

# Update nginx config - uncomment HTTPS server block and redirect
nano nginx/nginx.conf

# Restart services
docker compose up -d
```

#### Option B: Using Cloudflare (if domain is through Cloudflare)

1. Enable "Flexible" or "Full" SSL in Cloudflare
2. Set SSL/TLS encryption mode to "Full (strict)" for maximum security
3. No server-side certificate needed

### 6. Maintenance Commands

```bash
# View logs
docker compose logs -f proposal-share
docker compose logs -f nginx

# Update application
git pull
docker compose build proposal-share
docker compose up -d proposal-share

# Backup database
docker compose exec proposal-share cp /app/data/proposals.db /tmp/
docker cp proposal-share:/tmp/proposals.db ./backup-$(date +%Y%m%d).db

# Restart services
docker compose restart

# Stop services
docker compose down
```

## Architecture

```
Internet → Nginx (Port 80/443) → Proposal Share App (Port 3000)
                                        ↓
                                   SQLite Database (Volume)
```

## Security Features

- **Rate limiting**: API endpoints limited to prevent abuse
- **Security headers**: OWASP recommended headers
- **HTTPS ready**: SSL configuration prepared
- **Database isolation**: SQLite runs in Docker volume
- **Admin authentication**: Secure admin key system

## Monitoring

### Health Checks
- Application has built-in health check endpoint
- Docker automatically restarts unhealthy containers

### Logs
```bash
# Real-time logs
docker compose logs -f

# Last 100 lines
docker compose logs --tail=100

# Specific service logs
docker compose logs nginx
docker compose logs proposal-share
```

## Troubleshooting

### Common Issues

1. **Port 80/443 already in use**
   ```bash
   sudo netstat -tulpn | grep :80
   sudo systemctl stop apache2  # or nginx
   ```

2. **Permission denied for SSL certificates**
   ```bash
   sudo chown -R root:docker /etc/letsencrypt
   sudo chmod -R 750 /etc/letsencrypt
   ```

3. **Database permission issues**
   ```bash
   docker compose down
   sudo chown -R 1001:1001 ./data
   docker compose up -d
   ```

4. **Memory issues**
   ```bash
   # Check memory usage
   docker stats
   
   # Add swap if needed
   sudo fallocate -l 1G /swapfile
   sudo mkswap /swapfile
   sudo swapon /swapfile
   ```

### Debug Mode

```bash
# Run with debug output
NODE_ENV=development docker compose up

# Shell into container
docker compose exec proposal-share /bin/sh
```

## Performance Tuning

### For High Traffic

1. **Enable nginx caching**:
   ```nginx
   # Add to nginx config
   proxy_cache_path /var/cache/nginx levels=1:2 keys_zone=proposals:10m;
   proxy_cache proposals;
   proxy_cache_valid 200 10m;
   ```

2. **Database optimization**:
   ```bash
   # SQLite settings in app
   PRAGMA journal_mode=WAL;
   PRAGMA synchronous=NORMAL;
   PRAGMA cache_size=10000;
   ```

3. **Resource limits**:
   ```yaml
   # Add to docker-compose.yml
   deploy:
     resources:
       limits:
         memory: 512M
         cpus: '1.0'
   ```

## Backup Strategy

### Automated Backup Script

```bash
#!/bin/bash
# save as backup.sh
DATE=$(date +%Y%m%d_%H%M%S)
docker compose exec proposal-share cp /app/data/proposals.db /tmp/
docker cp proposal-share:/tmp/proposals.db ./backups/proposals_$DATE.db
find ./backups -name "proposals_*.db" -mtime +7 -delete
```

### Restore from Backup

```bash
# Stop application
docker compose stop proposal-share

# Replace database
cp backup-20241201.db ./data/proposals.db
sudo chown 1001:1001 ./data/proposals.db

# Start application
docker compose start proposal-share
```

## Support

If you encounter issues:
1. Check logs: `docker compose logs`
2. Verify DNS: `nslookup proposhare.djianco.uk`
3. Test ports: `telnet your-server-ip 80`
4. Check docker status: `docker compose ps`