# Deployment Guide

## Production with Docker Compose

### 1. Server requirements

- Docker Engine 24+
- Docker Compose v2+
- 2 GB RAM minimum
- Port 80/443 open (if using reverse proxy)

---

### 2. Environment configuration

```bash
cp .env.example .env
```

Set production values in `.env`:

```bash
# Strong random secret — generate with: openssl rand -hex 64
JWT_SECRET=<generated-secret>
JWT_EXPIRES_IN=8h

# Use a strong MySQL password
DATABASE_URL=mysql://wfh_user:<strong-password>@mysql:3306/wfh_attendance

# Only your domain
CORS_ORIGIN=https://your-domain.com

PORT=4000
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=5242880
```

---

### 3. Build and start

```bash
# Build all images and start
docker-compose up -d --build

# View logs
docker-compose logs -f

# Run migrations on first deploy
docker-compose exec backend npx prisma migrate deploy

# Seed initial admin (first deploy only)
docker-compose exec backend npx prisma db seed
```

---

### 4. Nginx reverse proxy (recommended)

`/etc/nginx/sites-available/wfh`:

```nginx
server {
    listen 80;
    server_name your-domain.com;

    # Frontend
    location / {
        proxy_pass http://localhost:5173;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:4000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        client_max_body_size 20M;
    }

    # File uploads
    location /uploads {
        proxy_pass http://localhost:4000;
    }
}
```

For HTTPS, use Certbot:

```bash
certbot --nginx -d your-domain.com
```

---

### 5. Persistent volumes

The `docker-compose.yml` defines named volumes:

- `mysql_data` — MySQL data files
- `uploads_data` — User-uploaded images

**Backup MySQL:**

```bash
docker-compose exec mysql mysqldump -u wfh_user -pwfh_pass123 wfh_attendance > backup.sql
```

**Restore MySQL:**

```bash
docker-compose exec -T mysql mysql -u wfh_user -pwfh_pass123 wfh_attendance < backup.sql
```

---

### 6. Updates (zero-downtime)

```bash
# Pull latest code
git pull

# Rebuild and restart backend (keeps MySQL running)
docker-compose up -d --build backend

# Apply new migrations if any
docker-compose exec backend npx prisma migrate deploy

# Rebuild frontend
docker-compose up -d --build frontend
```

---

### 7. Monitoring

- Health check: `GET /health` → `{ "status": "ok", "timestamp": "..." }`
- Docker health: `docker-compose ps` (shows health status)

---

### 8. Security checklist

- [ ] `JWT_SECRET` is at least 64 random characters
- [ ] `CORS_ORIGIN` is set to exact production domain (no `*`)
- [ ] MySQL password is strong and not the default
- [ ] Uploads directory is not publicly writable
- [ ] HTTPS is configured (Certbot/SSL)
- [ ] Rate limiting is active on `/api/auth` (10 req/15min)
- [ ] Docker containers run as non-root (configured in Dockerfiles)
- [ ] Regular database backups scheduled
