package repository

import (
	"context"
	"errors"
	"fmt"
	"strings"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
	"github.com/jackc/pgx/v5/pgxpool"
	"schedule-management-system/server/internal/domain"
)

type AppointmentRepository interface {
	Create(ctx context.Context, appt domain.Appointment) (domain.Appointment, error)
	GetByID(ctx context.Context, id string) (domain.Appointment, error)
	ListByUser(ctx context.Context, userID string, filter domain.AppointmentFilter) ([]domain.Appointment, error)
	Update(ctx context.Context, appt domain.Appointment) (domain.Appointment, error)
	Delete(ctx context.Context, id string) error
	DeleteByParent(ctx context.Context, parentID string) error
	CheckConflicts(ctx context.Context, userID string, start, end time.Time, excludeID *string) ([]domain.Appointment, error)
	GenerateRecurringInstances(ctx context.Context, appt domain.Appointment) (int, error)
}

type appointmentRepository struct {
	pool *pgxpool.Pool
}

func NewAppointmentRepository(pool *pgxpool.Pool) AppointmentRepository {
	return &appointmentRepository{pool: pool}
}

func (r *appointmentRepository) Create(ctx context.Context, appt domain.Appointment) (domain.Appointment, error) {
	if !appt.EndTime.After(appt.StartTime) {
		return domain.Appointment{}, domain.ErrInvalidTimeRange
	}

	frequency, interval, until, count := flattenRecurrence(appt.Recurrence)
	if appt.Status == "" {
		appt.Status = domain.StatusScheduled
	}

	const q = `
		INSERT INTO appointments (
			user_id, title, description, start_time, end_time, location, attendees, status,
			recurrence_frequency, recurrence_interval, recurrence_until, recurrence_count, parent_appointment_id
		) VALUES (
			$1, $2, $3, $4, $5, $6, $7, $8,
			$9, $10, $11, $12, $13
		)
		RETURNING id, user_id, title, description, start_time, end_time, COALESCE(location, ''), attendees, status,
			recurrence_frequency, recurrence_interval, recurrence_until, recurrence_count,
			parent_appointment_id, created_at, updated_at, version
	`

	row := r.pool.QueryRow(ctx, q,
		appt.UserID,
		appt.Title,
		appt.Description,
		appt.StartTime,
		appt.EndTime,
		nullIfEmpty(appt.Location),
		appt.Attendees,
		string(appt.Status),
		frequency,
		interval,
		until,
		count,
		appt.ParentAppointmentID,
	)

	stored, err := scanAppointment(row)
	if err != nil {
		return domain.Appointment{}, mapPGError(err)
	}
	return stored, nil
}

func (r *appointmentRepository) GetByID(ctx context.Context, id string) (domain.Appointment, error) {
	const q = `
		SELECT id, user_id, title, description, start_time, end_time, COALESCE(location, ''), attendees, status,
			recurrence_frequency, recurrence_interval, recurrence_until, recurrence_count,
			parent_appointment_id, created_at, updated_at, version
		FROM appointments
		WHERE id = $1
	`

	appt, err := scanAppointment(r.pool.QueryRow(ctx, q, id))
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return domain.Appointment{}, domain.ErrAppointmentNotFound
		}
		return domain.Appointment{}, mapPGError(err)
	}
	return appt, nil
}

func (r *appointmentRepository) ListByUser(ctx context.Context, userID string, filter domain.AppointmentFilter) ([]domain.Appointment, error) {
	args := []any{userID}
	where := []string{"user_id = $1"}
	argN := 2

	if filter.From != nil {
		where = append(where, fmt.Sprintf("end_time > $%d", argN))
		args = append(args, *filter.From)
		argN++
	}
	if filter.To != nil {
		where = append(where, fmt.Sprintf("start_time < $%d", argN))
		args = append(args, *filter.To)
		argN++
	}
	if filter.Status != nil {
		where = append(where, fmt.Sprintf("status = $%d", argN))
		args = append(args, string(*filter.Status))
		argN++
	}

	limit := filter.Limit
	if limit <= 0 {
		limit = 100
	}
	if limit > 500 {
		limit = 500
	}

	q := fmt.Sprintf(`
		SELECT id, user_id, title, description, start_time, end_time, COALESCE(location, ''), attendees, status,
			recurrence_frequency, recurrence_interval, recurrence_until, recurrence_count,
			parent_appointment_id, created_at, updated_at, version
		FROM appointments
		WHERE %s
		ORDER BY start_time ASC
		LIMIT $%d OFFSET $%d
	`, strings.Join(where, " AND "), argN, argN+1)

	args = append(args, limit, filter.Offset)

	rows, err := r.pool.Query(ctx, q, args...)
	if err != nil {
		return nil, mapPGError(err)
	}
	defer rows.Close()

	appointments := make([]domain.Appointment, 0)
	for rows.Next() {
		appt, scanErr := scanAppointment(rows)
		if scanErr != nil {
			return nil, mapPGError(scanErr)
		}
		appointments = append(appointments, appt)
	}
	if err = rows.Err(); err != nil {
		return nil, mapPGError(err)
	}

	return appointments, nil
}

func (r *appointmentRepository) Update(ctx context.Context, appt domain.Appointment) (domain.Appointment, error) {
	if !appt.EndTime.After(appt.StartTime) {
		return domain.Appointment{}, domain.ErrInvalidTimeRange
	}

	frequency, interval, until, count := flattenRecurrence(appt.Recurrence)
	const q = `
		UPDATE appointments
		SET title = $2,
			description = $3,
			start_time = $4,
			end_time = $5,
			location = $6,
			attendees = $7,
			status = $8,
			recurrence_frequency = $9,
			recurrence_interval = $10,
			recurrence_until = $11,
			recurrence_count = $12,
			version = version + 1
		WHERE id = $1 AND version = $13
		RETURNING id, user_id, title, description, start_time, end_time, COALESCE(location, ''), attendees, status,
			recurrence_frequency, recurrence_interval, recurrence_until, recurrence_count,
			parent_appointment_id, created_at, updated_at, version
	`

	updated, err := scanAppointment(r.pool.QueryRow(ctx, q,
		appt.ID,
		appt.Title,
		appt.Description,
		appt.StartTime,
		appt.EndTime,
		nullIfEmpty(appt.Location),
		appt.Attendees,
		string(appt.Status),
		frequency,
		interval,
		until,
		count,
		appt.Version,
	))
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			_, getErr := r.GetByID(ctx, appt.ID)
			if errors.Is(getErr, domain.ErrAppointmentNotFound) {
				return domain.Appointment{}, domain.ErrAppointmentNotFound
			}
			if getErr != nil {
				return domain.Appointment{}, getErr
			}
			return domain.Appointment{}, domain.ErrVersionConflict
		}
		return domain.Appointment{}, mapPGError(err)
	}
	return updated, nil
}

func (r *appointmentRepository) Delete(ctx context.Context, id string) error {
	cmd, err := r.pool.Exec(ctx, `DELETE FROM appointments WHERE id = $1`, id)
	if err != nil {
		return mapPGError(err)
	}
	if cmd.RowsAffected() == 0 {
		return domain.ErrAppointmentNotFound
	}
	return nil
}

func (r *appointmentRepository) DeleteByParent(ctx context.Context, parentID string) error {
	_, err := r.pool.Exec(ctx, `DELETE FROM appointments WHERE parent_appointment_id = $1`, parentID)
	if err != nil {
		return mapPGError(err)
	}
	return nil
}

func (r *appointmentRepository) GenerateRecurringInstances(ctx context.Context, appt domain.Appointment) (int, error) {
	if appt.Recurrence == nil {
		return 0, nil
	}

	frequency := string(appt.Recurrence.Frequency)
	interval := appt.Recurrence.Interval
	if interval <= 0 {
		interval = 1
	}

	var until *time.Time
	var count *int32
	if appt.Recurrence.Until != nil {
		until = appt.Recurrence.Until
	}
	if appt.Recurrence.Count != nil {
		count = appt.Recurrence.Count
	}

	var instancesCreated int
	err := r.pool.QueryRow(ctx,
		`SELECT generate_recurring_instances($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
		appt.ID,
		appt.UserID,
		appt.Title,
		appt.Description,
		appt.StartTime,
		appt.EndTime,
		nullIfEmpty(appt.Location),
		appt.Attendees,
		frequency,
		interval,
		until,
		count,
	).Scan(&instancesCreated)
	if err != nil {
		return 0, mapPGError(err)
	}
	return instancesCreated, nil
}

func (r *appointmentRepository) CheckConflicts(ctx context.Context, userID string, start, end time.Time, excludeID *string) ([]domain.Appointment, error) {
	const q = `
		SELECT id, title, start_time, end_time, COALESCE(location, '')
		FROM check_appointment_conflicts($1, $2, $3, $4)
		ORDER BY start_time ASC
	`

	rows, err := r.pool.Query(ctx, q, userID, start, end, excludeID)
	if err != nil {
		return nil, mapPGError(err)
	}
	defer rows.Close()

	conflicts := make([]domain.Appointment, 0)
	for rows.Next() {
		var a domain.Appointment
		a.UserID = userID
		a.Status = domain.StatusScheduled
		if scanErr := rows.Scan(&a.ID, &a.Title, &a.StartTime, &a.EndTime, &a.Location); scanErr != nil {
			return nil, scanErr
		}
		conflicts = append(conflicts, a)
	}
	if err = rows.Err(); err != nil {
		return nil, err
	}
	return conflicts, nil
}

func scanAppointment(row pgx.Row) (domain.Appointment, error) {
	var appt domain.Appointment
	var recurrenceFrequency *string
	var recurrenceInterval *int32
	var recurrenceUntil *time.Time
	var recurrenceCount *int32
	var parentID *string

	err := row.Scan(
		&appt.ID,
		&appt.UserID,
		&appt.Title,
		&appt.Description,
		&appt.StartTime,
		&appt.EndTime,
		&appt.Location,
		&appt.Attendees,
		&appt.Status,
		&recurrenceFrequency,
		&recurrenceInterval,
		&recurrenceUntil,
		&recurrenceCount,
		&parentID,
		&appt.CreatedAt,
		&appt.UpdatedAt,
		&appt.Version,
	)
	if err != nil {
		return domain.Appointment{}, err
	}

	appt.ParentAppointmentID = parentID
	appt.Recurrence = expandRecurrence(recurrenceFrequency, recurrenceInterval, recurrenceUntil, recurrenceCount)
	return appt, nil
}

func flattenRecurrence(r *domain.RecurrenceRule) (*string, *int32, *time.Time, *int32) {
	if r == nil {
		return nil, nil, nil, nil
	}
	freq := string(r.Frequency)
	if freq == "" {
		freq = string(domain.RecurrenceWeekly)
	}
	interval := r.Interval
	if interval <= 0 {
		interval = 1
	}
	return &freq, &interval, r.Until, r.Count
}

func expandRecurrence(frequency *string, interval *int32, until *time.Time, count *int32) *domain.RecurrenceRule {
	if frequency == nil && interval == nil && until == nil && count == nil {
		return nil
	}
	r := &domain.RecurrenceRule{}
	if frequency != nil {
		r.Frequency = domain.RecurrenceFrequency(*frequency)
	}
	if interval != nil {
		r.Interval = *interval
	}
	r.Until = until
	r.Count = count
	return r
}

func mapPGError(err error) error {
	var pgErr *pgconn.PgError
	if errors.As(err, &pgErr) {
		switch pgErr.Code {
		case "23P01":
			return domain.ErrAppointmentConflict
		case "23514":
			if strings.Contains(pgErr.ConstraintName, "valid_time_range") {
				return domain.ErrInvalidTimeRange
			}
		}
	}
	return err
}

func nullIfEmpty(v string) *string {
	if strings.TrimSpace(v) == "" {
		return nil
	}
	return &v
}

// EventRepository provides access to appointment event streams
type EventRepository interface {
	GetEventsSince(ctx context.Context, userID string, sinceID int64, limit int) ([]domain.AppointmentEvent, error)
}

type eventRepository struct {
	pool *pgxpool.Pool
}

func NewEventRepository(pool *pgxpool.Pool) EventRepository {
	return &eventRepository{pool: pool}
}

func (r *eventRepository) GetEventsSince(ctx context.Context, userID string, sinceID int64, limit int) ([]domain.AppointmentEvent, error) {
	if limit <= 0 {
		limit = 50
	}

	const q = `
		SELECT id, appointment_id, user_id, event_type, event_data, created_at
		FROM appointment_events
		WHERE user_id = $1 AND id > $2
		ORDER BY id ASC
		LIMIT $3
	`

	rows, err := r.pool.Query(ctx, q, userID, sinceID, limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	events := make([]domain.AppointmentEvent, 0)
	for rows.Next() {
		var evt domain.AppointmentEvent
		if err := rows.Scan(&evt.ID, &evt.AppointmentID, &evt.UserID, &evt.EventType, &evt.EventData, &evt.CreatedAt); err != nil {
			return nil, err
		}
		events = append(events, evt)
	}
	if err = rows.Err(); err != nil {
		return nil, err
	}

	return events, nil
}
