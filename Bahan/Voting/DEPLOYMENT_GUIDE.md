# DEPLOYMENT & OPERATIONS GUIDE

## 1. PRE-DEPLOYMENT CHECKLIST

### Frontend
- [ ] Responsive design tested on iOS dan Android
- [ ] All links dan buttons functional
- [ ] Form validation working properly
- [ ] Error messages clear dan helpful
- [ ] Loading states implemented
- [ ] No console errors di production build
- [ ] Images optimized (compressed)
- [ ] Smooth animations di mobile
- [ ] Accessibility: ARIA labels, keyboard navigation
- [ ] Offline handling (optional - service worker)

### Backend
- [ ] All API endpoints tested
- [ ] Input validation on all routes
- [ ] Error handling comprehensive
- [ ] Database schema finalized
- [ ] SQL injection prevention (prepared statements)
- [ ] CORS properly configured
- [ ] Environment variables configured
- [ ] Logging implemented
- [ ] Rate limiting configured (optional)
- [ ] Database backups automated

### Security
- [ ] HTTPS/SSL certificate installed
- [ ] Session security configured
- [ ] CSRF tokens implemented
- [ ] Input sanitization active
- [ ] Admin credentials secured
- [ ] Database credentials secured
- [ ] No sensitive data in logs
- [ ] API rate limiting enabled
- [ ] Security headers set

### Testing
- [ ] Unit tests passing
- [ ] Integration tests passing
- [ ] Load testing completed
- [ ] Browser compatibility tested
- [ ] Mobile device testing completed
- [ ] Edge cases handled
- [ ] Error scenarios tested

---

## 2. LOCAL DEVELOPMENT SETUP

### Prerequisites
```bash
# Install Node.js
https://nodejs.org/

# Install Git
https://git-scm.com/

# Verify installation
node --version
npm --version
```

### Setup Development Environment
```bash
# Clone repository
git clone <repository-url>
cd voting-app

# Install dependencies
npm install

# Create .env file
cp .env.example .env

# Start development server
npm run dev

# Frontend akan accessible di http://localhost:3000
```

### .env Configuration (Development)
```
NODE_ENV=development
PORT=3000
DATABASE_URL=./database.db
SESSION_SECRET=dev-secret-key
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin123
CORS_ORIGIN=http://localhost:3000
```

---

## 3. PRODUCTION DEPLOYMENT

### Option A: Heroku (Easy)

#### Step 1: Install Heroku CLI
```bash
# macOS
brew install heroku/brew/heroku

# Windows/Linux
# Download dari https://devcenter.heroku.com/articles/heroku-cli
```

#### Step 2: Login & Create App
```bash
heroku login
heroku create voting-app-kampus
```

#### Step 3: Set Environment Variables
```bash
heroku config:set NODE_ENV=production
heroku config:set SESSION_SECRET=your-secret-key
heroku config:set ADMIN_USERNAME=admin
heroku config:set ADMIN_PASSWORD=secure-password
```

#### Step 4: Deploy
```bash
git push heroku main
heroku logs --tail
```

### Option B: VPS/Dedicated Server (AWS, DigitalOcean, etc)

#### Step 1: SSH ke Server
```bash
ssh root@server-ip
```

#### Step 2: Install Node.js & PostgreSQL
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install PostgreSQL (optional, for production DB)
sudo apt install -y postgresql postgresql-contrib
```

#### Step 3: Setup Application
```bash
# Create app directory
mkdir /var/www/voting-app
cd /var/www/voting-app

# Clone repository
git clone <repository-url> .

# Install dependencies
npm install --production

# Create .env file
nano .env
```

#### Step 4: Setup PM2 (Process Manager)
```bash
# Install PM2 globally
sudo npm install -g pm2

# Start application
pm2 start server.js --name "voting-app"

# Setup auto-start on reboot
pm2 startup
pm2 save
```

#### Step 5: Setup Nginx (Reverse Proxy)
```bash
# Install Nginx
sudo apt install -y nginx

# Create Nginx config
sudo nano /etc/nginx/sites-available/default
```

**Nginx Configuration:**
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # API endpoints
    location /api/ {
        proxy_pass http://localhost:3000/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

```bash
# Test Nginx config
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
```

#### Step 6: Setup SSL Certificate (Let's Encrypt)
```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Generate certificate
sudo certbot certonly --nginx -d your-domain.com

# Auto-renew
sudo certbot renew --dry-run
```

#### Step 7: Setup Database Backup
```bash
# Create backup script
sudo nano /usr/local/bin/backup-voting-db.sh
```

**Backup Script:**
```bash
#!/bin/bash
BACKUP_DIR="/var/backups/voting-app"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
DB_PATH="/var/www/voting-app/database.db"

mkdir -p $BACKUP_DIR
cp $DB_PATH $BACKUP_DIR/database_$TIMESTAMP.db

# Keep only last 30 days
find $BACKUP_DIR -name "database_*.db" -mtime +30 -delete
```

```bash
# Make executable
sudo chmod +x /usr/local/bin/backup-voting-db.sh

# Add to crontab (daily backup at 2 AM)
sudo crontab -e
# Add: 0 2 * * * /usr/local/bin/backup-voting-db.sh
```

---

## 4. TESTING GUIDE

### Unit Testing (Frontend)
```bash
# Setup Jest
npm install --save-dev jest @babel/preset-env

# Create test file
cat > app.test.js << 'EOF'
describe('App Functions', () => {
  test('formatDate should format correctly', () => {
    const date = new Date('2003-01-15');
    const result = formatDate(date);
    expect(result).toBe('15-01-2003');
  });

  test('validateNIM should accept 9 digits', () => {
    expect(validateNIM('123456789')).toBe(true);
    expect(validateNIM('12345678')).toBe(false);
    expect(validateNIM('ABC123456')).toBe(false);
  });
});
EOF

# Run tests
npm test
```

### API Testing (Backend)
```bash
# Install Postman or use curl

# Test login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"nim":"123456789", "dob":"15-01-2003"}'

# Test get candidates
curl http://localhost:3000/api/voting/candidates

# Test submit vote
curl -X POST http://localhost:3000/api/voting/submit \
  -H "Content-Type: application/json" \
  -d '{"candidateId":1}' \
  -H "Cookie: sessionid=..."

# Test results
curl http://localhost:3000/api/voting/results
```

### Load Testing
```bash
# Install Apache Bench
sudo apt install -y apache2-utils

# Test login endpoint
ab -n 100 -c 10 -p login.json \
  -T application/json \
  http://localhost:3000/api/auth/login

# Test get candidates
ab -n 1000 -c 50 http://localhost:3000/api/voting/candidates
```

### Browser Testing Checklist
```
[ ] Chrome/Chromium - Desktop
[ ] Firefox - Desktop
[ ] Safari - Desktop
[ ] Chrome Mobile - Android
[ ] Safari Mobile - iOS
[ ] Edge - Windows
[ ] Landscape mode - Mobile
[ ] Accessibility - Keyboard navigation
[ ] Accessibility - Screen reader
[ ] Network throttling - Slow 3G
```

### Functional Test Cases
```
LOGIN
[ ] Valid NIM + DOB → Success
[ ] Invalid NIM → Error
[ ] Missing DOB → Error
[ ] User sudah voting → Error message

VOTING
[ ] Lihat semua kandidat
[ ] Pilih kandidat → Confirmation screen
[ ] Kembali dari confirmation → Voting screen
[ ] Konfirmasi pilihan → Success screen

PREVENT DOUBLE VOTING
[ ] User tidak bisa voting 2x
[ ] Session check working
[ ] Database flag `has_voted` updated

RESULTS
[ ] Vote count updated
[ ] Percentage calculated correctly
[ ] Real-time update working
```

---

## 5. MONITORING & MAINTENANCE

### Logging
```javascript
// Add logging to server.js
const fs = require('fs');
const logStream = fs.createWriteStream('voting-app.log', { flags: 'a' });

app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  const log = `${timestamp} ${req.method} ${req.url}`;
  logStream.write(log + '\n');
  next();
});
```

### Health Check
```javascript
// Add health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});
```

### Monitoring Tools
- **PM2 Monitoring**: `pm2 plus` - Real-time monitoring
- **Nginx Logs**: Check `/var/log/nginx/access.log`
- **Application Logs**: Custom logging in code
- **Uptime Monitoring**: Uptimerobot.com (free tier)

### Daily Checklist
```
[ ] Check application logs for errors
[ ] Verify database backups completed
[ ] Monitor server CPU & memory usage
[ ] Check voting counts are accurate
[ ] Verify SSL certificate is valid
[ ] Test admin import functionality
[ ] Review user feedback
```

---

## 6. TROUBLESHOOTING

### Application Won't Start
```bash
# Check logs
pm2 logs voting-app

# Restart application
pm2 restart voting-app

# Check Node.js version
node --version  # Should be v14+

# Check dependencies
npm list
```

### Database Issues
```bash
# Check database file exists
ls -la /var/www/voting-app/database.db

# Backup database
cp database.db database.backup.db

# Restore if needed
cp database.backup.db database.db

# Check database integrity
sqlite3 database.db "PRAGMA integrity_check;"
```

### Performance Issues
```bash
# Check server resources
top -b -n 1

# Check Node.js memory usage
node --max-old-space-size=4096 server.js

# Clear logs if too large
truncate -s 0 voting-app.log
```

### SSL Certificate Issues
```bash
# Check certificate validity
openssl x509 -in /etc/letsencrypt/live/domain/cert.pem -text -noout

# Renew certificate
sudo certbot renew

# Check auto-renewal
sudo certbot renew --dry-run
```

---

## 7. POST-LAUNCH TASKS

### After Voting is Complete
1. **Export Results**
   ```bash
   # Export to CSV
   sqlite3 database.db ".mode csv" \
     "SELECT c.nomor_urut, c.nama, c.vote_count, \
             ROUND(100.0 * c.vote_count / SUM(c.vote_count) OVER (), 2) as percentage \
      FROM candidates c \
      ORDER BY c.vote_count DESC;" > results.csv
   ```

2. **Archive Database**
   ```bash
   tar -czf voting-db-backup-$(date +%Y%m%d).tar.gz database.db
   ```

3. **Disable Voting**
   - Set `has_voted = 1` untuk semua users
   - Atau set feature flag untuk disable voting

4. **Generate Report**
   - Export hasil ke Excel
   - Create summary statistics
   - Generate certificates untuk pemenang

---

## 8. DISASTER RECOVERY

### Backup Strategy
```bash
# Daily backup
0 2 * * * /usr/local/bin/backup-voting-db.sh

# Keep 30 days of backups
# Backup to external storage (AWS S3, Google Cloud, etc)
```

### Restore Procedure
```bash
# Stop application
pm2 stop voting-app

# Restore from backup
cp /var/backups/voting-app/database_BACKUP.db /var/www/voting-app/database.db

# Start application
pm2 start voting-app
```

---

## 9. COMPLIANCE & SECURITY

### Data Protection
- [ ] Personal data encrypted in transit (HTTPS)
- [ ] Backups stored securely
- [ ] Access logs maintained
- [ ] Audit trail for all voting
- [ ] Compliance with privacy regulations

### Security Updates
- [ ] Node.js kept up-to-date
- [ ] Dependencies updated regularly
- [ ] Security patches applied immediately
- [ ] SSL certificates renewed before expiry

---

*Deployment & Operations v1.0 - Complete Guide*
