package domain

import "time"

type AppointmentStatus string

const (
	StatusScheduled AppointmentStatus = "SCHEDULED"
	StatusCancelled AppointmentStatus = "CANCELLED"
	StatusCompleted AppointmentStatus = "COMPLETED"
)

type RecurrenceFrequency string

const (
	RecurrenceDaily   RecurrenceFrequency = "DAILY"
	RecurrenceWeekly  RecurrenceFrequency = "WEEKLY"
	RecurrenceMonthly RecurrenceFrequency = "MONTHLY"
)

type RecurrenceRule struct {
	Frequency RecurrenceFrequency
	Interval  int32
	Until     *time.Time
	Count     *int32
}

type Appointment struct {
	ID                  string
	UserID              string
	Title               string
	Description         string
	StartTime           time.Time
	EndTime             time.Time
	Location            string
	Attendees           []string
	Status              AppointmentStatus
	Recurrence          *RecurrenceRule
	ParentAppointmentID *string
	CreatedAt           time.Time
	UpdatedAt           time.Time
	Version             int64
}

type AppointmentFilter struct {
	From   *time.Time
	To     *time.Time
	Status *AppointmentStatus
	Limit  int32
	Offset int32
}
