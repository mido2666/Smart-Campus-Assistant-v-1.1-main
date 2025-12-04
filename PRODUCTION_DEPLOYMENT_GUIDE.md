# Smart Campus Assistant - Production Deployment Guide

## Table of Contents
1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Environment Setup](#environment-setup)
4. [Database Configuration](#database-configuration)
5. [SSL Certificate Setup](#ssl-certificate-setup)
6. [Deployment Process](#deployment-process)
7. [Monitoring Setup](#monitoring-setup)
8. [Backup Configuration](#backup-configuration)
9. [Security Configuration](#security-configuration)
10. [Troubleshooting](#troubleshooting)
11. [Maintenance](#maintenance)

## Overview

This guide provides comprehensive instructions for deploying the Smart Campus Assistant to production. The application is containerized using Docker and includes monitoring, logging, and backup systems.

## Prerequisites

### System Requirements
- **OS**: Ubuntu 20.04 LTS or later (recommended)
- **CPU**: 4 cores minimum, 8 cores recommended
- **RAM**: 8GB minimum, 16GB recommended
- **Storage**: 100GB SSD minimum, 500GB recommended
- **Network**: Stable internet connection with static IP

### Software Requirements
- Docker 20.10+
- Docker Compose 2.0+
- Git 2.30+
- Node.js 18+ (for local development)
- PostgreSQL 15+ (if not using Docker)
- Redis 7+ (if not using Docker)

### Domain and SSL
- Domain name pointing to your server
- SSL certificate (Let's Encrypt recommended)

## Environment Setup

### 1. Server Preparation

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Install Git
sudo apt install git -y
```

### 2. Clone Repository

```bash
# Clone the repository
git clone https://github.com/your-username/smart-campus-assistant.git
cd smart-campus-assistant

# Create necessary directories
mkdir -p logs backups ssl uploads
```

### 3. Environment Configuration

```bash
# Copy environment template
cp env.production.example .env

# Edit environment variables
nano .env
```

**Required Environment Variables:**
```bash
# Application
NODE_ENV=production
APP_URL=https://your-domain.com

# Database
DATABASE_URL=postgresql://postgres:your_secure_password@db:5432/student_management
POSTGRES_PASSWORD=your_secure_password

# JWT Secrets (generate strong secrets)
JWT_SECRET=your_super_secure_jwt_secret_key_here_minimum_32_characters
SESSION_SECRET=your_super_secure_session_secret_key_here_minimum_32_characters

# OpenAI API
OPENAI_API_KEY=your_openai_api_key_here

# Email Service
EMAIL_SERVICE_API_KEY=your_email_service_api_key
SMTP_HOST=smtp.your-provider.com
SMTP_USER=your_smtp_username
SMTP_PASS=your_smtp_password

# Monitoring
SENTRY_DSN=your_sentry_dsn_here
GRAFANA_ADMIN_PASSWORD=your_grafana_admin_password
```

## Database Configuration

### 1. Database Initialization

```bash
# Start database service
docker-compose up -d db

# Wait for database to be ready
docker-compose exec db pg_isready -U postgres

# Run migrations
./scripts/migrate.sh
```

### 2. Database Optimization

The production database is configured with the following optimizations:
- Connection pooling (max 200 connections)
- Shared buffers: 256MB
- Effective cache size: 1GB
- Query statistics tracking enabled
- Automatic vacuum and analyze

### 3. Database Backup

```bash
# Create initial backup
./scripts/backup.sh --type database

# Set up automated backups (crontab)
crontab -e

# Add this line for daily backups at 2 AM
0 2 * * * /path/to/smart-campus-assistant/scripts/backup.sh --type database
```

## SSL Certificate Setup

### 1. Using Let's Encrypt (Recommended)

```bash
# Install Certbot
sudo apt install certbot -y

# Obtain SSL certificate
sudo certbot certonly --standalone -d your-domain.com

# Copy certificates to project directory
sudo cp /etc/letsencrypt/live/your-domain.com/fullchain.pem ssl/cert.pem
sudo cp /etc/letsencrypt/live/your-domain.com/privkey.pem ssl/key.pem
sudo chown $USER:$USER ssl/*.pem
```

### 2. Certificate Renewal

```bash
# Test renewal
sudo certbot renew --dry-run

# Set up automatic renewal
sudo crontab -e

# Add this line for monthly renewal check
0 3 1 * * certbot renew --quiet && cp /etc/letsencrypt/live/your-domain.com/fullchain.pem /path/to/smart-campus-assistant/ssl/cert.pem && cp /etc/letsencrypt/live/your-domain.com/privkey.pem /path/to/smart-campus-assistant/ssl/key.pem && docker-compose restart frontend
```

## Deployment Process

### 1. Initial Deployment

```bash
# Build and deploy
./scripts/deploy.sh

# Verify deployment
curl -f https://your-domain.com/health
```

### 2. Automated Deployment (CI/CD)

The application includes GitHub Actions workflows for automated deployment:

- **Staging**: Deploys to staging environment on `develop` branch
- **Production**: Deploys to production environment on `main` branch

### 3. Manual Deployment

```bash
# Pull latest changes
git pull origin main

# Deploy with backup
./scripts/deploy.sh

# Or deploy without backup (faster)
./scripts/deploy.sh --no-backup
```

## Monitoring Setup

### 1. Access Monitoring Dashboards

- **Grafana**: http://your-domain.com:3001
  - Username: admin
  - Password: (from GRAFANA_ADMIN_PASSWORD)

- **Prometheus**: http://your-domain.com:9090

### 2. Health Checks

The application provides several health check endpoints:

- `/health` - Basic health check
- `/health/detailed` - Detailed health check with all services
- `/health/ready` - Readiness probe
- `/health/live` - Liveness probe
- `/health/metrics` - Prometheus metrics

### 3. Alerting

Configure alerting in Grafana or use the included Alertmanager configuration:

```bash
# Edit alert rules
nano monitoring/rules/alerts.yml

# Update notification channels
nano monitoring/alertmanager.yml
```

## Backup Configuration

### 1. Database Backups

```bash
# Manual backup
./scripts/backup.sh --type database

# Full backup (database + uploads + config)
./scripts/backup.sh --type full

# Backup with S3 upload
./scripts/backup.sh --type database
```

### 2. Automated Backups

```bash
# Set up cron job for daily backups
crontab -e

# Add these lines:
0 2 * * * /path/to/smart-campus-assistant/scripts/backup.sh --type database
0 3 * * 0 /path/to/smart-campus-assistant/scripts/backup.sh --type full
```

### 3. Backup Restoration

```bash
# Stop application
docker-compose down

# Restore database
docker-compose up -d db
docker-compose exec -T db psql -U postgres -d student_management < backup.sql

# Start application
docker-compose up -d
```

## Security Configuration

### 1. Firewall Setup

```bash
# Install UFW
sudo apt install ufw -y

# Configure firewall
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

### 2. Security Headers

The application includes security headers configured in nginx:
- X-Frame-Options: DENY
- X-Content-Type-Options: nosniff
- X-XSS-Protection: 1; mode=block
- Strict-Transport-Security: max-age=31536000

### 3. Rate Limiting

Rate limiting is configured for:
- API endpoints: 10 requests/second
- Authentication endpoints: 5 requests/minute

## Troubleshooting

### Common Issues

#### 1. Application Won't Start

```bash
# Check logs
docker-compose logs backend
docker-compose logs frontend

# Check health
curl -f http://localhost/health/detailed
```

#### 2. Database Connection Issues

```bash
# Check database status
docker-compose exec db pg_isready -U postgres

# Check database logs
docker-compose logs db

# Test connection
docker-compose exec backend npx prisma db push
```

#### 3. SSL Certificate Issues

```bash
# Check certificate validity
openssl x509 -in ssl/cert.pem -text -noout

# Test SSL
curl -I https://your-domain.com
```

#### 4. High Memory Usage

```bash
# Check memory usage
docker stats

# Restart services
docker-compose restart
```

### Log Analysis

```bash
# View application logs
tail -f logs/app.log

# View nginx logs
tail -f logs/nginx/access.log
tail -f logs/nginx/error.log

# View Docker logs
docker-compose logs -f
```

## Maintenance

### 1. Regular Maintenance Tasks

#### Weekly
- Review application logs
- Check disk space usage
- Verify backup integrity
- Update security patches

#### Monthly
- Review monitoring dashboards
- Update dependencies
- Test disaster recovery procedures
- Review SSL certificate expiration

#### Quarterly
- Security audit
- Performance optimization review
- Capacity planning
- Documentation updates

### 2. Updates and Upgrades

```bash
# Update application
git pull origin main
./scripts/deploy.sh

# Update system packages
sudo apt update && sudo apt upgrade -y

# Update Docker images
docker-compose pull
docker-compose up -d
```

### 3. Scaling

#### Horizontal Scaling
- Use load balancer (nginx, HAProxy)
- Deploy multiple backend instances
- Use external database (RDS, managed PostgreSQL)

#### Vertical Scaling
- Increase server resources
- Optimize database configuration
- Implement caching strategies

### 4. Disaster Recovery

#### Recovery Procedures
1. **Database Recovery**: Restore from latest backup
2. **Application Recovery**: Redeploy from source code
3. **Full System Recovery**: Restore from full backup

#### Recovery Time Objectives (RTO)
- Database recovery: 15 minutes
- Application recovery: 5 minutes
- Full system recovery: 30 minutes

#### Recovery Point Objectives (RPO)
- Database: 1 hour (daily backups)
- Application: 0 (source code in Git)
- Configuration: 1 hour (backup frequency)

## Support and Documentation

### Additional Resources
- [User Manual](docs/USER_MANUAL.md)
- [API Documentation](docs/api/swagger.ts)
- [Development Guide](README.md)
- [Security Policy](SECURITY.md)

### Contact Information
- **Technical Support**: support@your-domain.com
- **Security Issues**: security@your-domain.com
- **General Inquiries**: info@your-domain.com

### Monitoring and Alerts
- **Grafana Dashboard**: http://your-domain.com:3001
- **Prometheus Metrics**: http://your-domain.com:9090
- **Health Check**: https://your-domain.com/health

---

**Last Updated**: $(date)
**Version**: 1.0.0
**Maintainer**: Smart Campus Assistant Team
