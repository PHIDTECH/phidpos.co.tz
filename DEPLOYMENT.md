# PhidPOS — DigitalOcean Deployment Guide

**Server IP:** `209.97.191.239`  
**Domain:** `www.phidpos.co.tz` / `phidpos.co.tz`  
**GitHub:** `git@github.com:PHIDTECH/phidpos.co.tz.git`  

> ⚠️ **This droplet hosts another site. This guide adds PhidPOS as a new virtual host — it does NOT modify or remove any existing Nginx sites.**

---

## Overview

The app runs with:
- **Docker** — containerizes the Next.js app
- **PostgreSQL 16** — runs in a Docker container
- **Nginx** — reverse proxy on port 80 → app on port 3000

---

## Step 1: Prepare Files on Your Local Machine

Before uploading to the server, generate a strong secret:

```bash
# Generate NEXTAUTH_SECRET (run this in any terminal)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Edit `.env.production`, fill in all values:

```env
DATABASE_URL="postgresql://phidpos:YOUR_STRONG_DB_PASSWORD@localhost:5432/phidpos"
NEXTAUTH_URL="http://209.97.191.239"
NEXTAUTH_SECRET="PASTE_GENERATED_SECRET_HERE"
NEXT_PUBLIC_APP_URL="http://209.97.191.239"
```

---

## Step 2: Push Code to GitHub

```bash
# On your local machine (Windows PowerShell)
cd C:\xampp\htdocs\phidpos.co.tz

git init
git add .
git commit -m "Initial production deployment"
git remote add origin git@github.com:PHIDTECH/phidpos.co.tz.git
git branch -M main
git push -u origin main
```

---

## Step 3: SSH into DigitalOcean Droplet

```bash
ssh root@209.97.191.239
```

---

## Step 4: Run Deployment Script

```bash
# Download and run the deploy script
curl -o deploy.sh https://raw.githubusercontent.com/YOUR_USERNAME/phidpos/main/deploy.sh
bash deploy.sh
```

**OR** do it manually:

```bash
# Install Docker
apt-get update && apt-get install -y ca-certificates curl
install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
chmod a+r /etc/apt/keyrings/docker.gpg
echo "deb [arch=amd64 signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu jammy stable" \
  | tee /etc/apt/sources.list.d/docker.list
apt-get update && apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

# Install Nginx & Git
apt-get install -y nginx git

# Clone repo (SSH key must be added to GitHub first - see Step 3b below)
git clone git@github.com:PHIDTECH/phidpos.co.tz.git /var/www/phidpos.co.tz
cd /var/www/phidpos.co.tz

# Create .env
cp .env.production .env
nano .env   # fill in all values
```

### Step 3b: Add SSH Deploy Key to GitHub

```bash
# On the server, generate an SSH key
ssh-keygen -t ed25519 -C "deploy@phidpos" -f ~/.ssh/phidpos_deploy -N ""
cat ~/.ssh/phidpos_deploy.pub
```

Copy the output and add it as a **Deploy Key** at:  
`https://github.com/PHIDTECH/phidpos.co.tz/settings/keys`  
(Read access only is enough for deployment)

Then configure SSH to use it:
```bash
cat >> ~/.ssh/config << 'EOF'
Host github.com
  IdentityFile ~/.ssh/phidpos_deploy
  IdentitiesOnly yes
EOF
```

---

## Step 5: Build and Start Containers

```bash
cd /var/www/phidpos.co.tz

# Build images and start
docker compose up -d --build

# Check containers are running
docker compose ps
```

---

## Step 6: Setup Database

```bash
cd /var/www/phidpos.co.tz

# Push schema to database
docker compose exec app npx prisma migrate deploy

# Seed with demo data
docker compose exec app npx prisma db seed
```

---

## Step 7: Configure Nginx

```bash
# Creates a NEW vhost file - does NOT touch any existing sites
cat > /etc/nginx/sites-available/phidpos << 'EOF'
server {
    listen 80;
    server_name phidpos.co.tz www.phidpos.co.tz;
    client_max_body_size 50M;

    location / {
        proxy_pass http://127.0.0.1:3001;
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
EOF

# Enable ONLY the phidpos site - existing sites untouched
ln -sf /etc/nginx/sites-available/phidpos /etc/nginx/sites-enabled/phidpos
nginx -t && systemctl reload nginx
```

---

## Step 8: Enable Firewall

```bash
ufw allow 22    # SSH
ufw allow 80    # HTTP
ufw allow 443   # HTTPS (for future SSL)
ufw enable
```

---

## Step 9: Install SSL Certificate (Let's Encrypt)

> **Prerequisite:** DNS for `phidpos.co.tz` and `www.phidpos.co.tz` must point to `209.97.191.239` before running certbot.

### 9a. Install certbot

```bash
apt-get install -y certbot python3-certbot-nginx
```

### 9b. Obtain certificate (runs automatically during `deploy.sh`)

```bash
certbot --nginx \
  -d phidpos.co.tz \
  -d www.phidpos.co.tz \
  --non-interactive \
  --agree-tos \
  -m admin@phidpos.co.tz \
  --redirect
```

The `--redirect` flag makes certbot:
- Obtain the certificate
- Update the Nginx config with SSL
- Add an HTTP → HTTPS redirect automatically

### 9c. Update environment variables

```bash
cd /var/www/phidpos.co.tz
nano .env
```

Change these two lines:
```env
NEXTAUTH_URL="https://www.phidpos.co.tz"
NEXT_PUBLIC_APP_URL="https://www.phidpos.co.tz"
```

### 9d. Rebuild app with HTTPS URLs

```bash
cd /var/www/phidpos.co.tz
docker compose down
docker compose up -d --build
nginx -t && systemctl reload nginx
```

### 9e. Verify SSL

```bash
# Check certificate details
certbot certificates

# Test HTTPS
curl -I https://www.phidpos.co.tz
```

### 9f. Auto-renewal

Certbot installs a systemd timer that renews certificates automatically. Verify it is active:

```bash
systemctl status certbot.timer
# OR check cron fallback:
crontab -l | grep certbot
```

To manually trigger renewal:
```bash
certbot renew --nginx --dry-run   # test
certbot renew --nginx             # actual renewal
```

Certificates expire every **90 days**; auto-renewal runs at 03:00 daily and only renews when < 30 days remain.

---

## Login Credentials After Seeding

| Role | Email | Password |
|------|-------|----------|
| Super Admin | superadmin@phidpos.co.tz | Admin@1234 |
| Demo Admin | admin@demo-shop.com | Admin@1234 |
| Demo Cashier | cashier@demo-shop.com | Cashier@1234 |

---

## Useful Commands

```bash
# View live logs
docker compose -f /var/www/phidpos.co.tz/docker-compose.yml logs -f app

# Restart app
docker compose -f /var/www/phidpos.co.tz/docker-compose.yml restart app

# Access database
docker compose -f /var/www/phidpos.co.tz/docker-compose.yml exec postgres psql -U phidpos

# Re-deploy after code changes
cd /var/www/phidpos.co.tz && git pull && docker compose up -d --build

# Check app status
docker compose ps
curl http://127.0.0.1:3000
```

---

## Troubleshooting

**App not starting:**
```bash
docker compose logs app
```

**Database connection error:**
```bash
docker compose logs postgres
docker compose exec postgres pg_isready -U phidpos
```

**Port 3000 not accessible:**
```bash
# Check if app container is running
docker compose ps
# Check Nginx config
nginx -t
systemctl status nginx
```
