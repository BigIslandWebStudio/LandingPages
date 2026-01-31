# Deployment Guide: Ubuntu Cloud VM

This guide walks you through deploying the landing pages on an Ubuntu cloud VM with subdomain routing (e.g., `page1.domain.com`, `page2.domain.com`).

## Prerequisites

- Ubuntu 20.04+ cloud VM (AWS EC2, DigitalOcean, Linode, etc.)
- A domain name with DNS access
- SSH access to your VM
- Root or sudo privileges

## Step 1: Initial Server Setup

SSH into your server and update packages:

```bash
sudo apt update && sudo apt upgrade -y
```

Install required packages:

```bash
sudo apt install -y curl unzip git nginx certbot python3-certbot-nginx
```

## Step 2: Install Bun

Install Bun runtime:

```bash
curl -fsSL https://bun.sh/install | bash
```

Add Bun to your path (logout/login or run):

```bash
source ~/.bashrc
```

Verify installation:

```bash
bun --version
```

## Step 3: Clone and Setup Project

Create application directory:

```bash
sudo mkdir -p /var/www/landing-pages
sudo chown $USER:$USER /var/www/landing-pages
```

Clone your repository (or upload files):

```bash
cd /var/www/landing-pages
git clone <your-repo-url> .
```

Install dependencies and build:

```bash
bun install
bun run build:css
```

## Step 4: Create Systemd Service

Create a systemd service for the Bun server:

```bash
sudo nano /etc/systemd/system/landing-pages.service
```

Add the following content:

```ini
[Unit]
Description=Landing Pages Bun Server
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/var/www/landing-pages
ExecStart=/home/<your-username>/.bun/bin/bun run start
Restart=on-failure
RestartSec=10
StandardOutput=syslog
StandardError=syslog
SyslogIdentifier=landing-pages
Environment=PORT=3000
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
```

> Replace `<your-username>` with your actual username.

Set permissions and start the service:

```bash
sudo chown -R www-data:www-data /var/www/landing-pages
sudo systemctl daemon-reload
sudo systemctl enable landing-pages
sudo systemctl start landing-pages
```

Verify it's running:

```bash
sudo systemctl status landing-pages
```

## Step 5: Configure DNS

In your domain registrar's DNS settings, add A records for each subdomain:

| Type | Name   | Value           | TTL  |
|------|--------|-----------------|------|
| A    | page1  | YOUR_SERVER_IP  | 300  |
| A    | page2  | YOUR_SERVER_IP  | 300  |
| A    | @      | YOUR_SERVER_IP  | 300  |

For wildcard subdomain support (recommended):

| Type | Name | Value           | TTL  |
|------|------|-----------------|------|
| A    | *    | YOUR_SERVER_IP  | 300  |

> DNS changes can take up to 48 hours to propagate, but usually complete within minutes.

## Step 6: Configure Nginx

Create Nginx configuration:

```bash
sudo nano /etc/nginx/sites-available/landing-pages
```

Add the following configuration:

```nginx
# Upstream to Bun server
upstream bun_server {
    server 127.0.0.1:3000;
    keepalive 64;
}

# Redirect HTTP to HTTPS
server {
    listen 80;
    listen [::]:80;
    server_name *.yourdomain.com yourdomain.com;
    return 301 https://$host$request_uri;
}

# Main HTTPS server block
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name *.yourdomain.com yourdomain.com;

    # SSL certificates (will be configured by Certbot)
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    # Security headers
    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied any;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/json application/xml;

    # Proxy to Bun server
    location / {
        proxy_pass http://bun_server;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 60s;
        proxy_connect_timeout 60s;
    }

    # Static assets caching
    location ~* \.(css|js|jpg|jpeg|png|gif|ico|svg|woff|woff2)$ {
        proxy_pass http://bun_server;
        proxy_set_header Host $host;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

> Replace `yourdomain.com` with your actual domain.

Enable the site:

```bash
sudo ln -s /etc/nginx/sites-available/landing-pages /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default  # Remove default site
sudo nginx -t  # Test configuration
sudo systemctl reload nginx
```

## Step 7: Setup SSL with Let's Encrypt

First, temporarily modify Nginx for certificate issuance (before SSL is configured):

```bash
sudo nano /etc/nginx/sites-available/landing-pages
```

Replace the content temporarily with:

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name *.yourdomain.com yourdomain.com;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

Reload Nginx:

```bash
sudo nginx -t && sudo systemctl reload nginx
```

Obtain wildcard certificate (requires DNS challenge):

```bash
sudo certbot certonly --manual --preferred-challenges=dns \
  -d yourdomain.com -d "*.yourdomain.com"
```

Follow the prompts to add DNS TXT records for verification. Once complete, restore the full Nginx configuration from Step 6.

Alternatively, for individual subdomain certificates:

```bash
sudo certbot --nginx -d yourdomain.com -d page1.yourdomain.com -d page2.yourdomain.com
```

Test auto-renewal:

```bash
sudo certbot renew --dry-run
```

## Step 8: Configure Firewall

Allow necessary ports:

```bash
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable
```

Verify:

```bash
sudo ufw status
```

## Step 9: Verify Deployment

Test each subdomain:

```bash
curl -I https://page1.yourdomain.com
curl -I https://page2.yourdomain.com
```

You should see 200 OK responses with security headers.

## Adding New Pages

When you add a new landing page:

1. Create the new page directory and HTML file:
   ```bash
   mkdir -p /var/www/landing-pages/pages/newpage
   # Add your index.html
   ```

2. Rebuild CSS if needed:
   ```bash
   cd /var/www/landing-pages
   bun run build:css
   ```

3. Add DNS record for the new subdomain (if not using wildcard)

4. If not using wildcard SSL, add the new subdomain to your certificate:
   ```bash
   sudo certbot --nginx -d newpage.yourdomain.com
   ```

The Bun server automatically serves new pages based on subdomain - no restart required!

## Troubleshooting

### Check Bun server logs
```bash
sudo journalctl -u landing-pages -f
```

### Check Nginx logs
```bash
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/nginx/access.log
```

### Restart services
```bash
sudo systemctl restart landing-pages
sudo systemctl restart nginx
```

### Test Bun server directly
```bash
curl http://localhost:3000
```

## Maintenance

### Update the application
```bash
cd /var/www/landing-pages
git pull origin main
bun install
bun run build:css
sudo systemctl restart landing-pages
```

### SSL certificate renewal
Certbot handles this automatically, but you can manually renew:
```bash
sudo certbot renew
```

### Monitor disk space
```bash
df -h
```

### Check server resources
```bash
htop
```
