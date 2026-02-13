# Schedule Management System

A production-grade appointment scheduling system that handles concurrent access and prevents double-booking using database-level constraints.

## 🎯 Key Features

- **Concurrent Access Handling** - Database EXCLUDE constraints prevent all double-booking scenarios
- **Complete CRUD** - Create, read, update, delete appointments with optimistic locking
- **Conflict Detection** - Two-layer defense: proactive checking + guaranteed constraint enforcement
- **Multiple Calendar Views** - Day, week, and month views for easy scheduling
- **Recurring Appointments** - Support for daily, weekly, and monthly recurring appointments
- **Real-time Updates** - Optional streaming updates for multi-device scenarios
- **Type-Safe APIs** - Full TypeScript and Go type safety via Protocol Buffers

## 🏗️ Architecture

### Tech Stack

**Backend:**
- Go 1.21+ with gRPC
- PostgreSQL 14+ with GiST indexing
- Protocol Buffers for API contracts

**Frontend:**
- React 19+ with TypeScript
- Vite for fast development
- gRPC-Web via Envoy proxy
- Zustand for state management
- date-fns for date manipulation

**Infrastructure:**
- Docker Compose for local development
- Envoy proxy for gRPC-Web translation
- Monorepo with npm workspaces

### Project Structure

```
├── client/                    # React + TypeScript frontend
│   ├── src/
│   │   ├── api/grpc/         # gRPC-Web client
│   │   ├── components/       # React components
│   │   │   ├── Appointment/  # Appointment CRUD UI
│   │   │   ├── Calendar/     # Calendar views
│   │   │   └── common/       # Shared components
│   │   ├── hooks/            # Custom React hooks
│   │   ├── store/            # Zustand stores
│   │   ├── types/            # TypeScript types
│   │   └── utils/            # Utility functions
│   └── package.json
│
├── server/                    # Go gRPC backend
│   ├── cmd/server/           # Application entry point
│   ├── internal/
│   │   ├── config/           # Configuration
│   │   ├── db/               # Database connection & migrations
│   │   ├── domain/           # Domain models & errors
│   │   ├── grpc/             # gRPC handlers & server
│   │   ├── repository/       # Data access layer
│   │   └── service/          # Business logic
│   ├── proto/                # Protocol Buffer definitions
│   ├── pkg/                  # Shared packages
│   ├── go.mod
│   └── Makefile
│
├── envoy/                     # Envoy proxy configuration
│   ├── envoy.yaml            # gRPC-Web proxy config
│   └── Dockerfile
│
├── docker-compose.yml         # Multi-service orchestration
├── package.json              # Root workspace config
├── DECISIONS.md              # Architecture decisions
└── README.md                 # This file
```

## 🚀 Quick Start

### Prerequisites

- Docker & Docker Compose
- Node.js 18+ and npm 9+ (for local development)
- Go 1.21+ (for local development)

### Using Docker Compose (Recommended)

1. **Clone and start all services:**
   ```bash
   docker compose up --build
   ```

2. **Access the application:**
   - Frontend: http://localhost:5173
   - gRPC-Web API: http://localhost:8080
   - Envoy Admin: http://localhost:9901
   - PostgreSQL: localhost:5432

3. **Stop services:**
   ```bash
   docker compose down
   ```

### Local Development (Without Docker)

#### 1. Start PostgreSQL

```bash
# Using Docker for just the database
docker compose up postgres -d
```

Or use a local PostgreSQL instance and create the database:
```bash
createdb appointments
```

#### 2. Run Database Migrations

```bash
cd server
export APP_DATABASE_HOST=localhost
export APP_DATABASE_PORT=5432
export APP_DATABASE_USER=postgres
export APP_DATABASE_PASSWORD=postgres
export APP_DATABASE_NAME=appointments

# Run migrations
psql -U postgres -d appointments -f internal/db/migrations/001_initial_schema.sql
```

#### 3. Start Backend

```bash
cd server
go run cmd/server/main.go
```

The gRPC server will start on port 50051.

#### 4. Start Envoy (for gRPC-Web)

```bash
docker compose up envoy
```

Or install Envoy locally and run:
```bash
envoy -c envoy/envoy.yaml
```

#### 5. Start Frontend

```bash
cd client
npm install
npm run dev
```

The frontend will start on http://localhost:5173.

## 📖 API Documentation

### gRPC Service Definition

See `server/proto/appointment/v1/appointment.proto` for the complete API definition.

**Main RPCs:**
- `CreateAppointment` - Create new appointment (checks conflicts)
- `GetAppointment` - Get appointment by ID
- `ListAppointments` - List appointments with filters
- `UpdateAppointment` - Update existing appointment (optimistic locking)
- `DeleteAppointment` - Delete appointment
- `CheckConflicts` - Check for scheduling conflicts
- `StreamAppointments` - Subscribe to real-time updates (streaming)

### Example API Call

```typescript
import { createAppointment } from '@/api/grpc/appointment.client';

const response = await createAppointment({
  userId: 'user-123',
  title: 'Team Meeting',
  description: 'Quarterly planning session',
  startTime: '2026-02-15T14:00:00Z',
  endTime: '2026-02-15T15:00:00Z',
  location: 'Conference Room A',
  attendees: ['alice@example.com', 'bob@example.com'],
});

if (response.conflicts) {
  console.log('Conflicts detected:', response.conflicts);
} else {
  console.log('Appointment created:', response.appointment);
}
```

## 🔒 Concurrency Control

### The Challenge

Multiple users attempting to book the same time slot simultaneously could lead to double-booking without proper handling.

### Our Solution

**Two-Layer Defense Strategy:**

1. **Database Constraint (Absolute Guarantee):**
   ```sql
   EXCLUDE USING GIST (
       user_id WITH =,
       tstzrange(start_time, end_time) WITH &&
   ) WHERE (status = 'SCHEDULED')
   ```
   - Mathematically guarantees no overlapping appointments
   - Works with horizontal scaling
   - No race conditions possible

2. **Application Conflict Detection (Better UX):**
   - Proactive checking before attempting to book
   - Shows conflicting appointments to user
   - Allows user to decide: reschedule or override

See [DECISIONS.md](./DECISIONS.md) for detailed explanation.

## 🧪 Testing

### Backend Tests

```bash
cd server
go test ./...
```

### Frontend Tests

```bash
cd client
npm run test
```

### Integration Testing

Test concurrent booking scenario:
```bash
# Terminal 1
curl -X POST http://localhost:8080/appointment.v1.AppointmentService/CreateAppointment \
  -H "Content-Type: application/json" \
  -d '{"userId":"user1","title":"Meeting","startTime":"2026-02-15T14:00:00Z","endTime":"2026-02-15T15:00:00Z"}' &

# Terminal 2 (run immediately)
curl -X POST http://localhost:8080/appointment.v1.AppointmentService/CreateAppointment \
  -H "Content-Type: application/json" \
  -d '{"userId":"user1","title":"Another Meeting","startTime":"2026-02-15T14:30:00Z","endTime":"2026-02-15T15:30:00Z"}' &

# One should succeed, one should fail with conflict error
```

## 📊 Database Schema

Key tables:
- `appointments` - Main appointment storage with EXCLUDE constraint
- `appointment_events` - Event log for real-time streaming

See `server/internal/db/migrations/001_initial_schema.sql` for complete schema.

## 🔧 Configuration

### Environment Variables

**Backend (server):**
```bash
APP_DATABASE_HOST=postgres      # Database host
APP_DATABASE_PORT=5432          # Database port
APP_DATABASE_USER=postgres      # Database user
APP_DATABASE_PASSWORD=postgres  # Database password
APP_DATABASE_NAME=appointments  # Database name
APP_GRPC_PORT=50051            # gRPC server port
```

**Frontend (client):**
```bash
VITE_GRPC_BASE_URL=http://localhost:8080  # gRPC-Web endpoint
```

## 🐛 Troubleshooting

### Database Connection Issues

```bash
# Check if PostgreSQL is running
docker compose ps postgres

# Check connection
psql -h localhost -U postgres -d appointments -c "SELECT 1;"
```

### gRPC Connection Issues

```bash
# Check if Envoy is running
curl http://localhost:9901/stats

# Check if backend is running
grpcurl -plaintext localhost:50051 list
```

### Frontend Build Issues

```bash
cd client
rm -rf node_modules package-lock.json
npm install
```

## 📚 Additional Resources

- [DECISIONS.md](./DECISIONS.md) - Detailed architecture decisions and trade-offs
- [PostgreSQL EXCLUDE Constraints](https://www.postgresql.org/docs/current/ddl-constraints.html#DDL-CONSTRAINTS-EXCLUSION)
- [gRPC-Web Documentation](https://github.com/grpc/grpc-web)
- [Protocol Buffers Guide](https://protobuf.dev/programming-guides/proto3/)

## 🤝 Contributing

### Development Workflow

1. Create a feature branch
2. Make changes
3. Run tests
4. Update DECISIONS.md if architecture changes
5. Submit pull request

### Code Style

- **Go**: `gofmt` and `golangci-lint`
- **TypeScript**: ESLint and Prettier
- **Commits**: Conventional commits format

## 📝 License

This project is for demonstration purposes.

## 🎓 Learning Outcomes

This project demonstrates:
- ✅ Handling concurrent access with database constraints
- ✅ Two-layer defense strategy for data integrity
- ✅ gRPC and Protocol Buffers for type-safe APIs
- ✅ Clean architecture with domain-driven design
- ✅ Monorepo structure with multiple languages
- ✅ Docker Compose for local development
- ✅ Comprehensive documentation and decision records

---

**Built with ❤️ using Go, React, PostgreSQL, and gRPC**
