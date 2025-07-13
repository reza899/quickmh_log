# Deployment Guide

This guide will help you deploy QuickMH Log to production environments.

## Quick Start

### 1. Build the Application

```bash
# Install dependencies
npm install

# Run the production build
npm run build

# Or use the automated build script
./build.sh
```

### 2. Deploy to Static Hosting

The built application in the `public/` directory can be deployed to any static hosting service.

## Hosting Platforms

### GitHub Pages

1. **Setup GitHub Pages**
   ```bash
   # The GitHub Actions workflow will automatically deploy to GitHub Pages
   # Just push to main/master branch
   git add .
   git commit -m "Deploy to production"
   git push origin main
   ```

2. **Manual Deployment**
   ```bash
   # Build and deploy manually
   npm run build
   npx gh-pages -d public
   ```

### Netlify

1. **Automated Deployment**
   - Connect your GitHub repository to Netlify
   - Set build command: `npm run build`
   - Set publish directory: `public`
   - Deploy!

2. **Manual Deployment**
   ```bash
   npm run build
   # Upload the public/ directory to Netlify
   ```

### Vercel

1. **Automated Deployment**
   ```bash
   # Install Vercel CLI
   npm i -g vercel
   
   # Deploy
   vercel --prod
   ```

2. **Configuration**
   Create `vercel.json`:
   ```json
   {
     "buildCommand": "npm run build",
     "outputDirectory": "public",
     "headers": [
       {
         "source": "/(.*)",
         "headers": [
           {
             "key": "X-Content-Type-Options",
             "value": "nosniff"
           },
           {
             "key": "X-Frame-Options",
             "value": "DENY"
           },
           {
             "key": "X-XSS-Protection",
             "value": "1; mode=block"
           }
         ]
       }
     ]
   }
   ```

### Firebase Hosting

1. **Setup Firebase**
   ```bash
   npm install -g firebase-tools
   firebase login
   firebase init hosting
   ```

2. **Configuration**
   Update `firebase.json`:
   ```json
   {
     "hosting": {
       "public": "public",
       "ignore": ["firebase.json", "**/.*", "**/node_modules/**"],
       "rewrites": [
         {
           "source": "**",
           "destination": "/index.html"
         }
       ],
       "headers": [
         {
           "source": "**",
           "headers": [
             {
               "key": "X-Content-Type-Options",
               "value": "nosniff"
             },
             {
               "key": "X-Frame-Options",
               "value": "DENY"
             }
           ]
         }
       ]
     }
   }
   ```

3. **Deploy**
   ```bash
   npm run build
   firebase deploy
   ```

## Custom Server Deployment

### Nginx Configuration

```nginx
server {
    listen 443 ssl http2;
    server_name yourdomain.com;
    
    ssl_certificate /path/to/certificate.crt;
    ssl_certificate_key /path/to/private.key;
    
    root /var/www/quickmh-log/public;
    index index.html;
    
    # Security headers
    add_header X-Content-Type-Options nosniff;
    add_header X-Frame-Options DENY;
    add_header X-XSS-Protection "1; mode=block";
    add_header Content-Security-Policy "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self';";
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains";
    
    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;
    
    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # Fallback to index.html for SPA
    location / {
        try_files $uri $uri/ /index.html;
    }
}

# Redirect HTTP to HTTPS
server {
    listen 80;
    server_name yourdomain.com;
    return 301 https://$server_name$request_uri;
}
```

### Apache Configuration

```apache
<VirtualHost *:443>
    ServerName yourdomain.com
    DocumentRoot /var/www/quickmh-log/public
    
    SSLEngine on
    SSLCertificateFile /path/to/certificate.crt
    SSLCertificateKeyFile /path/to/private.key
    
    # Security headers
    Header always set X-Content-Type-Options nosniff
    Header always set X-Frame-Options DENY
    Header always set X-XSS-Protection "1; mode=block"
    Header always set Content-Security-Policy "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self';"
    Header always set Strict-Transport-Security "max-age=31536000; includeSubDomains"
    
    # Gzip compression
    LoadModule deflate_module modules/mod_deflate.so
    <Location />
        SetOutputFilter DEFLATE
        SetEnvIfNoCase Request_URI \
            \.(?:gif|jpe?g|png)$ no-gzip dont-vary
        SetEnvIfNoCase Request_URI \
            \.(?:exe|t?gz|zip|bz2|sit|rar)$ no-gzip dont-vary
    </Location>
    
    # Cache static assets
    <FilesMatch "\.(css|js|png|jpg|jpeg|gif|ico|svg)$">
        ExpiresActive On
        ExpiresDefault "access plus 1 year"
        Header append Cache-Control "public"
    </FilesMatch>
    
    # Fallback to index.html
    FallbackResource /index.html
</VirtualHost>
```

## Docker Deployment

### Dockerfile

```dockerfile
# Build stage
FROM node:18-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

# Production stage
FROM nginx:alpine

# Copy built app
COPY --from=builder /app/public /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Add security headers
RUN echo 'add_header X-Content-Type-Options nosniff;' > /etc/nginx/conf.d/security-headers.conf && \
    echo 'add_header X-Frame-Options DENY;' >> /etc/nginx/conf.d/security-headers.conf && \
    echo 'add_header X-XSS-Protection "1; mode=block";' >> /etc/nginx/conf.d/security-headers.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

### Docker Compose

```yaml
version: '3.8'

services:
  quickmh-log:
    build: .
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./ssl:/etc/nginx/ssl
    environment:
      - NODE_ENV=production
    restart: unless-stopped
    
  # Optional: Add monitoring
  watchtower:
    image: containrrr/watchtower
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
    command: --interval 30
```

## Environment Configuration

### Production Checklist

- [ ] HTTPS enabled with valid SSL certificate
- [ ] Security headers configured (CSP, HSTS, etc.)
- [ ] Gzip compression enabled
- [ ] Static asset caching configured
- [ ] Error pages customized (404, 500)
- [ ] Domain and DNS configured
- [ ] Monitoring and analytics set up (optional)
- [ ] Backup strategy implemented
- [ ] Content Delivery Network (CDN) configured (optional)

### Security Headers

Ensure these headers are configured:

```
Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self';
Strict-Transport-Security: max-age=31536000; includeSubDomains
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
```

### Performance Optimization

1. **Enable Gzip Compression**
   - Reduces file sizes by 60-80%
   - Configure for text files (HTML, CSS, JS)

2. **Set Cache Headers**
   - Static assets: 1 year cache
   - HTML files: No cache or short cache
   - Use ETags for validation

3. **Use a CDN**
   - Cloudflare (free tier available)
   - AWS CloudFront
   - Azure CDN

## Monitoring

### Basic Monitoring

```javascript
// Add to your analytics (optional)
window.addEventListener('error', (event) => {
  // Log client-side errors
  console.error('Client error:', event.error);
});

// Performance monitoring
window.addEventListener('load', () => {
  const loadTime = performance.timing.loadEventEnd - performance.timing.navigationStart;
  console.log('Page load time:', loadTime + 'ms');
});
```

### Health Check Endpoint

Create a simple health check:

```html
<!-- health.html -->
<!DOCTYPE html>
<html>
<head>
    <title>Health Check</title>
</head>
<body>
    <h1>OK</h1>
    <p>Service is running</p>
    <script>
        document.body.innerHTML += '<p>Build: ' + new Date().toISOString() + '</p>';
    </script>
</body>
</html>
```

## Troubleshooting

### Common Issues

1. **Build Fails**
   ```bash
   # Clear cache and rebuild
   rm -rf node_modules package-lock.json
   npm install
   npm run build
   ```

2. **404 Errors on Refresh**
   - Configure your server to serve `index.html` for all routes
   - See server configuration examples above

3. **Security Headers Not Working**
   - Check server configuration
   - Test with browser dev tools or online tools

4. **Performance Issues**
   - Enable compression
   - Check bundle sizes with `npm run build`
   - Use browser dev tools to profile

### Testing Deployment

```bash
# Test the built application locally
npm run preview

# Check for broken links
npx broken-link-checker http://localhost:4173

# Test security headers
curl -I https://yourdomain.com

# Performance testing
npx lighthouse https://yourdomain.com --output=html --output-path=./lighthouse-report.html
```

## Support

- Check the [README](README.md) for development setup
- Review [SECURITY.md](SECURITY.md) for security considerations
- Create GitHub issues for bugs or feature requests

---

**Note**: Always test your deployment in a staging environment before going to production!