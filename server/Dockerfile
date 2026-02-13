# Development stage - with hot reload support
FROM golang:1.24-alpine AS development
WORKDIR /app

# Install air for hot reload in development
RUN go install github.com/air-verse/air@latest

# Copy go mod files
COPY go.mod go.sum ./
RUN go mod download

# Copy source code
COPY . .

EXPOSE 50051

# Use air for hot reload
CMD ["air", "-c", ".air.toml"]

# Production builder stage
FROM golang:1.24-alpine AS builder
WORKDIR /app

COPY go.mod go.sum ./
RUN go mod download

COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -o /server ./cmd/server

# Production runtime stage
FROM alpine:3.20 AS production
WORKDIR /app
COPY --from=builder /server /usr/local/bin/server
EXPOSE 50051
CMD ["server"]
