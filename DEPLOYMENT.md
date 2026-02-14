# Deployment Guide: Coolify (Self-Hosted)

This guide walks you through deploying LandingPages on [Coolify v4](https://coolify.io) with automatic deploys on push to `main` and wildcard DNS for subdomain routing (e.g., `page1.yourdomain.com`, `page2.yourdomain.com`).

## Prerequisites

- A Coolify v4 instance ([install guide](https://coolify.io/docs/installation))
- A domain name with DNS access
- A GitHub repository containing this project

## Overview

```
Push to main → GitHub webhook → Coolify rebuilds → Live in seconds
```

Coolify connects to your GitHub repo, builds the Docker image from the `Dockerfile` in the repo, and deploys it. With auto-deploy enabled, every push to `main` triggers a new deployment automatically.

---

## Step 1: Configure Wildcard DNS

In your domain registrar's DNS settings, add a wildcard A record pointing to your Coolify server:

| Type | Name | Value           | TTL |
|------|------|-----------------|-----|
| A    | *    | YOUR_COOLIFY_IP | 300 |
| A    | @    | YOUR_COOLIFY_IP | 300 |

This allows any subdomain (`home`, `docs`, `merch`, etc.) to resolve to your server.

> DNS changes typically propagate within minutes but can take up to 48 hours.

---

## Step 2: Connect GitHub to Coolify

You have two options depending on whether your repo is public or private.

### Option A: Public Repository

This is the simplest method. No authentication required.

1. In the Coolify dashboard, open your project
2. Click **+ New** to create a new resource
3. Select **Public Repository**
4. Choose the server to deploy on (defaults to `localhost` if only one server)
5. Paste your repository URL:
   ```
   https://github.com/ninachaubal/LandingPages
   ```

> **Tip:** Append `/tree/main` to the URL to specify the branch:
> `https://github.com/ninachaubal/LandingPages/tree/main`

### Option B: Private Repository (GitHub App)

This method enables full integration including auto-deploy on push.

1. In Coolify, go to **Sources** in the sidebar
2. Click **+ Add** to create a new GitHub App
3. Enter your GitHub organization name (leave empty for personal account)
4. Give the app a name and click **Register now**
5. You'll be redirected to GitHub — click **Create App**
6. Back in Coolify, click **Install repositories on GitHub**
7. Select which repositories to grant access to, then click **Install**

Now create the application:

1. Click **+ New** → select **Private Repository (with GitHub App)**
2. Choose your server and the GitHub App you just created
3. Select the repository and click **Load Repository**

---

## Step 3: Select Dockerfile Build Pack

After selecting your repository, Coolify needs to know how to build it.

1. Coolify defaults to **Nixpacks** — click on it and select **Dockerfile** from the dropdown
2. Set **Base Directory** to `/` (files are at the root of the repo)
3. Set **Branch** to `main` (should be auto-detected)
4. Click **Continue**

> **Important:** Don't confuse this with "Dockerfile" as a resource type (which lets you paste Dockerfile contents without a git repo). We want the Dockerfile build pack applied to a git-based resource — this tells Coolify to use the `Dockerfile` from your repository.

---

## Step 4: Configure Application Settings

### Network Settings

| Setting | Value |
|---------|-------|
| Port    | `3000` |

The Bun server in the container listens on port 3000. Make sure this matches in the network configuration.

### Environment Variables (Optional)

```
NODE_ENV=production
PORT=3000
```

These are already set in the Dockerfile, but you can override them in the Coolify UI under the **Environment Variables** tab.

---

## Step 5: Configure Wildcard Domain with Traefik

This is the key step for subdomain routing. Because we need *all* subdomains to route to a single application, we use Coolify's SaaS-style Traefik configuration.

### 5a: Set Up Wildcard SSL (DNS Challenge)

Wildcard SSL certificates require a DNS challenge (not HTTP challenge). You need a supported DNS provider from the [Lego providers list](https://go-acme.github.io/lego/dns/).

1. Go to **Servers** → select your server → **Proxy** tab
2. Replace the default Traefik configuration with the following (example uses Cloudflare):

```yaml
version: '3.8'
networks:
  coolify:
    external: true
services:
  traefik:
    container_name: coolify-proxy
    image: 'traefik:v3.6'
    restart: unless-stopped
    environment:
      - CF_DNS_API_TOKEN=your-cloudflare-api-token
    extra_hosts:
      - 'host.docker.internal:host-gateway'
    networks:
      - coolify
    ports:
      - '80:80'
      - '443:443'
      - '8080:8080'
    healthcheck:
      test: 'wget -qO- http://localhost:80/ping || exit 1'
      interval: 4s
      timeout: 2s
      retries: 5
    volumes:
      - '/var/run/docker.sock:/var/run/docker.sock:ro'
      - '/data/coolify/proxy:/traefik'
    command:
      - '--ping=true'
      - '--ping.entrypoint=http'
      - '--api.dashboard=true'
      - '--api.insecure=false'
      - '--entrypoints.http.address=:80'
      - '--entrypoints.https.address=:443'
      - '--entrypoints.http.http.encodequerysemicolons=true'
      - '--entrypoints.https.http.encodequerysemicolons=true'
      - '--providers.docker.exposedbydefault=false'
      - '--providers.file.directory=/traefik/dynamic/'
      - '--providers.file.watch=true'
      - '--certificatesresolvers.letsencrypt.acme.dnschallenge.provider=cloudflare'
      - '--certificatesresolvers.letsencrypt.acme.dnschallenge.delaybeforecheck=0'
      - '--certificatesresolvers.letsencrypt.acme.storage=/traefik/acme.json'
      - '--providers.docker=true'
    labels:
      - traefik.enable=true
      - traefik.http.routers.traefik.entrypoints=http
      - traefik.http.routers.traefik.middlewares=traefik-basic-auth@file
      - traefik.http.routers.traefik.service=api@internal
      - traefik.http.routers.traefik.tls.certresolver=letsencrypt
      - traefik.http.routers.traefik.tls.domains[0].main=yourdomain.com
      - traefik.http.routers.traefik.tls.domains[0].sans=*.yourdomain.com
      - traefik.http.services.traefik.loadbalancer.server.port=8080
      - traefik.http.middlewares.redirect-to-https.redirectscheme.scheme=https
      - traefik.http.middlewares.gzip.compress=true
```

Replace:
- `CF_DNS_API_TOKEN` with your DNS provider's API token
- `cloudflare` with your [DNS provider name](https://go-acme.github.io/lego/dns/)
- `yourdomain.com` with your actual domain

### 5b: Configure SaaS-Style Wildcard Routing

Since all subdomains should route to this single application:

1. In your application settings, **leave the FQDN/Domain field empty**
2. Go to the application's **Advanced** settings or proxy/label configuration
3. Add the following custom Traefik labels:

```
traefik.enable=true
traefik.http.routers.landingpages-https.rule=HostRegexp(`^.+\.yourdomain\.com$`)
traefik.http.routers.landingpages-https.entryPoints=https
traefik.http.routers.landingpages-https.middlewares=gzip
traefik.http.routers.landingpages-https.service=landingpages
traefik.http.routers.landingpages-https.tls.certresolver=letsencrypt
traefik.http.routers.landingpages-https.tls=true
traefik.http.services.landingpages.loadbalancer.server.port=3000

traefik.http.routers.landingpages-http.rule=HostRegexp(`^.+\.yourdomain\.com$`)
traefik.http.routers.landingpages-http.entryPoints=http
traefik.http.routers.landingpages-http.middlewares=redirect-to-https
```

Replace `yourdomain\.com` with your actual domain (dots must be escaped with `\`).

---

## Step 6: Enable Auto-Deploy on Push

### With GitHub App (Recommended)

If you used the GitHub App method in Step 2, auto-deploy is enabled by default. Verify it:

1. Open your application in Coolify
2. Go to the **Advanced** page
3. Confirm **Auto Deploy** is enabled under the general section

That's it — every push to `main` will trigger a new deployment.

### With Webhooks (Public Repos)

For public repositories, set up a webhook manually:

1. In Coolify, go to your application's **Advanced** page
2. Enable **Auto Deploy**
3. Set a **GitHub Webhook Secret** (any random string) and save the **Webhook URL**

Then in GitHub:

1. Go to your repository → **Settings** → **Webhooks**
2. Click **Add webhook**
3. Set **Payload URL** to the webhook URL from Coolify
4. Set **Content type** to `application/json`
5. Set **Secret** to the webhook secret from Coolify
6. Select **Just the `push` event**
7. Enable **Active** and click **Add webhook**

Now every push to `main` will trigger a Coolify deployment.

---

## Step 7: Deploy

1. Click **Deploy** in Coolify for the initial deployment
2. Coolify will:
   - Clone your repository
   - Build the Docker image using the `Dockerfile`
   - Start the container on port 3000
   - Configure the Traefik reverse proxy for wildcard routing

### Monitor Deployment
- View build logs in the **Deployments** tab
- Check application logs in the **Logs** tab

---

## Step 8: Verify

Test your landing pages:

```bash
curl -I https://home.yourdomain.com
curl -I https://docs.yourdomain.com
curl -I https://merch.yourdomain.com
```

You should see:
- HTTP 200 OK
- Valid SSL certificate
- Security headers

---

## How Subdomain Routing Works

The Bun server (`server.ts`) extracts the subdomain from the `Host` header and serves the corresponding page:

```
home.yourdomain.com  → pages/home/index.html
docs.yourdomain.com  → pages/docs/index.html
merch.yourdomain.com → pages/merch/index.html
```

When you add a new page directory and push to `main`, it's automatically available at the matching subdomain. No DNS or Coolify configuration changes needed.

---

## Adding New Landing Pages

1. Create the page (or have the AI agent create it):
   ```
   pages/
   └── newpage/
       └── index.html
   ```
2. Push to `main`
3. Coolify auto-deploys
4. Visit `newpage.yourdomain.com`

---

## Troubleshooting

### Container Not Starting
1. Verify the Dockerfile builds locally:
   ```bash
   docker build -t landing-pages .
   docker run -p 3000:3000 landing-pages
   ```
2. Check the port is set to 3000 in Coolify's network settings
3. Ensure the app listens on `0.0.0.0`, not just `localhost`

### "No Available Server" Error
This usually means the health check is failing. Check `docker ps` on your server to see if the container is unhealthy. Fix the underlying issue or adjust health check settings in Coolify.

### SSL Certificate Issues
1. Verify DNS is properly configured: `dig *.yourdomain.com`
2. Confirm your DNS provider is supported for DNS challenge
3. Check that the Traefik proxy config has the correct API token
4. Try deleting `/data/coolify/proxy/acme.json` and restarting the proxy

### Pages Not Found (404)
1. Verify the page directory exists: `pages/pagename/index.html`
2. Check that the directory name matches the subdomain exactly
3. Review application logs for path resolution errors

### Auto-Deploy Not Working
1. Verify the webhook is configured in GitHub (check for green checkmarks)
2. Confirm the webhook secret matches between GitHub and Coolify
3. If using GitHub App, ensure the app has access to the repository
4. Check that **Auto Deploy** is enabled in Coolify's Advanced settings

---

## Local Docker Testing

Before deploying, test locally:

```bash
# Build the image
docker build -t landing-pages .

# Run the container
docker run -p 3000:3000 landing-pages

# Test with Host header to simulate subdomains
curl -H "Host: home.localhost" http://localhost:3000
curl -H "Host: docs.localhost" http://localhost:3000
```

---

## Quick Reference

| Setting | Value |
|---------|-------|
| Build Pack | Dockerfile (from git repo) |
| Branch | `main` |
| Port | `3000` |
| Auto Deploy | Enabled |
| Domain | Leave empty (use custom Traefik labels) |
| SSL | DNS challenge via Traefik |
| Traefik Routing | `HostRegexp` for wildcard subdomains |

### Resource Limits (Optional)

| Resource | Value |
|----------|-------|
| CPU Limit | 0.5 |
| Memory Limit | 256MB |
| Memory Reservation | 128MB |
