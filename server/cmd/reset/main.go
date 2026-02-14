package main

import (
	"context"
	"fmt"
	"log"

	"schedule-management-system/server/internal/config"
	"schedule-management-system/server/internal/db"
)

func main() {
	ctx := context.Background()

	// Load configuration
	cfg := config.Load()

	// Initialize database
	pool, err := db.NewPool(ctx, cfg.DB)
	if err != nil {
		log.Fatalf("database connection failed: %v", err)
	}
	defer pool.Close()

	log.Println("✓ Database connected")
	log.Println("⚠  Deleting all appointments and events...")

	// Delete all appointment events first (foreign key constraint)
	eventResult, err := pool.Exec(ctx, "DELETE FROM appointment_events")
	if err != nil {
		log.Fatalf("failed to delete events: %v", err)
	}
	eventsDeleted := eventResult.RowsAffected()

	// Delete all appointments (includes both parent and child recurring instances)
	apptResult, err := pool.Exec(ctx, "DELETE FROM appointments")
	if err != nil {
		log.Fatalf("failed to delete appointments: %v", err)
	}
	apptsDeleted := apptResult.RowsAffected()

	// Reset sequences to start from 1 again
	if _, err := pool.Exec(ctx, "ALTER SEQUENCE appointment_events_id_seq RESTART WITH 1"); err != nil {
		log.Printf("⚠  Warning: failed to reset events sequence: %v", err)
	}

	log.Printf("✓ Deleted %d appointments", apptsDeleted)
	log.Printf("✓ Deleted %d events", eventsDeleted)
	log.Println("✓ Database reset complete!")

	// Optional: Show current table counts
	var apptCount, eventCount int64
	pool.QueryRow(ctx, "SELECT COUNT(*) FROM appointments").Scan(&apptCount)
	pool.QueryRow(ctx, "SELECT COUNT(*) FROM appointment_events").Scan(&eventCount)

	fmt.Printf("\nCurrent database state:\n")
	fmt.Printf("  Appointments: %d\n", apptCount)
	fmt.Printf("  Events: %d\n", eventCount)
}
