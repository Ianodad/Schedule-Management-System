package main

import (
	"context"
	"log"
	"os/signal"
	"syscall"

	"schedule-management-system/server/internal/config"
	"schedule-management-system/server/internal/db"
	grpcserver "schedule-management-system/server/internal/grpc"
	"schedule-management-system/server/internal/repository"
	"schedule-management-system/server/internal/service"
)

func main() {
	ctx, cancel := signal.NotifyContext(context.Background(), syscall.SIGINT, syscall.SIGTERM)
	defer cancel()

	// Load configuration
	cfg := config.Load()

	// Initialize database connection pool
	pool, err := db.NewPool(ctx, cfg.DB)
	if err != nil {
		log.Fatalf("database initialization failed: %v", err)
	}
	defer pool.Close()

	log.Printf("✓ Database connection established")

	// Run migrations
	if err := db.RunMigrations(ctx, pool); err != nil {
		log.Fatalf("migrations failed: %v", err)
	}
	log.Printf("✓ Database migrations applied")

	// Initialize repository layer
	appointmentRepo := repository.NewAppointmentRepository(pool)

	// Initialize service layer
	appointmentService := service.NewAppointmentService(appointmentRepo)

	// Initialize gRPC handler
	grpcHandler := grpcserver.NewAppointmentHandler(appointmentService)

	// Create and start gRPC server
	server, err := grpcserver.NewServer(cfg.GRPCPort, grpcHandler)
	if err != nil {
		log.Fatalf("failed to create gRPC server: %v", err)
	}

	log.Printf("✓ gRPC server starting on %s", server.Address())

	// Start server in goroutine
	go func() {
		if err := server.Serve(); err != nil {
			log.Fatalf("gRPC server error: %v", err)
		}
	}()

	log.Println("✓ Schedule Management System is running")
	log.Println("  Press Ctrl+C to shutdown...")

	// Wait for shutdown signal
	<-ctx.Done()

	log.Println("Shutdown signal received, stopping server...")
	server.Stop()
	log.Println("Server stopped gracefully")
}
