# Smart Campus Assistant - Production Maintenance Guide

## Table of Contents
1. [Daily Maintenance Tasks](#daily-maintenance-tasks)
2. [Weekly Maintenance Tasks](#weekly-maintenance-tasks)
3. [Monthly Maintenance Tasks](#monthly-maintenance-tasks)
4. [Quarterly Maintenance Tasks](#quarterly-maintenance-tasks)
5. [Emergency Procedures](#emergency-procedures)
6. [Performance Monitoring](#performance-monitoring)
7. [Security Maintenance](#security-maintenance)
8. [Backup and Recovery](#backup-and-recovery)
9. [Log Management](#log-management)
10. [Update Procedures](#update-procedures)

## Daily Maintenance Tasks

### 1. Health Check Monitoring

```bash
# Check application health
curl -f https://your-domain.com/health/detailed

# Check service status
docker-compose ps

# Check resource usage
docker stats --no-stream
```

### 2. Log Review

```bash
# Check for errors in application logs
grep -i "error\|exception\|fatal" logs/app.log | tail -20

# Check nginx access logs for unusual activity
tail -100 logs/nginx/access.log | grep -E "(4[0-9]{2}|5[0-9]{2})"

# Check database logs
docker-compose logs db | grep -i "error" | tail -10
```

### 3. Disk Space Monitoring

```bash
# Check disk usage
df -h

# Check Docker disk usage
docker system df

# Clean up unused Docker resources
docker system prune -f
```

### 4. Database Health

```bash
# Check database connections
docker-compose exec db psql -U postgres -d student_management -c "SELECT count(*) FROM pg_stat_activity;"

# Check for long-running queries
docker-compose exec db psql -U postgres -d student_management -c "SELECT pid, now() - pg_stat_activity.query_start AS duration, query FROM pg_stat_activity WHERE (now() - pg_stat_activity.query_start) > interval '5 minutes';"
```

## Weekly Maintenance Tasks

### 1. Comprehensive Health Check

```bash
# Run full health check
./scripts/health-check.sh

# Check all service endpoints
curl -f https://your-domain.com/health
curl -f https://your-domain.com/api/health
curl -f https://your-domain.com:3001/api/health  # Grafana
curl -f https://your-domain.com:9090/-/healthy   # Prometheus
```

### 2. Log Analysis and Cleanup

```bash
# Analyze error patterns
grep -i "error" logs/app.log | cut -d' ' -f1-3 | sort | uniq -c | sort -nr

# Rotate logs if needed
sudo logrotate -f /etc/logrotate.d/smart-campus

# Clean old logs (keep last 30 days)
find logs/ -name "*.log" -mtime +30 -delete
```

### 3. Performance Review

```bash
# Check response times
curl -w "@curl-format.txt" -o /dev/null -s https://your-domain.com/health

# Review slow queries
docker-compose exec db psql -U postgres -d student_management -c "SELECT query, mean_time, calls FROM pg_stat_statements ORDER BY mean_time DESC LIMIT 10;"

# Check memory usage trends
docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}"
```

### 4. Security Review

```bash
# Check for failed login attempts
grep "401\|403" logs/nginx/access.log | wc -l

# Review authentication logs
grep "authentication" logs/app.log | tail -50

# Check for suspicious activity
grep -E "(sql injection|xss|csrf)" logs/app.log
```

## Monthly Maintenance Tasks

### 1. System Updates

```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Update Docker
sudo apt install docker-ce docker-ce-cli containerd.io docker-compose-plugin

# Update application dependencies
npm audit
npm update
```

### 2. Database Maintenance

```bash
# Run database maintenance
docker-compose exec db psql -U postgres -d student_management -c "VACUUM ANALYZE;"

# Check database size
docker-compose exec db psql -U postgres -d student_management -c "SELECT pg_size_pretty(pg_database_size('student_management'));"

# Review database statistics
docker-compose exec db psql -U postgres -d student_management -c "SELECT schemaname, tablename, n_tup_ins, n_tup_upd, n_tup_del FROM pg_stat_user_tables ORDER BY n_tup_ins DESC;"
```

### 3. Backup Verification

```bash
# Test backup restoration
./scripts/test-backup.sh

# Verify backup integrity
./scripts/verify-backups.sh

# Check backup storage usage
du -sh backups/
```

### 4. SSL Certificate Check

```bash
# Check certificate expiration
openssl x509 -in ssl/cert.pem -noout -dates

# Test SSL configuration
curl -I https://your-domain.com

# Check certificate chain
openssl s_client -connect your-domain.com:443 -servername your-domain.com
```

### 5. Performance Optimization

```bash
# Analyze slow queries
docker-compose exec db psql -U postgres -d student_management -c "SELECT query, mean_time, calls, total_time FROM pg_stat_statements WHERE mean_time > 1000 ORDER BY mean_time DESC;"

# Check index usage
docker-compose exec db psql -U postgres -d student_management -c "SELECT schemaname, tablename, indexname, idx_scan, idx_tup_read, idx_tup_fetch FROM pg_stat_user_indexes ORDER BY idx_scan DESC;"

# Review cache hit ratios
docker-compose exec db psql -U postgres -d student_management -c "SELECT name, setting, unit FROM pg_settings WHERE name IN ('shared_buffers', 'effective_cache_size', 'work_mem');"
```

## Quarterly Maintenance Tasks

### 1. Security Audit

```bash
# Run security scan
./scripts/security-audit.sh

# Check for vulnerabilities
npm audit --audit-level=high

# Review access logs for patterns
./scripts/analyze-access-logs.sh
```

### 2. Capacity Planning

```bash
# Analyze resource usage trends
./scripts/capacity-analysis.sh

# Check database growth
docker-compose exec db psql -U postgres -d student_management -c "SELECT schemaname, tablename, pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size FROM pg_tables WHERE schemaname = 'public' ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;"

# Review storage usage
df -h
du -sh /var/lib/docker
```

### 3. Disaster Recovery Testing

```bash
# Test backup restoration
./scripts/test-disaster-recovery.sh

# Verify monitoring systems
./scripts/test-monitoring.sh

# Test failover procedures
./scripts/test-failover.sh
```

### 4. Documentation Review

- Update deployment documentation
- Review and update runbooks
- Update contact information
- Review security procedures

## Emergency Procedures

### 1. Application Down

```bash
# Check service status
docker-compose ps

# Restart services
docker-compose restart

# Check logs for errors
docker-compose logs --tail=100

# If database issues, check database
docker-compose exec db pg_isready -U postgres
```

### 2. Database Issues

```bash
# Check database status
docker-compose exec db pg_isready -U postgres

# Check database logs
docker-compose logs db

# Restart database
docker-compose restart db

# If corruption, restore from backup
./scripts/restore-database.sh
```

### 3. High Memory Usage

```bash
# Check memory usage
free -h
docker stats

# Restart services
docker-compose restart

# Check for memory leaks
docker-compose logs backend | grep -i "memory\|leak"
```

### 4. Security Incident

```bash
# Isolate affected services
docker-compose stop

# Check logs for suspicious activity
grep -i "attack\|injection\|unauthorized" logs/app.log

# Review access logs
grep -E "(4[0-9]{2}|5[0-9]{2})" logs/nginx/access.log

# Contact security team
# Implement emergency procedures
```

## Performance Monitoring

### 1. Key Metrics to Monitor

- **Response Time**: < 2 seconds for 95th percentile
- **Error Rate**: < 1% of total requests
- **CPU Usage**: < 80% average
- **Memory Usage**: < 85% average
- **Disk Usage**: < 90% average
- **Database Connections**: < 80% of max connections

### 2. Monitoring Commands

```bash
# Check response times
curl -w "@curl-format.txt" -o /dev/null -s https://your-domain.com/health

# Monitor resource usage
watch -n 5 'docker stats --no-stream'

# Check database performance
docker-compose exec db psql -U postgres -d student_management -c "SELECT * FROM pg_stat_activity WHERE state = 'active';"
```

### 3. Alerting Thresholds

- **Critical**: Response time > 5s, Error rate > 5%, CPU > 95%
- **Warning**: Response time > 2s, Error rate > 1%, CPU > 80%
- **Info**: Response time > 1s, Error rate > 0.5%, CPU > 60%

## Security Maintenance

### 1. Regular Security Tasks

```bash
# Check for security updates
sudo apt list --upgradable

# Review failed login attempts
grep "401\|403" logs/nginx/access.log | tail -100

# Check for suspicious IPs
grep -E "(4[0-9]{2}|5[0-9]{2})" logs/nginx/access.log | awk '{print $1}' | sort | uniq -c | sort -nr
```

### 2. Security Monitoring

```bash
# Monitor authentication failures
grep "authentication failed" logs/app.log | tail -50

# Check for SQL injection attempts
grep -i "union\|select\|insert\|delete\|drop" logs/nginx/access.log

# Review file upload attempts
grep "POST.*upload" logs/nginx/access.log
```

## Backup and Recovery

### 1. Backup Verification

```bash
# Test backup integrity
./scripts/verify-backups.sh

# Check backup age
ls -la backups/

# Test restoration process
./scripts/test-backup-restore.sh
```

### 2. Recovery Procedures

```bash
# Database recovery
./scripts/restore-database.sh backup_file.sql

# Full system recovery
./scripts/restore-full-system.sh backup_file.tar.gz

# Configuration recovery
./scripts/restore-config.sh config_backup.tar.gz
```

## Log Management

### 1. Log Rotation

```bash
# Configure log rotation
sudo nano /etc/logrotate.d/smart-campus

# Manual log rotation
sudo logrotate -f /etc/logrotate.d/smart-campus
```

### 2. Log Analysis

```bash
# Analyze error patterns
grep -i "error" logs/app.log | cut -d' ' -f1-3 | sort | uniq -c | sort -nr

# Check access patterns
awk '{print $1}' logs/nginx/access.log | sort | uniq -c | sort -nr | head -20

# Monitor response times
awk '{print $NF}' logs/nginx/access.log | sort -n | tail -100
```

## Update Procedures

### 1. Application Updates

```bash
# Backup before update
./scripts/backup.sh --type full

# Pull latest changes
git pull origin main

# Deploy update
./scripts/deploy.sh

# Verify update
curl -f https://your-domain.com/health
```

### 2. System Updates

```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Update Docker
sudo apt install docker-ce docker-ce-cli containerd.io

# Restart services
sudo systemctl restart docker
docker-compose restart
```

### 3. Database Updates

```bash
# Backup database
./scripts/backup.sh --type database

# Run migrations
./scripts/migrate.sh

# Verify migration
docker-compose exec backend npx prisma db push
```

## Maintenance Checklist

### Daily
- [ ] Check application health
- [ ] Review error logs
- [ ] Monitor disk space
- [ ] Check database connections

### Weekly
- [ ] Comprehensive health check
- [ ] Log analysis and cleanup
- [ ] Performance review
- [ ] Security review

### Monthly
- [ ] System updates
- [ ] Database maintenance
- [ ] Backup verification
- [ ] SSL certificate check
- [ ] Performance optimization

### Quarterly
- [ ] Security audit
- [ ] Capacity planning
- [ ] Disaster recovery testing
- [ ] Documentation review

---

**Last Updated**: $(date)
**Version**: 1.0.0
**Maintainer**: Smart Campus Assistant Team
