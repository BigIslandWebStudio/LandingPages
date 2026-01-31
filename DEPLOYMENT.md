# Deployment Guide: Docker + Coolify

This guide walks you through deploying the landing pages using Docker and Coolify with wildcard DNS for subdomain routing (e.g., `page1.domain.com`, `page2.domain.com`).

## Prerequisites

- A Coolify instance (self-hosted or cloud)
- A domain name with DNS access
- Git repository containing this project

## Step 1: Configure Wildcard DNS

In your domain registrar's DNS settings, add a wildcard A record pointing to your Coolify server:

| Type | Name | Value              | TTL  |
|------|------|--------------------|------|
| A    | *    | YOUR_COOLIFY_IP    | 300  |
| A    | @    | YOUR_COOLIFY_IP    | 300  |

This allows any subdomain (page1, page2, newpage, etc.) to resolve to your server.

> DNS changes typically propagate within minutes but can take up to 48 hours.

## Step 2: Create Application in Coolify

1. Log into your Coolify dashboard
2. Navigate to **Projects** and select or create a project
3. Click **+ Add Resource** → **Application**
4. Select **Docker Compose** or **Dockerfile** as the build method

### Option A: Using Dockerfile (Recommended)

1. Choose **Public Repository** or **Private Repository** based on your setup
2. Enter your repository URL
3. Set the branch (e.g., `main`)
4. Coolify will auto-detect the `Dockerfile`

### Option B: Using Docker Compose

1. Choose **Docker Compose** as build type
2. Coolify will use the `docker-compose.yml` in your repository

## Step 3: Configure Environment

In the Coolify application settings:

### General Settings
- **Name**: `landing-pages`
- **Port**: `3000`

### Environment Variables
```
NODE_ENV=production
PORT=3000
```

## Step 4: Configure Wildcard Domain

This is the key step for subdomain routing.

1. Go to **Settings** → **Domains** in your Coolify application
2. Add your wildcard domain:
   ```
   *.yourdomain.com
   ```
3. Optionally add the root domain:
   ```
   yourdomain.com
   ```

### SSL Configuration
1. Enable **Auto SSL** (Let's Encrypt)
2. Coolify will automatically obtain and renew certificates for your wildcard domain

> Note: Wildcard SSL certificates require DNS-01 challenge. Coolify handles this automatically if your DNS provider is supported. Otherwise, you may need to configure DNS integration in Coolify settings.

## Step 5: Deploy

1. Click **Deploy** in Coolify
2. Coolify will:
   - Clone your repository
   - Build the Docker image using the Dockerfile
   - Start the container
   - Configure the reverse proxy for wildcard routing

### Monitor Deployment
- View build logs in the **Deployments** tab
- Check application logs in the **Logs** tab

## Step 6: Verify Deployment

Test your landing pages:

```bash
curl -I https://page1.yourdomain.com
curl -I https://page2.yourdomain.com
```

You should see:
- HTTP 200 OK
- Security headers (X-Frame-Options, X-Content-Type-Options, etc.)
- Valid SSL certificate

## How Subdomain Routing Works

The Bun server (`server.ts`) extracts the subdomain from the `Host` header and serves the corresponding page:

```
page1.yourdomain.com → pages/page1/index.html
page2.yourdomain.com → pages/page2/index.html
newpage.yourdomain.com → pages/newpage/index.html
```

When you add a new page directory, it's automatically available at the matching subdomain. No configuration changes needed.

## Adding New Landing Pages

1. Create the new page in your repository:
   ```
   pages/
   └── newpage/
       └── index.html
   ```

2. Commit and push to your repository

3. Coolify will auto-deploy (if auto-deploy is enabled) or manually trigger a deploy

4. Your new page is immediately available at `newpage.yourdomain.com`

No DNS changes required when using wildcard DNS.

## Coolify Configuration Reference

### Recommended Settings

| Setting | Value |
|---------|-------|
| Build Type | Dockerfile |
| Port | 3000 |
| Health Check Path | `/` |
| Auto Deploy | Enabled |
| Domain | `*.yourdomain.com` |
| SSL | Auto (Let's Encrypt) |

### Resource Limits (Optional)

For small landing pages, minimal resources are needed:

| Resource | Value |
|----------|-------|
| CPU Limit | 0.5 |
| Memory Limit | 256MB |
| Memory Reservation | 128MB |

## Troubleshooting

### Check Application Logs
In Coolify dashboard → Your App → Logs

### Container Not Starting
1. Verify the Dockerfile builds locally:
   ```bash
   docker build -t landing-pages .
   docker run -p 3000:3000 landing-pages
   ```
2. Check for missing environment variables

### SSL Certificate Issues
1. Verify DNS is properly configured
2. Check Coolify's SSL logs
3. Ensure your DNS provider is supported for DNS-01 challenge
4. Try disabling and re-enabling Auto SSL

### Pages Not Found (404)
1. Verify the page directory exists: `pages/pagename/index.html`
2. Check that the directory name matches the subdomain exactly
3. Review application logs for path resolution

### Subdomain Not Resolving
1. Verify wildcard DNS is configured: `dig *.yourdomain.com`
2. Wait for DNS propagation (up to 48 hours)
3. Check that the wildcard domain is added in Coolify

## Local Docker Testing

Before deploying, test locally:

```bash
# Build the image
docker build -t landing-pages .

# Run the container
docker run -p 3000:3000 landing-pages

# Test with Host header to simulate subdomains
curl -H "Host: page1.localhost" http://localhost:3000
curl -H "Host: page2.localhost" http://localhost:3000
```

Or use Docker Compose:

```bash
docker compose up --build
```

## Updating the Application

### Automatic Updates
If auto-deploy is enabled in Coolify, pushing to your repository triggers a new deployment.

### Manual Updates
1. Push changes to your repository
2. In Coolify dashboard, click **Deploy**

### Rollback
In Coolify dashboard → Deployments → Select a previous deployment → **Rollback**

## Architecture Overview

```
                    ┌─────────────────────────────┐
                    │         Coolify             │
                    │   (Reverse Proxy + SSL)     │
                    └─────────────┬───────────────┘
                                  │
                    ┌─────────────▼───────────────┐
                    │     Docker Container        │
                    │   ┌─────────────────────┐   │
                    │   │    Bun Server       │   │
                    │   │    (port 3000)      │   │
                    │   └─────────────────────┘   │
                    │   ┌─────────────────────┐   │
                    │   │       pages/        │   │
                    │   │  ├── page1/         │   │
                    │   │  ├── page2/         │   │
                    │   │  └── ...            │   │
                    │   └─────────────────────┘   │
                    └─────────────────────────────┘
```

Request flow:
1. User visits `page1.yourdomain.com`
2. Wildcard DNS resolves to Coolify server
3. Coolify terminates SSL and proxies to container
4. Bun server reads `Host: page1.yourdomain.com`
5. Bun serves `pages/page1/index.html`
