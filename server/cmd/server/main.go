package main

import (
	"context"
	"log"
	"os/signal"
	"syscall"

	"schedule-management-system/server/internal/config"
	"schedule-management-system/server/internal/db"
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

	log.Printf("server foundation initialized (grpc_port=%s)", cfg.GRPCPort)
	<-ctx.Done()
	log.Println("shutdown signal received")
}
