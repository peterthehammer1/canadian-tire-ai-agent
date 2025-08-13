# Canadian Tire AI Agent - Deployment Guide

This guide covers deploying the Canadian Tire AI Customer Service Agent to production environments.

## 🚀 Prerequisites

- Node.js 18+ installed
- npm or yarn package manager
- Retell AI account and API key
- Production server (VPS, cloud platform, or container environment)
- Domain name (optional but recommended)
- SSL certificate for HTTPS

## 📋 Pre-Deployment Checklist

- [ ] Retell AI API key obtained and tested
- [ ] Environment variables configured
- [ ] Database setup (if using persistent storage)
- [ ] SSL certificate obtained
- [ ] Domain DNS configured
- [ ] Firewall rules configured
- [ ] Monitoring and logging setup

## 🏗️ Production Environment Setup

### 1. Server Preparation

#### Ubuntu/Debian Server
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2 for process management
sudo npm install -g pm2

# Install Nginx for reverse proxy
sudo apt install nginx -y

# Install Certbot for SSL
sudo apt install certbot python3-certbot-nginx -y
```

#### CentOS/RHEL Server
```bash
# Update system
sudo yum update -y

# Install Node.js 18+
curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
sudo yum install -y nodejs

# Install PM2
sudo npm install -g pm2

# Install Nginx
sudo yum install nginx -y

# Install Certbot
sudo yum install certbot python3-certbot-nginx -y
```

### 2. Application Deployment

```bash
# Clone repository
git clone <your-repo-url>
cd canadian-tire-ai-agent

# Install dependencies
npm install --production

# Create production environment file
cp env.example .env
nano .env
```

#### Production Environment Variables
```env
# Retell AI Configuration
RETELL_API_KEY=your_production_api_key

# Server Configuration
PORT=3000
NODE_ENV=production

# Database Configuration (if using)
DATABASE_URL=your_production_database_url
REDIS_URL=your_production_redis_url

# Security
JWT_SECRET=your_very_secure_jwt_secret
CORS_ORIGIN=https://yourdomain.com

# Logging
LOG_LEVEL=info
LOG_FILE=/var/log/canadian-tire-ai/app.log

# Monitoring
SENTRY_DSN=your_sentry_dsn_if_using
```

### 3. Process Management with PM2

Create a PM2 ecosystem file:

```bash
# Create ecosystem file
nano ecosystem.config.js
```

```javascript
module.exports = {
  apps: [{
    name: 'canadian-tire-ai-agent',
    script: 'index.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'development'
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: '/var/log/canadian-tire-ai/err.log',
    out_file: '/var/log/canadian-tire-ai/out.log',
    log_file: '/var/log/canadian-tire-ai/combined.log',
    time: true,
    max_memory_restart: '1G',
    restart_delay: 4000,
    max_restarts: 10
  }]
};
```

Start the application:
```bash
# Create log directory
sudo mkdir -p /var/log/canadian-tire-ai
sudo chown $USER:$USER /var/log/canadian-tire-ai

# Start with PM2
pm2 start ecosystem.config.js --env production

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup
```

### 4. Nginx Reverse Proxy Configuration

Create Nginx configuration:
```bash
sudo nano /etc/nginx/sites-available/canadian-tire-ai
```

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;

    # Security Headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains";

    # Rate Limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    limit_req zone=api burst=20 nodelay;

    # Proxy Configuration
    location / {
        proxy_pass http://localhost:3000;
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

    # API Rate Limiting
    location /api/ {
        limit_req zone=api burst=20 nodelay;
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Health Check (no rate limiting)
    location /health {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
    }
}
```

Enable the site:
```bash
sudo ln -s /etc/nginx/sites-available/canadian-tire-ai /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 5. SSL Certificate with Let's Encrypt

```bash
# Obtain SSL certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Test auto-renewal
sudo certbot renew --dry-run
```

### 6. Firewall Configuration

```bash
# Configure UFW firewall
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

## 🗄️ Database Setup (Production)

### PostgreSQL Setup
```bash
# Install PostgreSQL
sudo apt install postgresql postgresql-contrib -y

# Create database and user
sudo -u postgres psql
CREATE DATABASE canadian_tire_ai;
CREATE USER canadian_tire_user WITH ENCRYPTED PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE canadian_tire_ai TO canadian_tire_user;
\q

# Update environment variables
echo "DATABASE_URL=postgresql://canadian_tire_user:your_secure_password@localhost:5432/canadian_tire_ai" >> .env
```

### Redis Setup (for caching)
```bash
# Install Redis
sudo apt install redis-server -y

# Secure Redis
sudo nano /etc/redis/redis.conf
# Set: requirepass your_redis_password

# Restart Redis
sudo systemctl restart redis

# Update environment variables
echo "REDIS_URL=redis://:your_redis_password@localhost:6379" >> .env
```

## 📊 Monitoring and Logging

### 1. Application Monitoring
```bash
# PM2 monitoring
pm2 monit

# PM2 logs
pm2 logs canadian-tire-ai-agent

# System monitoring
htop
```

### 2. Log Rotation
```bash
sudo nano /etc/logrotate.d/canadian-tire-ai
```

```
/var/log/canadian-tire-ai/*.log {
    daily
    missingok
    rotate 52
    compress
    delaycompress
    notifempty
    create 644 $USER $USER
    postrotate
        pm2 reloadLogs
    endscript
}
```

### 3. Health Check Monitoring
```bash
# Create monitoring script
nano monitor.sh
```

```bash
#!/bin/bash
HEALTH_CHECK_URL="https://yourdomain.com/health"
LOG_FILE="/var/log/canadian-tire-ai/health-check.log"

response=$(curl -s -o /dev/null -w "%{http_code}" $HEALTH_CHECK_URL)
timestamp=$(date '+%Y-%m-%d %H:%M:%S')

if [ $response -eq 200 ]; then
    echo "$timestamp - Health check passed (HTTP $response)" >> $LOG_FILE
else
    echo "$timestamp - Health check failed (HTTP $response)" >> $LOG_FILE
    # Restart application
    pm2 restart canadian-tire-ai-agent
    echo "$timestamp - Application restarted" >> $LOG_FILE
fi
```

```bash
chmod +x monitor.sh
# Add to crontab: */5 * * * * /path/to/monitor.sh
```

## 🔒 Security Considerations

### 1. Environment Security
- Use strong, unique passwords
- Rotate API keys regularly
- Limit file permissions
- Use non-root user for application

### 2. Network Security
- Enable firewall
- Use HTTPS only
- Implement rate limiting
- Monitor access logs

### 3. Application Security
- Validate all inputs
- Implement proper error handling
- Use HTTPS for all external communications
- Regular security updates

## 📈 Scaling Considerations

### 1. Load Balancing
- Use multiple application instances
- Implement Redis session sharing
- Consider CDN for static assets

### 2. Database Scaling
- Read replicas for reporting
- Connection pooling
- Query optimization

### 3. Caching Strategy
- Redis for session storage
- Application-level caching
- CDN for static content

## 🚨 Troubleshooting

### Common Issues

1. **Application won't start**
   ```bash
   pm2 logs canadian-tire-ai-agent
   check .env file configuration
   verify port availability
   ```

2. **Nginx errors**
   ```bash
   sudo nginx -t
   sudo systemctl status nginx
   check SSL certificate validity
   ```

3. **Database connection issues**
   ```bash
   verify DATABASE_URL in .env
   check PostgreSQL service status
   verify firewall rules
   ```

### Performance Tuning

1. **Node.js optimization**
   ```bash
   # Increase memory limit
   export NODE_OPTIONS="--max-old-space-size=4096"
   ```

2. **Nginx optimization**
   ```nginx
   # Enable gzip compression
   gzip on;
   gzip_types text/plain text/css application/json application/javascript;
   ```

## 📋 Deployment Checklist

- [ ] Server prepared and secured
- [ ] Application deployed and running
- [ ] Environment variables configured
- [ ] Database connected and tested
- [ ] Nginx reverse proxy configured
- [ ] SSL certificate installed
- [ ] Firewall configured
- [ ] Monitoring setup
- [ ] Logging configured
- [ ] Health checks working
- [ ] Performance tested
- [ ] Security audit completed
- [ ] Backup strategy implemented
- [ ] Documentation updated

## 🔄 Update Process

```bash
# Pull latest changes
git pull origin main

# Install dependencies
npm install --production

# Restart application
pm2 restart canadian-tire-ai-agent

# Verify deployment
curl -s https://yourdomain.com/health
```

## 📞 Support

For deployment issues:
1. Check application logs: `pm2 logs`
2. Check system logs: `sudo journalctl -u nginx`
3. Verify configuration files
4. Test individual components
5. Check monitoring dashboards

---

**Remember**: Always test deployments in a staging environment first, and maintain regular backups of your production data and configuration.
