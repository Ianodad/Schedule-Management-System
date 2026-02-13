package service

import (
	"context"
	"testing"
	"time"

	"schedule-management-system/server/internal/domain"
)

// Mock repository for testing
type mockRepository struct {
	appointments map[string]domain.Appointment
	createFunc   func(context.Context, domain.Appointment) (domain.Appointment, error)
	getFunc      func(context.Context, string) (domain.Appointment, error)
	listFunc     func(context.Context, string, domain.AppointmentFilter) ([]domain.Appointment, error)
	updateFunc   func(context.Context, domain.Appointment) (domain.Appointment, error)
	deleteFunc   func(context.Context, string) error
	conflictFunc func(context.Context, string, time.Time, time.Time, *string) ([]domain.Appointment, error)
}

func (m *mockRepository) Create(ctx context.Context, appt domain.Appointment) (domain.Appointment, error) {
	if m.createFunc != nil {
		return m.createFunc(ctx, appt)
	}
	appt.ID = "test-id"
	appt.Version = 1
	appt.CreatedAt = time.Now()
	appt.UpdatedAt = time.Now()
	return appt, nil
}

func (m *mockRepository) GetByID(ctx context.Context, id string) (domain.Appointment, error) {
	if m.getFunc != nil {
		return m.getFunc(ctx, id)
	}
	return domain.Appointment{}, domain.ErrAppointmentNotFound
}

func (m *mockRepository) ListByUser(ctx context.Context, userID string, filter domain.AppointmentFilter) ([]domain.Appointment, error) {
	if m.listFunc != nil {
		return m.listFunc(ctx, userID, filter)
	}
	return []domain.Appointment{}, nil
}

func (m *mockRepository) Update(ctx context.Context, appt domain.Appointment) (domain.Appointment, error) {
	if m.updateFunc != nil {
		return m.updateFunc(ctx, appt)
	}
	appt.Version++
	appt.UpdatedAt = time.Now()
	return appt, nil
}

func (m *mockRepository) Delete(ctx context.Context, id string) error {
	if m.deleteFunc != nil {
		return m.deleteFunc(ctx, id)
	}
	return nil
}

func (m *mockRepository) CheckConflicts(ctx context.Context, userID string, start, end time.Time, excludeID *string) ([]domain.Appointment, error) {
	if m.conflictFunc != nil {
		return m.conflictFunc(ctx, userID, start, end, excludeID)
	}
	return []domain.Appointment{}, nil
}

func TestAppointmentService_CreateAppointment(t *testing.T) {
	tests := []struct {
		name          string
		appointment   domain.Appointment
		mockCreate    func(context.Context, domain.Appointment) (domain.Appointment, error)
		mockConflicts func(context.Context, string, time.Time, time.Time, *string) ([]domain.Appointment, error)
		wantErr       bool
		errContains   string
	}{
		{
			name: "successful creation",
			appointment: domain.Appointment{
				UserID:    "user-1",
				Title:     "Meeting",
				StartTime: time.Now().Add(1 * time.Hour),
				EndTime:   time.Now().Add(2 * time.Hour),
			},
			wantErr: false,
		},
		{
			name: "missing title",
			appointment: domain.Appointment{
				UserID:    "user-1",
				StartTime: time.Now().Add(1 * time.Hour),
				EndTime:   time.Now().Add(2 * time.Hour),
			},
			wantErr:     true,
			errContains: "title is required",
		},
		{
			name: "missing user_id",
			appointment: domain.Appointment{
				Title:     "Meeting",
				StartTime: time.Now().Add(1 * time.Hour),
				EndTime:   time.Now().Add(2 * time.Hour),
			},
			wantErr:     true,
			errContains: "user_id is required",
		},
		{
			name: "invalid time range",
			appointment: domain.Appointment{
				UserID:    "user-1",
				Title:     "Meeting",
				StartTime: time.Now().Add(2 * time.Hour),
				EndTime:   time.Now().Add(1 * time.Hour),
			},
			wantErr: true,
		},
		{
			name: "conflict error",
			appointment: domain.Appointment{
				UserID:    "user-1",
				Title:     "Meeting",
				StartTime: time.Now().Add(1 * time.Hour),
				EndTime:   time.Now().Add(2 * time.Hour),
			},
			mockCreate: func(ctx context.Context, appt domain.Appointment) (domain.Appointment, error) {
				return domain.Appointment{}, domain.ErrAppointmentConflict
			},
			wantErr:     true,
			errContains: "conflict",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			repo := &mockRepository{
				createFunc:   tt.mockCreate,
				conflictFunc: tt.mockConflicts,
			}
			service := NewAppointmentService(repo)

			_, _, err := service.CreateAppointment(context.Background(), tt.appointment)

			if tt.wantErr && err == nil {
				t.Errorf("expected error but got nil")
			}
			if !tt.wantErr && err != nil {
				t.Errorf("unexpected error: %v", err)
			}
			if tt.errContains != "" && err != nil && !contains(err.Error(), tt.errContains) {
				t.Errorf("expected error to contain %q, got %q", tt.errContains, err.Error())
			}
		})
	}
}

func TestAppointmentService_GetAppointment(t *testing.T) {
	tests := []struct {
		name       string
		id         string
		mockGet    func(context.Context, string) (domain.Appointment, error)
		wantErr    bool
		wantErrMsg string
	}{
		{
			name: "successful get",
			id:   "test-id",
			mockGet: func(ctx context.Context, id string) (domain.Appointment, error) {
				return domain.Appointment{
					ID:     id,
					Title:  "Test",
					UserID: "user-1",
				}, nil
			},
			wantErr: false,
		},
		{
			name:       "empty id",
			id:         "",
			wantErr:    true,
			wantErrMsg: "appointment ID is required",
		},
		{
			name: "not found",
			id:   "nonexistent",
			mockGet: func(ctx context.Context, id string) (domain.Appointment, error) {
				return domain.Appointment{}, domain.ErrAppointmentNotFound
			},
			wantErr: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			repo := &mockRepository{getFunc: tt.mockGet}
			service := NewAppointmentService(repo)

			_, err := service.GetAppointment(context.Background(), tt.id)

			if tt.wantErr && err == nil {
				t.Errorf("expected error but got nil")
			}
			if !tt.wantErr && err != nil {
				t.Errorf("unexpected error: %v", err)
			}
			if tt.wantErrMsg != "" && (err == nil || !contains(err.Error(), tt.wantErrMsg)) {
				t.Errorf("expected error message to contain %q, got %v", tt.wantErrMsg, err)
			}
		})
	}
}

func TestAppointmentService_UpdateAppointment(t *testing.T) {
	tests := []struct {
		name        string
		appointment domain.Appointment
		mockUpdate  func(context.Context, domain.Appointment) (domain.Appointment, error)
		wantErr     bool
		checkVersion bool
	}{
		{
			name: "successful update",
			appointment: domain.Appointment{
				ID:        "test-id",
				UserID:    "user-1",
				Title:     "Updated",
				StartTime: time.Now().Add(1 * time.Hour),
				EndTime:   time.Now().Add(2 * time.Hour),
				Version:   1,
			},
			wantErr:      false,
			checkVersion: true,
		},
		{
			name: "version conflict",
			appointment: domain.Appointment{
				ID:        "test-id",
				UserID:    "user-1",
				Title:     "Updated",
				StartTime: time.Now().Add(1 * time.Hour),
				EndTime:   time.Now().Add(2 * time.Hour),
				Version:   1,
			},
			mockUpdate: func(ctx context.Context, appt domain.Appointment) (domain.Appointment, error) {
				return domain.Appointment{}, domain.ErrVersionConflict
			},
			wantErr: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			repo := &mockRepository{updateFunc: tt.mockUpdate}
			service := NewAppointmentService(repo)

			updated, _, err := service.UpdateAppointment(context.Background(), tt.appointment)

			if tt.wantErr && err == nil {
				t.Errorf("expected error but got nil")
			}
			if !tt.wantErr && err != nil {
				t.Errorf("unexpected error: %v", err)
			}
			if tt.checkVersion && updated.Version != tt.appointment.Version+1 {
				t.Errorf("expected version %d, got %d", tt.appointment.Version+1, updated.Version)
			}
		})
	}
}

func TestAppointmentService_CheckConflicts(t *testing.T) {
	start := time.Now().Add(1 * time.Hour)
	end := start.Add(1 * time.Hour)

	tests := []struct {
		name          string
		userID        string
		startTime     time.Time
		endTime       time.Time
		mockConflicts func(context.Context, string, time.Time, time.Time, *string) ([]domain.Appointment, error)
		wantErr       bool
		wantConflicts int
	}{
		{
			name:      "no conflicts",
			userID:    "user-1",
			startTime: start,
			endTime:   end,
			mockConflicts: func(ctx context.Context, uid string, s, e time.Time, ex *string) ([]domain.Appointment, error) {
				return []domain.Appointment{}, nil
			},
			wantErr:       false,
			wantConflicts: 0,
		},
		{
			name:      "has conflicts",
			userID:    "user-1",
			startTime: start,
			endTime:   end,
			mockConflicts: func(ctx context.Context, uid string, s, e time.Time, ex *string) ([]domain.Appointment, error) {
				return []domain.Appointment{
					{ID: "conflict-1", Title: "Existing"},
				}, nil
			},
			wantErr:       false,
			wantConflicts: 1,
		},
		{
			name:      "invalid time range",
			userID:    "user-1",
			startTime: end,
			endTime:   start,
			wantErr:   true,
		},
		{
			name:      "missing user_id",
			userID:    "",
			startTime: start,
			endTime:   end,
			wantErr:   true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			repo := &mockRepository{conflictFunc: tt.mockConflicts}
			service := NewAppointmentService(repo)

			conflicts, err := service.CheckConflicts(context.Background(), tt.userID, tt.startTime, tt.endTime, nil)

			if tt.wantErr && err == nil {
				t.Errorf("expected error but got nil")
			}
			if !tt.wantErr && err != nil {
				t.Errorf("unexpected error: %v", err)
			}
			if !tt.wantErr && len(conflicts) != tt.wantConflicts {
				t.Errorf("expected %d conflicts, got %d", tt.wantConflicts, len(conflicts))
			}
		})
	}
}

func contains(s, substr string) bool {
	return len(s) > 0 && len(substr) > 0 && (s == substr || len(s) >= len(substr) && containsSubstr(s, substr))
}

func containsSubstr(s, substr string) bool {
	for i := 0; i <= len(s)-len(substr); i++ {
		if s[i:i+len(substr)] == substr {
			return true
		}
	}
	return false
}
