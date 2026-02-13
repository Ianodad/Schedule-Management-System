package main

import (
	"context"
	"fmt"
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

	cfg := config.Load()
	pool, err := db.NewPool(ctx, cfg.DB)
	if err != nil {
		log.Fatalf("database initialization failed: %v", err)
	}
	defer pool.Close()

	if err := db.ApplyMigrations(ctx, pool); err != nil {
		log.Fatalf("migration failed: %v", err)
	}

	repo := repository.NewAppointmentRepository(pool)
	svc := service.NewAppointmentService(repo)
	handler := grpcserver.NewAppointmentHandler(svc)

	addr := fmt.Sprintf("0.0.0.0:%s", cfg.GRPCPort)
	server, err := grpcserver.NewServer(addr, handler)
	if err != nil {
		log.Fatalf("grpc server init failed: %v", err)
	}

	go func() {
		log.Printf("gRPC server listening on %s", addr)
		if serveErr := server.Serve(); serveErr != nil {
			log.Printf("grpc server stopped: %v", serveErr)
			cancel()
		}
	}()

	<-ctx.Done()
	log.Println("shutdown signal received")
	server.GracefulStop()
}
