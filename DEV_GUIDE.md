# Development Guide

## Quick Start

### Start Everything with One Command

```bash
npm run dev
```

This single command starts:
- ✅ PostgreSQL database (port 5433)
- ✅ Go gRPC server with hot reload (port 50051)
- ✅ Envoy gRPC-Web proxy (port 8080)
- ✅ React frontend with Vite (port 5173)

**Access the application:**
- Frontend: http://localhost:5173
- Envoy Admin: http://localhost:9901
- gRPC Server: localhost:50051
- PostgreSQL: localhost:5433

### Alternative Development Workflows

**1. Full Stack (Detached Mode)**
```bash
npm run dev:detached  # Run in background
npm run logs          # View all logs
npm run stop          # Stop all services
```

**2. Backend Only (with PostgreSQL)**
```bash
npm run dev:backend   # Starts postgres, server, envoy
```

**3. PostgreSQL Only**
```bash
npm run dev:postgres  # Just the database
npm run server        # Run Go server locally
```

**4. Frontend Development**
```bash
npm run dev:backend   # Start backend services
npm run dev:frontend  # Run frontend locally (no Docker)
```

## Available Commands

### Development

| Command | Description |
|---------|-------------|
| `npm run dev` | Start all services (PostgreSQL + Backend + Frontend) |
| `npm run start` | Alias for `npm run dev` |
| `npm run dev:detached` | Start all services in background |
| `npm run dev:postgres` | Start only PostgreSQL |
| `npm run dev:backend` | Start PostgreSQL + Server + Envoy |
| `npm run dev:frontend` | Start frontend dev server locally |
| `npm run stop` | Stop all Docker services |
| `npm run restart` | Restart all services |

### Logs

| Command | Description |
|---------|-------------|
| `npm run logs` | View all service logs |
| `npm run logs:server` | View backend logs only |
| `npm run logs:client` | View frontend logs only |
| `npm run logs:postgres` | View database logs only |

### Building

| Command | Description |
|---------|-------------|
| `npm run build` | Build both frontend and backend |
| `npm run client:build` | Build frontend only |
| `npm run server:build` | Build backend only |
| `npm run docker:build` | Rebuild all Docker images |
| `npm run docker:rebuild` | Full rebuild (clears cache) |

### Testing

| Command | Description |
|---------|-------------|
| `npm test` | Run backend tests |
| `npm run server:test` | Run backend tests |
| `npm run test:all` | Run all tests |

### Database

| Command | Description |
|---------|-------------|
| `npm run db:shell` | Connect to PostgreSQL shell |
| `npm run db:logs` | View database logs |

### Docker Management

| Command | Description |
|---------|-------------|
| `npm run docker:up` | Start services in background |
| `npm run docker:down` | Stop all services |
| `npm run docker:clean` | Remove all containers and volumes |

## Development Workflow

### First Time Setup

1. **Clone and install dependencies:**
```bash
git clone <repository>
cd Schedule-Management-System
npm install  # Installs all workspace dependencies
```

2. **Start the full stack:**
```bash
npm run dev
```

3. **Access the application:**
   - Open http://localhost:5173 in your browser
   - The frontend connects to the backend via Envoy proxy

### Daily Development

**Option 1: Docker Everything (Recommended for full-stack work)**
```bash
npm run dev:detached  # Start in background
npm run logs          # Monitor logs
# Make changes - hot reload works automatically
npm run stop          # When done
```

**Option 2: Local Frontend, Docker Backend (Recommended for frontend work)**
```bash
npm run dev:backend   # Start backend services
npm run dev:frontend  # Start Vite dev server locally
# Frontend has faster hot reload when running locally
```

**Option 3: Local Backend, Docker PostgreSQL (Recommended for backend work)**
```bash
npm run dev:postgres  # Start database
npm run server        # Run Go server locally
npm run client        # Run frontend locally
```

### Hot Reload

- **Frontend**: Vite hot reload works automatically
- **Backend**: Air hot reload rebuilds on Go file changes
- **Database**: Schema changes require restart

### Making Changes

1. **Edit code** - Changes are detected automatically
2. **View logs** - `npm run logs:server` or `npm run logs:client`
3. **Test** - `npm test` or `npm run test:all`
4. **Commit** - Standard git workflow

## Troubleshooting

### Port Conflicts

If you get port conflicts:

```bash
# Check what's using the ports
lsof -i :5173  # Frontend
lsof -i :50051 # gRPC
lsof -i :8080  # Envoy
lsof -i :5433  # PostgreSQL

# Stop conflicting services or change ports in docker-compose.yml
```

### Database Connection Issues

```bash
# Check if PostgreSQL is running
docker ps | grep postgres

# View database logs
npm run db:logs

# Connect to database
npm run db:shell
```

### Docker Issues

```bash
# Clean rebuild everything
npm run docker:clean
npm run docker:rebuild

# Check Docker status
docker ps
docker compose ps
```

### Backend Not Starting

```bash
# View server logs
npm run logs:server

# Check if database is healthy
docker inspect schedule-postgres

# Rebuild server
docker compose build server
npm run dev
```

### Frontend Not Loading

```bash
# Check if Envoy is running
curl http://localhost:8080

# View client logs
npm run logs:client

# Rebuild client
docker compose build client
npm run dev
```

## Environment Variables

### Backend (server)

Set in `docker-compose.yml` or create `.env` file:

```env
DB_HOST=postgres
DB_PORT=5432
DB_NAME=schedule_db
DB_USER=schedule_user
DB_PASSWORD=schedule_password
DB_SSLMODE=disable
GRPC_PORT=50051
```

### Frontend (client)

Set in `docker-compose.yml` or create `client/.env`:

```env
VITE_GRPC_WEB_URL=http://localhost:8080
VITE_USER_ID=demo-user
```

## Project Structure

```
Schedule-Management-System/
├── package.json              # Root workspace config
├── docker-compose.yml        # Multi-service orchestration
├── DEV_GUIDE.md             # This file
├── DECISIONS.md             # Architecture decisions
│
├── client/                   # React + TypeScript frontend
│   ├── src/
│   │   ├── api/grpc/        # gRPC-Web client
│   │   ├── components/      # React components
│   │   ├── hooks/           # React hooks
│   │   └── types/           # TypeScript types
│   ├── Dockerfile
│   └── package.json
│
├── server/                   # Go + gRPC backend
│   ├── cmd/server/          # Main entry point
│   ├── internal/
│   │   ├── domain/          # Business models
│   │   ├── repository/      # Data access
│   │   ├── service/         # Business logic
│   │   └── grpc/            # gRPC handlers
│   ├── proto/               # Protocol buffers
│   ├── .air.toml            # Hot reload config
│   ├── Dockerfile
│   └── go.mod
│
└── envoy/                    # gRPC-Web proxy
    ├── envoy.yaml
    └── Dockerfile
```

## Next Steps

- Read [DECISIONS.md](./DECISIONS.md) for architecture decisions
- Check [README.md](./README.md) for project overview
- Run `npm run dev` and start building!
