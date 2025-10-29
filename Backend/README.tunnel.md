# Monacofaculty Backend with Cloudflare Tunnel

This setup runs the Monacofaculty backend service (Express.js + PostgreSQL) and establishes a Cloudflare tunnel, exposing the service to the internet securely via monacofbackend.ishikabhoyar.tech.

## Prerequisites

- Docker and Docker Compose installed
- PostgreSQL database accessible (configure in .env or docker-compose.tunnel.yml)
- Cloudflare tunnel credentials configured

## Files

- `Dockerfile.tunnel`: Dockerfile that builds the backend and sets up Cloudflare tunnel
- `credentials.json`: Cloudflare tunnel credentials
- `config.json`: Cloudflare tunnel configuration that routes traffic to monacofbackend.ishikabhoyar.tech
- `docker-compose.tunnel.yml`: Docker Compose configuration for easy deployment

## Configuration

### Database Connection

Make sure your `.env` file has the correct database configuration:

```env
DB_HOST=your_database_host
DB_PORT=5432
DB_NAME=your_database_name
DB_USER=your_database_user
DB_PASSWORD=your_database_password
JWT_SECRET=your_jwt_secret
PORT=5000
```

If you want to use environment variables from `.env`, uncomment these lines in `docker-compose.tunnel.yml`:

```yaml
env_file:
  - .env
```

## How to Run

```bash
# Build and start the container
docker-compose -f docker-compose.tunnel.yml up -d

# Check logs
docker-compose -f docker-compose.tunnel.yml logs -f

# Stop the container
docker-compose -f docker-compose.tunnel.yml down

# Rebuild after changes
docker-compose -f docker-compose.tunnel.yml up -d --build
```

## How it Works

1. The Dockerfile builds the Node.js backend application
2. It installs the Cloudflare tunnel client (cloudflared)
3. On container start:
   - The backend server starts on port 5000
   - The Cloudflare tunnel connects to Cloudflare's edge network using the config.json
   - External traffic to monacofbackend.ishikabhoyar.tech is routed through the tunnel to the backend
   - The cloudflared runs entirely within the container

## Tunnel Details

- **Tunnel ID**: 38e6bf5a-5f9f-438e-8b44-40c55b834079
- **Public URL**: monacofbackend.ishikabhoyar.tech
- **Local Port**: 5000
- **Service**: Express.js backend with PostgreSQL

## Testing

After starting the container, you can test the tunnel:

```bash
# Test locally
curl http://localhost:5000/api/health

# Test via tunnel (if you have a health endpoint)
curl https://monacofbackend.ishikabhoyar.tech/api/health
```

## Environment Variables

You can customize the behavior by modifying the environment variables in the docker-compose.tunnel.yml file:

- `PORT`: The port the backend server listens on (default: 5000)
- `NODE_ENV`: Node environment (default: production)
- Database credentials (via .env file)

## Notes

- The tunnel is configured to route traffic from `monacofbackend.ishikabhoyar.tech` to `http://localhost:5000` inside the container
- Supervisord manages both the Node.js backend and cloudflared processes
- Logs from both processes are sent to stdout/stderr for easy viewing with `docker logs`
