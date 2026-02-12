package repository

import (
	"context"
	"errors"
	"os"
	"path/filepath"
	"testing"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
	"schedule-management-system/server/internal/domain"
)

func setupTestRepository(t *testing.T) (AppointmentRepository, *pgxpool.Pool) {
	t.Helper()

	databaseURL := os.Getenv("TEST_DATABASE_URL")
	if databaseURL == "" {
		databaseURL = "postgres://schedule_user:schedule_password@localhost:5432/schedule_db?sslmode=disable"
	}

	ctx := context.Background()
	pool, err := pgxpool.New(ctx, databaseURL)
	if err != nil {
		t.Skipf("skipping: cannot create postgres pool: %v", err)
	}

	if err = pool.Ping(ctx); err != nil {
		pool.Close()
		t.Skipf("skipping: postgres not reachable (start with `docker compose up postgres`): %v", err)
	}

	migrationPath := filepath.Join("..", "db", "migrations", "001_initial_schema.sql")
	migration, err := os.ReadFile(migrationPath)
	if err != nil {
		pool.Close()
		t.Fatalf("read migration: %v", err)
	}

	if _, err = pool.Exec(ctx, string(migration)); err != nil {
		pool.Close()
		t.Fatalf("apply migration: %v", err)
	}

	if _, err = pool.Exec(ctx, "TRUNCATE TABLE appointment_events, appointments RESTART IDENTITY CASCADE"); err != nil {
		pool.Close()
		t.Fatalf("reset tables: %v", err)
	}

	return NewAppointmentRepository(pool), pool
}

func TestAppointmentRepository_CreateAndGetByID(t *testing.T) {
	repo, pool := setupTestRepository(t)
	defer pool.Close()

	ctx := context.Background()
	start := time.Now().UTC().Add(1 * time.Hour).Truncate(time.Second)
	end := start.Add(45 * time.Minute)

	created, err := repo.Create(ctx, domain.Appointment{
		UserID:      "user-1",
		Title:       "Engineering Sync",
		Description: "Sprint planning",
		StartTime:   start,
		EndTime:     end,
		Location:    "Room A",
		Attendees:   []string{"a@example.com", "b@example.com"},
		Status:      domain.StatusScheduled,
	})
	if err != nil {
		t.Fatalf("create: %v", err)
	}
	if created.ID == "" {
		t.Fatal("expected created appointment id")
	}
	if created.Version != 1 {
		t.Fatalf("expected version 1, got %d", created.Version)
	}

	fetched, err := repo.GetByID(ctx, created.ID)
	if err != nil {
		t.Fatalf("get by id: %v", err)
	}
	if fetched.Title != "Engineering Sync" {
		t.Fatalf("unexpected title: %q", fetched.Title)
	}
	if fetched.UserID != "user-1" {
		t.Fatalf("unexpected user_id: %q", fetched.UserID)
	}
}

func TestAppointmentRepository_ListByUser(t *testing.T) {
	repo, pool := setupTestRepository(t)
	defer pool.Close()

	ctx := context.Background()
	base := time.Now().UTC().Add(2 * time.Hour).Truncate(time.Second)

	_, _ = repo.Create(ctx, domain.Appointment{
		UserID:    "user-2",
		Title:     "A",
		StartTime: base,
		EndTime:   base.Add(30 * time.Minute),
		Status:    domain.StatusScheduled,
	})
	_, _ = repo.Create(ctx, domain.Appointment{
		UserID:    "user-2",
		Title:     "B",
		StartTime: base.Add(1 * time.Hour),
		EndTime:   base.Add(90 * time.Minute),
		Status:    domain.StatusScheduled,
	})
	_, _ = repo.Create(ctx, domain.Appointment{
		UserID:    "user-3",
		Title:     "Other user",
		StartTime: base,
		EndTime:   base.Add(15 * time.Minute),
		Status:    domain.StatusScheduled,
	})

	list, err := repo.ListByUser(ctx, "user-2", domain.AppointmentFilter{Limit: 10})
	if err != nil {
		t.Fatalf("list by user: %v", err)
	}
	if len(list) != 2 {
		t.Fatalf("expected 2 appointments, got %d", len(list))
	}
	if list[0].Title != "A" || list[1].Title != "B" {
		t.Fatalf("unexpected order: %q then %q", list[0].Title, list[1].Title)
	}
}

func TestAppointmentRepository_CreateConflict(t *testing.T) {
	repo, pool := setupTestRepository(t)
	defer pool.Close()

	ctx := context.Background()
	start := time.Now().UTC().Add(3 * time.Hour).Truncate(time.Second)
	end := start.Add(1 * time.Hour)

	_, err := repo.Create(ctx, domain.Appointment{
		UserID:    "user-4",
		Title:     "First",
		StartTime: start,
		EndTime:   end,
		Status:    domain.StatusScheduled,
	})
	if err != nil {
		t.Fatalf("first create: %v", err)
	}

	_, err = repo.Create(ctx, domain.Appointment{
		UserID:    "user-4",
		Title:     "Overlap",
		StartTime: start.Add(15 * time.Minute),
		EndTime:   end.Add(15 * time.Minute),
		Status:    domain.StatusScheduled,
	})
	if !errors.Is(err, domain.ErrAppointmentConflict) {
		t.Fatalf("expected conflict error, got: %v", err)
	}
}

func TestAppointmentRepository_UpdateWithVersionConflict(t *testing.T) {
	repo, pool := setupTestRepository(t)
	defer pool.Close()

	ctx := context.Background()
	start := time.Now().UTC().Add(4 * time.Hour).Truncate(time.Second)
	end := start.Add(1 * time.Hour)

	created, err := repo.Create(ctx, domain.Appointment{
		UserID:    "user-5",
		Title:     "Initial",
		StartTime: start,
		EndTime:   end,
		Status:    domain.StatusScheduled,
	})
	if err != nil {
		t.Fatalf("create: %v", err)
	}

	created.Title = "Updated"
	updated, err := repo.Update(ctx, created)
	if err != nil {
		t.Fatalf("update: %v", err)
	}
	if updated.Version != 2 {
		t.Fatalf("expected version 2, got %d", updated.Version)
	}

	created.Title = "Stale Update"
	_, err = repo.Update(ctx, created)
	if !errors.Is(err, domain.ErrVersionConflict) {
		t.Fatalf("expected version conflict, got: %v", err)
	}
}

func TestAppointmentRepository_Delete(t *testing.T) {
	repo, pool := setupTestRepository(t)
	defer pool.Close()

	ctx := context.Background()
	start := time.Now().UTC().Add(5 * time.Hour).Truncate(time.Second)
	end := start.Add(30 * time.Minute)

	created, err := repo.Create(ctx, domain.Appointment{
		UserID:    "user-6",
		Title:     "Delete me",
		StartTime: start,
		EndTime:   end,
		Status:    domain.StatusScheduled,
	})
	if err != nil {
		t.Fatalf("create: %v", err)
	}

	if err = repo.Delete(ctx, created.ID); err != nil {
		t.Fatalf("delete: %v", err)
	}

	_, err = repo.GetByID(ctx, created.ID)
	if !errors.Is(err, domain.ErrAppointmentNotFound) {
		t.Fatalf("expected not found after delete, got: %v", err)
	}
}
