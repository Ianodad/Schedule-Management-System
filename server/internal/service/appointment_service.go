package service

import (
	"context"
	"fmt"
	"time"

	"schedule-management-system/server/internal/domain"
	"schedule-management-system/server/internal/repository"
)

// AppointmentService handles business logic for appointments
type AppointmentService struct {
	repo      repository.AppointmentRepository
	eventRepo repository.EventRepository
	now       func() time.Time
}

// NewAppointmentService creates a new appointment service
func NewAppointmentService(repo repository.AppointmentRepository) *AppointmentService {
	return &AppointmentService{
		repo: repo,
		now:  time.Now,
	}
}

// SetEventRepository sets the event repository for streaming support
func (s *AppointmentService) SetEventRepository(eventRepo repository.EventRepository) {
	s.eventRepo = eventRepo
}

// GetEventsSince retrieves appointment events since a given event ID
func (s *AppointmentService) GetEventsSince(ctx context.Context, userID string, sinceID int64, limit int) ([]domain.AppointmentEvent, error) {
	if s.eventRepo == nil {
		return nil, fmt.Errorf("event repository not configured")
	}
	if userID == "" {
		return nil, fmt.Errorf("user_id is required")
	}
	return s.eventRepo.GetEventsSince(ctx, userID, sinceID, limit)
}

// CreateAppointment creates a new appointment with conflict checking
func (s *AppointmentService) CreateAppointment(ctx context.Context, appt domain.Appointment) (domain.Appointment, []domain.Appointment, error) {
	// Validate time range
	if !appt.EndTime.After(appt.StartTime) {
		return domain.Appointment{}, nil, domain.ErrInvalidTimeRange
	}
	if err := s.validateStartTime(appt.StartTime); err != nil {
		return domain.Appointment{}, nil, err
	}

	// Validate title
	if appt.Title == "" {
		return domain.Appointment{}, nil, fmt.Errorf("title is required")
	}

	// Validate user ID
	if appt.UserID == "" {
		return domain.Appointment{}, nil, fmt.Errorf("user_id is required")
	}

	// Check for conflicts proactively (better UX)
	conflicts, err := s.repo.CheckConflicts(ctx, appt.UserID, appt.StartTime, appt.EndTime, nil)
	if err != nil {
		return domain.Appointment{}, nil, fmt.Errorf("checking conflicts: %w", err)
	}

	// Attempt to create (database constraint is the final authority)
	created, err := s.repo.Create(ctx, appt)
	if err != nil {
		// If constraint violation, fetch conflicts for error details
		if err == domain.ErrAppointmentConflict {
			conflicts, _ = s.repo.CheckConflicts(ctx, appt.UserID, appt.StartTime, appt.EndTime, nil)
			return domain.Appointment{}, conflicts, domain.ErrAppointmentConflict
		}
		return domain.Appointment{}, nil, fmt.Errorf("creating appointment: %w", err)
	}

	// Handle recurring appointments
	if created.Recurrence != nil {
		// Generate recurring instances (handled by database function)
		// This is a simplified approach - in production you might want more control
	}

	return created, conflicts, nil
}

// GetAppointment retrieves an appointment by ID
func (s *AppointmentService) GetAppointment(ctx context.Context, id string) (domain.Appointment, error) {
	if id == "" {
		return domain.Appointment{}, fmt.Errorf("appointment ID is required")
	}

	appt, err := s.repo.GetByID(ctx, id)
	if err != nil {
		return domain.Appointment{}, fmt.Errorf("getting appointment: %w", err)
	}

	return appt, nil
}

// ListAppointments retrieves appointments for a user with optional filters
func (s *AppointmentService) ListAppointments(ctx context.Context, userID string, filter domain.AppointmentFilter) ([]domain.Appointment, error) {
	if userID == "" {
		return nil, fmt.Errorf("user_id is required")
	}

	appointments, err := s.repo.ListByUser(ctx, userID, filter)
	if err != nil {
		return nil, fmt.Errorf("listing appointments: %w", err)
	}

	return appointments, nil
}

// UpdateAppointment updates an existing appointment
func (s *AppointmentService) UpdateAppointment(ctx context.Context, appt domain.Appointment) (domain.Appointment, []domain.Appointment, error) {
	// Validate time range
	if !appt.EndTime.After(appt.StartTime) {
		return domain.Appointment{}, nil, domain.ErrInvalidTimeRange
	}
	if err := s.validateStartTime(appt.StartTime); err != nil {
		return domain.Appointment{}, nil, err
	}

	// Validate required fields
	if appt.ID == "" {
		return domain.Appointment{}, nil, fmt.Errorf("appointment ID is required")
	}
	if appt.Title == "" {
		return domain.Appointment{}, nil, fmt.Errorf("title is required")
	}

	// Check for conflicts (excluding current appointment)
	excludeID := appt.ID
	conflicts, err := s.repo.CheckConflicts(ctx, appt.UserID, appt.StartTime, appt.EndTime, &excludeID)
	if err != nil {
		return domain.Appointment{}, nil, fmt.Errorf("checking conflicts: %w", err)
	}

	// Attempt update (optimistic locking enforced by repository)
	updated, err := s.repo.Update(ctx, appt)
	if err != nil {
		// If constraint violation, fetch conflicts
		if err == domain.ErrAppointmentConflict {
			conflicts, _ = s.repo.CheckConflicts(ctx, appt.UserID, appt.StartTime, appt.EndTime, &excludeID)
			return domain.Appointment{}, conflicts, domain.ErrAppointmentConflict
		}
		return domain.Appointment{}, nil, fmt.Errorf("updating appointment: %w", err)
	}

	return updated, conflicts, nil
}

// DeleteAppointment deletes an appointment
func (s *AppointmentService) DeleteAppointment(ctx context.Context, id string) error {
	if id == "" {
		return fmt.Errorf("appointment ID is required")
	}

	err := s.repo.Delete(ctx, id)
	if err != nil {
		return fmt.Errorf("deleting appointment: %w", err)
	}

	return nil
}

// CheckConflicts checks for scheduling conflicts
func (s *AppointmentService) CheckConflicts(ctx context.Context, userID string, startTime, endTime time.Time, excludeID *string) ([]domain.Appointment, error) {
	if userID == "" {
		return nil, fmt.Errorf("user_id is required")
	}
	if !endTime.After(startTime) {
		return nil, domain.ErrInvalidTimeRange
	}

	conflicts, err := s.repo.CheckConflicts(ctx, userID, startTime, endTime, excludeID)
	if err != nil {
		return nil, fmt.Errorf("checking conflicts: %w", err)
	}

	return conflicts, nil
}

func (s *AppointmentService) validateStartTime(startTime time.Time) error {
	if !startTime.After(s.now()) {
		return domain.ErrStartTimeInPast
	}
	return nil
}
