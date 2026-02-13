package domain

import "errors"

var (
	ErrAppointmentNotFound = errors.New("appointment not found")
	ErrAppointmentConflict = errors.New("appointment conflict")
	ErrVersionConflict     = errors.New("appointment version conflict")
	ErrInvalidTimeRange    = errors.New("end_time must be after start_time")
	ErrStartTimeInPast     = errors.New("start_time must be in the future")
)
