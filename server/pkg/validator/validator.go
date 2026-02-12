package validator

import "schedule-management-system/server/internal/domain"

func ValidateAppointment(a domain.Appointment) error {
	if !a.EndTime.After(a.StartTime) {
		return domain.ErrInvalidTimeRange
	}
	return nil
}
