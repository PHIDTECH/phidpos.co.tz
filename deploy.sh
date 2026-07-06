#!/bin/bash
# =============================================================
# PhidPOS - DigitalOcean Deployment Script
# Server: 209.97.191.239
# Run this script ON the DigitalOcean droplet as root
# Usage: bash deploy.sh
# =============================================================

set -e

APP_DIR="/var/www/phidpos.co.tz"
REPO_URL="git@github.com:PHIDTECH/phidpos.co.tz.git"

echo "=================================================="
echo "  PhidPOS Deployment - $(date)"
echo "=================================================="

# ---- 1. System Updates ----
echo "📦 Updating system packages..."
apt-get update -y && apt-get upgrade -y

# ---- 2. Install Docker & Docker Compose ----
if ! command -v docker &> /dev/null; then
  echo "🐳 Installing Docker..."
  apt-get install -y ca-certificates curl gnupg
  install -m 0755 -d /etc/apt/keyrings
  curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
  chmod a+r /etc/apt/keyrings/docker.gpg
  echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] \
    https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "$VERSION_CODENAME") stable" \
    | tee /etc/apt/sources.list.d/docker.list > /dev/null
  apt-get update -y
  apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
  systemctl enable docker
  systemctl start docker
  echo "✅ Docker installed"
else
  echo "✅ Docker already installed"
fi

# ---- 3. Install Git ----
apt-get install -y git

# ---- 4. Install Nginx (only if not present - do NOT restart existing) ----
if ! command -v nginx &> /dev/null; then
  echo "🌐 Installing Nginx..."
  apt-get install -y nginx
  systemctl enable nginx
  systemctl start nginx
  echo "✅ Nginx installed"
else
  echo "✅ Nginx already installed - existing sites preserved"
fi

# ---- 5. Clone or Update App ----
if [ -d "$APP_DIR/.git" ]; then
  echo "🔄 Pulling latest code..."
  cd "$APP_DIR"
  git pull origin main
else
  echo "📥 Cloning repository..."
  mkdir -p /var/www
  git clone "$REPO_URL" "$APP_DIR"
  cd "$APP_DIR"
fi

# ---- 6. Setup .env ----
if [ ! -f "$APP_DIR/.env" ]; then
  echo ""
  echo "⚠️  No .env file found!"
  echo "   Copy .env.production to .env and fill in all values:"
  echo "   cp $APP_DIR/.env.production $APP_DIR/.env"
  echo "   nano $APP_DIR/.env"
  echo ""
  echo "   Then re-run: bash deploy.sh"
  exit 1
fi

# Load env vars for docker-compose
set -a && source "$APP_DIR/.env" && set +a

# Export required vars for docker-compose
export POSTGRES_PASSWORD=$(grep DATABASE_URL "$APP_DIR/.env" | sed 's/.*:\/\/[^:]*:\([^@]*\)@.*/\1/')
export NEXTAUTH_URL=$(grep NEXTAUTH_URL "$APP_DIR/.env" | cut -d'=' -f2 | tr -d '"')
export NEXTAUTH_SECRET=$(grep NEXTAUTH_SECRET "$APP_DIR/.env" | cut -d'=' -f2 | tr -d '"')
export NEXT_PUBLIC_APP_URL=$(grep NEXT_PUBLIC_APP_URL "$APP_DIR/.env" | cut -d'=' -f2 | tr -d '"')

# ---- 7. Build & Start Containers ----
echo "🏗️  Building and starting Docker containers..."
cd "$APP_DIR"
docker compose down --remove-orphans 2>/dev/null || true
docker compose build --no-cache
docker compose up -d

# ---- 8. Wait for DB to be ready ----
echo "⏳ Waiting for PostgreSQL to be ready..."
sleep 10

# ---- 9. Run Migrations & Seed ----
echo "🗄️  Running database migrations..."
docker compose exec app npx prisma migrate deploy 2>/dev/null || \
  docker compose exec app npx prisma db push --accept-data-loss

echo "🌱 Seeding database..."
docker compose exec app npx prisma db seed 2>/dev/null || echo "⚠️  Seed already run or failed - skipping"

# ---- 10. Configure Nginx ----
echo "🌐 Configuring Nginx reverse proxy..."
cat > /etc/nginx/sites-available/phidpos << 'EOF'
server {
    listen 80;
    server_name phidpos.co.tz www.phidpos.co.tz;

    client_max_body_size 50M;

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
}
EOF

# Only enable phidpos vhost - do NOT touch other sites or remove default
ln -sf /etc/nginx/sites-available/phidpos /etc/nginx/sites-enabled/phidpos
nginx -t && systemctl reload nginx

# ---- 11. Configure Firewall ----
echo "🔒 Configuring firewall..."
ufw allow 22/tcp    # SSH
ufw allow 80/tcp    # HTTP
ufw allow 443/tcp   # HTTPS
ufw --force enable

echo ""
echo "=================================================="
echo "✅ Deployment complete!"
echo "=================================================="
echo ""
echo "🌐 App is running at: https://www.phidpos.co.tz"
echo ""
echo "📋 Demo Login Credentials:"
echo "   Super Admin:  superadmin@phidpos.co.tz / Admin@1234"
echo "   Demo Admin:   admin@demo-shop.com / Admin@1234"
echo "   Demo Cashier: cashier@demo-shop.com / Cashier@1234"
echo ""
echo "🔧 Useful commands:"
echo "   View logs:     docker compose -f $APP_DIR/docker-compose.yml logs -f app"
echo "   Restart app:   docker compose -f $APP_DIR/docker-compose.yml restart app"
echo "   DB shell:      docker compose -f $APP_DIR/docker-compose.yml exec postgres psql -U phidpos"
echo ""
