package service

import (
	"context"
	"time"

	"schedule-management-system/server/internal/domain"
	"schedule-management-system/server/internal/repository"
)

type AppointmentService interface {
	CreateAppointment(ctx context.Context, appt domain.Appointment) (domain.Appointment, []domain.Appointment, error)
	GetAppointment(ctx context.Context, id string) (domain.Appointment, error)
	ListAppointments(ctx context.Context, userID string, filter domain.AppointmentFilter) ([]domain.Appointment, error)
	UpdateAppointment(ctx context.Context, appt domain.Appointment) (domain.Appointment, []domain.Appointment, error)
	DeleteAppointment(ctx context.Context, id string) error
	CheckConflicts(ctx context.Context, userID string, start, end time.Time, excludeID *string) ([]domain.Appointment, error)
}

type appointmentService struct {
	repo repository.AppointmentRepository
}

func NewAppointmentService(repo repository.AppointmentRepository) AppointmentService {
	return &appointmentService{repo: repo}
}

func (s *appointmentService) CreateAppointment(ctx context.Context, appt domain.Appointment) (domain.Appointment, []domain.Appointment, error) {
	conflicts, err := s.repo.CheckConflicts(ctx, appt.UserID, appt.StartTime, appt.EndTime, nil)
	if err != nil {
		return domain.Appointment{}, nil, err
	}
	if len(conflicts) > 0 {
		return domain.Appointment{}, conflicts, nil
	}

	created, err := s.repo.Create(ctx, appt)
	if err != nil {
		return domain.Appointment{}, nil, err
	}
	return created, nil, nil
}

func (s *appointmentService) GetAppointment(ctx context.Context, id string) (domain.Appointment, error) {
	return s.repo.GetByID(ctx, id)
}

func (s *appointmentService) ListAppointments(ctx context.Context, userID string, filter domain.AppointmentFilter) ([]domain.Appointment, error) {
	return s.repo.ListByUser(ctx, userID, filter)
}

func (s *appointmentService) UpdateAppointment(ctx context.Context, appt domain.Appointment) (domain.Appointment, []domain.Appointment, error) {
	conflicts, err := s.repo.CheckConflicts(ctx, appt.UserID, appt.StartTime, appt.EndTime, &appt.ID)
	if err != nil {
		return domain.Appointment{}, nil, err
	}
	if len(conflicts) > 0 {
		return domain.Appointment{}, conflicts, nil
	}

	updated, err := s.repo.Update(ctx, appt)
	if err != nil {
		return domain.Appointment{}, nil, err
	}
	return updated, nil, nil
}

func (s *appointmentService) DeleteAppointment(ctx context.Context, id string) error {
	return s.repo.Delete(ctx, id)
}

func (s *appointmentService) CheckConflicts(ctx context.Context, userID string, start, end time.Time, excludeID *string) ([]domain.Appointment, error) {
	return s.repo.CheckConflicts(ctx, userID, start, end, excludeID)
}
