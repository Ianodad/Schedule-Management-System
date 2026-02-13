package repository

import (
	"context"
	"errors"
	"sync"
	"testing"
	"time"

	"schedule-management-system/server/internal/domain"
)

// TestConcurrentBookingAttempts tests that multiple concurrent booking attempts
// are handled correctly by the EXCLUDE constraint
func TestConcurrentBookingAttempts(t *testing.T) {
	repo, pool := setupTestRepository(t)
	defer pool.Close()

	ctx := context.Background()
	start := time.Now().UTC().Add(10 * time.Hour).Truncate(time.Second)
	end := start.Add(1 * time.Hour)

	// Launch 10 concurrent attempts to book the same time slot
	const numAttempts = 10
	var wg sync.WaitGroup
	results := make(chan error, numAttempts)

	for i := 0; i < numAttempts; i++ {
		wg.Add(1)
		go func(attempt int) {
			defer wg.Done()

			_, err := repo.Create(ctx, domain.Appointment{
				UserID:    "concurrent-user",
				Title:     "Concurrent Test",
				StartTime: start,
				EndTime:   end,
				Status:    domain.StatusScheduled,
			})

			results <- err
		}(i)
	}

	wg.Wait()
	close(results)

	// Count successes and failures
	var successes, conflicts int
	for err := range results {
		if err == nil {
			successes++
		} else if errors.Is(err, domain.ErrAppointmentConflict) {
			conflicts++
		} else {
			t.Errorf("unexpected error: %v", err)
		}
	}

	// Exactly one should succeed, all others should fail with conflict
	if successes != 1 {
		t.Errorf("expected 1 success, got %d", successes)
	}
	if conflicts != numAttempts-1 {
		t.Errorf("expected %d conflicts, got %d", numAttempts-1, conflicts)
	}

	t.Logf("✓ Concurrent booking test: %d attempts → 1 success, %d conflicts", numAttempts, conflicts)
}

// TestConcurrentUpdatesWithOptimisticLocking tests that concurrent updates
// to the same appointment are handled correctly with version conflicts
func TestConcurrentUpdatesWithOptimisticLocking(t *testing.T) {
	repo, pool := setupTestRepository(t)
	defer pool.Close()

	ctx := context.Background()
	start := time.Now().UTC().Add(11 * time.Hour).Truncate(time.Second)
	end := start.Add(1 * time.Hour)

	// Create initial appointment
	created, err := repo.Create(ctx, domain.Appointment{
		UserID:    "optimistic-user",
		Title:     "Initial",
		StartTime: start,
		EndTime:   end,
		Status:    domain.StatusScheduled,
	})
	if err != nil {
		t.Fatalf("create initial appointment: %v", err)
	}

	// Launch multiple concurrent updates
	const numUpdates = 5
	var wg sync.WaitGroup
	results := make(chan error, numUpdates)

	for i := 0; i < numUpdates; i++ {
		wg.Add(1)
		go func(attempt int) {
			defer wg.Done()

			// Each goroutine tries to update with the same version
			updated := created
			updated.Title = "Updated by goroutine"
			updated.EndTime = updated.EndTime.Add(10 * time.Minute)

			_, err := repo.Update(ctx, updated)
			results <- err
		}(i)
	}

	wg.Wait()
	close(results)

	// Count successes and version conflicts
	var successes, versionConflicts int
	for err := range results {
		if err == nil {
			successes++
		} else if errors.Is(err, domain.ErrVersionConflict) {
			versionConflicts++
		} else {
			t.Errorf("unexpected error: %v", err)
		}
	}

	// Exactly one should succeed, others should fail with version conflict
	if successes != 1 {
		t.Errorf("expected 1 success, got %d", successes)
	}
	if versionConflicts != numUpdates-1 {
		t.Errorf("expected %d version conflicts, got %d", numUpdates-1, versionConflicts)
	}

	t.Logf("✓ Optimistic locking test: %d updates → 1 success, %d version conflicts", numUpdates, versionConflicts)
}

// TestRaceConditionPrevention tests the scenario where two users try to book
// overlapping slots at exactly the same time
func TestRaceConditionPrevention(t *testing.T) {
	repo, pool := setupTestRepository(t)
	defer pool.Close()

	ctx := context.Background()
	start := time.Now().UTC().Add(12 * time.Hour).Truncate(time.Second)

	// User 1 books 2-3pm
	appt1 := domain.Appointment{
		UserID:    "race-user",
		Title:     "First Appointment",
		StartTime: start,
		EndTime:   start.Add(1 * time.Hour),
		Status:    domain.StatusScheduled,
	}

	// User 2 tries to book 2:30-3:30pm (overlaps)
	appt2 := domain.Appointment{
		UserID:    "race-user",
		Title:     "Second Appointment (overlapping)",
		StartTime: start.Add(30 * time.Minute),
		EndTime:   start.Add(90 * time.Minute),
		Status:    domain.StatusScheduled,
	}

	// Launch both attempts concurrently
	var wg sync.WaitGroup
	results := make(chan error, 2)

	wg.Add(2)
	go func() {
		defer wg.Done()
		_, err := repo.Create(ctx, appt1)
		results <- err
	}()
	go func() {
		defer wg.Done()
		_, err := repo.Create(ctx, appt2)
		results <- err
	}()

	wg.Wait()
	close(results)

	// Collect results
	errs := make([]error, 0, 2)
	for err := range results {
		errs = append(errs, err)
	}

	// One should succeed, one should fail
	var successes, conflicts int
	for _, err := range errs {
		if err == nil {
			successes++
		} else if errors.Is(err, domain.ErrAppointmentConflict) {
			conflicts++
		} else {
			t.Errorf("unexpected error: %v", err)
		}
	}

	if successes != 1 {
		t.Errorf("expected 1 success, got %d", successes)
	}
	if conflicts != 1 {
		t.Errorf("expected 1 conflict, got %d", conflicts)
	}

	t.Logf("✓ Race condition test: 2 overlapping attempts → 1 success, 1 conflict")
}

// TestHighConcurrencyScenario tests system behavior under high concurrent load
func TestHighConcurrencyScenario(t *testing.T) {
	repo, pool := setupTestRepository(t)
	defer pool.Close()

	ctx := context.Background()
	baseTime := time.Now().UTC().Add(24 * time.Hour).Truncate(time.Second)

	// Create 100 concurrent booking attempts for different time slots
	// Some will overlap, some won't
	const numAttempts = 100
	var wg sync.WaitGroup
	results := make(chan error, numAttempts)

	for i := 0; i < numAttempts; i++ {
		wg.Add(1)
		go func(attempt int) {
			defer wg.Done()

			// Create appointments with some overlap
			// Every 5th appointment starts at the same time
			slot := attempt / 5
			start := baseTime.Add(time.Duration(slot) * time.Hour)
			end := start.Add(1 * time.Hour)

			_, err := repo.Create(ctx, domain.Appointment{
				UserID:    "high-concurrency-user",
				Title:     "High Concurrency Test",
				StartTime: start,
				EndTime:   end,
				Status:    domain.StatusScheduled,
			})

			results <- err
		}(i)
	}

	wg.Wait()
	close(results)

	// Count results
	var successes, conflicts, others int
	for err := range results {
		if err == nil {
			successes++
		} else if errors.Is(err, domain.ErrAppointmentConflict) {
			conflicts++
		} else {
			others++
			t.Logf("other error: %v", err)
		}
	}

	// We expect 20 successful bookings (one per time slot)
	// and 80 conflicts (4 extra attempts per slot)
	expectedSuccesses := 20
	expectedConflicts := 80

	if successes != expectedSuccesses {
		t.Errorf("expected %d successes, got %d", expectedSuccesses, successes)
	}
	if conflicts != expectedConflicts {
		t.Errorf("expected %d conflicts, got %d", expectedConflicts, conflicts)
	}
	if others > 0 {
		t.Errorf("unexpected %d other errors", others)
	}

	t.Logf("✓ High concurrency test: %d attempts → %d successes, %d conflicts", numAttempts, successes, conflicts)
}

// TestNoConflictForDifferentUsers tests that different users can book the same time
func TestNoConflictForDifferentUsers(t *testing.T) {
	repo, pool := setupTestRepository(t)
	defer pool.Close()

	ctx := context.Background()
	start := time.Now().UTC().Add(48 * time.Hour).Truncate(time.Second)
	end := start.Add(1 * time.Hour)

	// Two different users book the same time - should both succeed
	var wg sync.WaitGroup
	results := make(chan error, 2)

	users := []string{"user-a", "user-b"}
	for _, userID := range users {
		wg.Add(1)
		go func(uid string) {
			defer wg.Done()

			_, err := repo.Create(ctx, domain.Appointment{
				UserID:    uid,
				Title:     "Same time, different users",
				StartTime: start,
				EndTime:   end,
				Status:    domain.StatusScheduled,
			})

			results <- err
		}(userID)
	}

	wg.Wait()
	close(results)

	// Both should succeed (different users)
	for err := range results {
		if err != nil {
			t.Errorf("expected no error, got: %v", err)
		}
	}

	t.Logf("✓ Different users can book same time slot")
}

// TestCancelledAppointmentsDoNotConflict tests that cancelled appointments
// don't prevent booking the same time slot
func TestCancelledAppointmentsDoNotConflict(t *testing.T) {
	repo, pool := setupTestRepository(t)
	defer pool.Close()

	ctx := context.Background()
	start := time.Now().UTC().Add(72 * time.Hour).Truncate(time.Second)
	end := start.Add(1 * time.Hour)

	// Create and cancel an appointment
	created, err := repo.Create(ctx, domain.Appointment{
		UserID:    "cancelled-user",
		Title:     "To be cancelled",
		StartTime: start,
		EndTime:   end,
		Status:    domain.StatusScheduled,
	})
	if err != nil {
		t.Fatalf("create: %v", err)
	}

	// Cancel it
	created.Status = domain.StatusCancelled
	_, err = repo.Update(ctx, created)
	if err != nil {
		t.Fatalf("cancel: %v", err)
	}

	// Now try to book the same time - should succeed because cancelled don't conflict
	_, err = repo.Create(ctx, domain.Appointment{
		UserID:    "cancelled-user",
		Title:     "New appointment",
		StartTime: start,
		EndTime:   end,
		Status:    domain.StatusScheduled,
	})

	if err != nil {
		t.Errorf("expected to book after cancellation, got error: %v", err)
	}

	t.Logf("✓ Cancelled appointments don't prevent new bookings")
}
