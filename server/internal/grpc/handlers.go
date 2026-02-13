package grpc

import (
	"context"
	"errors"
	"fmt"

	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
	"google.golang.org/protobuf/types/known/timestamppb"

	appointmentv1 "schedule-management-system/server/gen/appointment/v1"
	"schedule-management-system/server/internal/domain"
	"schedule-management-system/server/internal/service"
)

type appointmentHandler struct {
	appointmentv1.UnimplementedAppointmentServiceServer
	svc service.AppointmentService
}

func NewAppointmentHandler(svc service.AppointmentService) appointmentv1.AppointmentServiceServer {
	return &appointmentHandler{svc: svc}
}

func (h *appointmentHandler) CreateAppointment(ctx context.Context, req *appointmentv1.CreateAppointmentRequest) (*appointmentv1.CreateAppointmentResponse, error) {
	appt, err := mapCreateRequest(req)
	if err != nil {
		return nil, status.Errorf(codes.InvalidArgument, "invalid create request: %v", err)
	}

	created, conflicts, err := h.svc.CreateAppointment(ctx, appt)
	if err != nil {
		return nil, toStatusError(err)
	}

	resp := &appointmentv1.CreateAppointmentResponse{}
	if len(conflicts) > 0 {
		resp.Conflicts = mapConflicts(conflicts)
		return resp, nil
	}

	resp.Appointment = mapAppointment(created)
	return resp, nil
}

func (h *appointmentHandler) GetAppointment(ctx context.Context, req *appointmentv1.GetAppointmentRequest) (*appointmentv1.GetAppointmentResponse, error) {
	if req.GetId() == "" {
		return nil, status.Error(codes.InvalidArgument, "id is required")
	}

	appt, err := h.svc.GetAppointment(ctx, req.GetId())
	if err != nil {
		return nil, toStatusError(err)
	}

	return &appointmentv1.GetAppointmentResponse{Appointment: mapAppointment(appt)}, nil
}

func (h *appointmentHandler) ListAppointments(ctx context.Context, req *appointmentv1.ListAppointmentsRequest) (*appointmentv1.ListAppointmentsResponse, error) {
	if req.GetUserId() == "" {
		return nil, status.Error(codes.InvalidArgument, "user_id is required")
	}

	filter := domain.AppointmentFilter{
		Limit:  req.GetLimit(),
		Offset: req.GetOffset(),
	}
	if req.GetFrom() != nil {
		from := req.GetFrom().AsTime()
		filter.From = &from
	}
	if req.GetTo() != nil {
		to := req.GetTo().AsTime()
		filter.To = &to
	}
	if req.GetStatus() != appointmentv1.AppointmentStatus_APPOINTMENT_STATUS_UNSPECIFIED {
		st := statusProtoToDomain(req.GetStatus())
		filter.Status = &st
	}

	items, err := h.svc.ListAppointments(ctx, req.GetUserId(), filter)
	if err != nil {
		return nil, toStatusError(err)
	}

	resp := &appointmentv1.ListAppointmentsResponse{
		Appointments: make([]*appointmentv1.Appointment, 0, len(items)),
	}
	for _, item := range items {
		resp.Appointments = append(resp.Appointments, mapAppointment(item))
	}
	return resp, nil
}

func (h *appointmentHandler) UpdateAppointment(ctx context.Context, req *appointmentv1.UpdateAppointmentRequest) (*appointmentv1.UpdateAppointmentResponse, error) {
	if req.GetAppointment() == nil {
		return nil, status.Error(codes.InvalidArgument, "appointment is required")
	}

	appt, err := mapAppointmentProto(req.GetAppointment())
	if err != nil {
		return nil, status.Errorf(codes.InvalidArgument, "invalid appointment: %v", err)
	}
	if appt.ID == "" {
		return nil, status.Error(codes.InvalidArgument, "appointment.id is required")
	}
	if appt.UserID == "" {
		return nil, status.Error(codes.InvalidArgument, "appointment.user_id is required")
	}

	updated, conflicts, err := h.svc.UpdateAppointment(ctx, appt)
	if err != nil {
		return nil, toStatusError(err)
	}

	resp := &appointmentv1.UpdateAppointmentResponse{}
	if len(conflicts) > 0 {
		resp.Conflicts = mapConflicts(conflicts)
		return resp, nil
	}
	resp.Appointment = mapAppointment(updated)
	return resp, nil
}

func (h *appointmentHandler) DeleteAppointment(ctx context.Context, req *appointmentv1.DeleteAppointmentRequest) (*appointmentv1.DeleteAppointmentResponse, error) {
	if req.GetId() == "" {
		return nil, status.Error(codes.InvalidArgument, "id is required")
	}

	if err := h.svc.DeleteAppointment(ctx, req.GetId()); err != nil {
		return nil, toStatusError(err)
	}

	return &appointmentv1.DeleteAppointmentResponse{}, nil
}

func (h *appointmentHandler) CheckConflicts(ctx context.Context, req *appointmentv1.CheckConflictsRequest) (*appointmentv1.CheckConflictsResponse, error) {
	if req.GetUserId() == "" {
		return nil, status.Error(codes.InvalidArgument, "user_id is required")
	}
	if req.GetStartTime() == nil || req.GetEndTime() == nil {
		return nil, status.Error(codes.InvalidArgument, "start_time and end_time are required")
	}

	start := req.GetStartTime().AsTime()
	end := req.GetEndTime().AsTime()
	if !end.After(start) {
		return nil, status.Error(codes.InvalidArgument, "end_time must be after start_time")
	}

	var excludeID *string
	if req.GetExcludeId() != "" {
		id := req.GetExcludeId()
		excludeID = &id
	}

	conflicts, err := h.svc.CheckConflicts(ctx, req.GetUserId(), start, end, excludeID)
	if err != nil {
		return nil, toStatusError(err)
	}
	if len(conflicts) == 0 {
		return &appointmentv1.CheckConflictsResponse{}, nil
	}

	return &appointmentv1.CheckConflictsResponse{Conflicts: mapConflicts(conflicts)}, nil
}

func (h *appointmentHandler) StreamAppointments(_ *appointmentv1.StreamAppointmentsRequest, stream appointmentv1.AppointmentService_StreamAppointmentsServer) error {
	return status.Error(codes.Unimplemented, "streaming is not enabled")
}

func mapCreateRequest(req *appointmentv1.CreateAppointmentRequest) (domain.Appointment, error) {
	if req.GetUserId() == "" {
		return domain.Appointment{}, errors.New("user_id is required")
	}
	if req.GetTitle() == "" {
		return domain.Appointment{}, errors.New("title is required")
	}
	if req.GetStartTime() == nil || req.GetEndTime() == nil {
		return domain.Appointment{}, errors.New("start_time and end_time are required")
	}

	start := req.GetStartTime().AsTime()
	end := req.GetEndTime().AsTime()

	appt := domain.Appointment{
		UserID:      req.GetUserId(),
		Title:       req.GetTitle(),
		Description: req.GetDescription(),
		StartTime:   start,
		EndTime:     end,
		Location:    req.GetLocation(),
		Attendees:   req.GetAttendees(),
		Status:      domain.StatusScheduled,
		Recurrence:  mapRecurrenceProto(req.GetRecurrence()),
	}
	return appt, nil
}

func mapAppointmentProto(msg *appointmentv1.Appointment) (domain.Appointment, error) {
	if msg == nil {
		return domain.Appointment{}, errors.New("appointment is nil")
	}
	if msg.GetStartTime() == nil || msg.GetEndTime() == nil {
		return domain.Appointment{}, errors.New("start_time and end_time are required")
	}

	return domain.Appointment{
		ID:          msg.GetId(),
		UserID:      msg.GetUserId(),
		Title:       msg.GetTitle(),
		Description: msg.GetDescription(),
		StartTime:   msg.GetStartTime().AsTime(),
		EndTime:     msg.GetEndTime().AsTime(),
		Location:    msg.GetLocation(),
		Attendees:   msg.GetAttendees(),
		Status:      statusProtoToDomain(msg.GetStatus()),
		Recurrence:  mapRecurrenceProto(msg.GetRecurrence()),
		Version:     msg.GetVersion(),
	}, nil
}

func mapAppointment(appt domain.Appointment) *appointmentv1.Appointment {
	out := &appointmentv1.Appointment{
		Id:          appt.ID,
		UserId:      appt.UserID,
		Title:       appt.Title,
		Description: appt.Description,
		StartTime:   timestamppb.New(appt.StartTime),
		EndTime:     timestamppb.New(appt.EndTime),
		Location:    appt.Location,
		Attendees:   appt.Attendees,
		Status:      statusDomainToProto(appt.Status),
		Version:     appt.Version,
	}
	if !appt.CreatedAt.IsZero() {
		out.CreatedAt = timestamppb.New(appt.CreatedAt)
	}
	if !appt.UpdatedAt.IsZero() {
		out.UpdatedAt = timestamppb.New(appt.UpdatedAt)
	}
	if appt.Recurrence != nil {
		out.Recurrence = mapRecurrence(appt.Recurrence)
	}
	return out
}

func mapRecurrence(r *domain.RecurrenceRule) *appointmentv1.RecurrenceRule {
	if r == nil {
		return nil
	}
	out := &appointmentv1.RecurrenceRule{
		Frequency: recurrenceDomainToProto(r.Frequency),
		Interval:  r.Interval,
	}
	if r.Until != nil {
		out.Until = timestamppb.New(*r.Until)
	}
	if r.Count != nil {
		out.Count = *r.Count
	}
	return out
}

func mapRecurrenceProto(r *appointmentv1.RecurrenceRule) *domain.RecurrenceRule {
	if r == nil {
		return nil
	}
	out := &domain.RecurrenceRule{
		Frequency: recurrenceProtoToDomain(r.GetFrequency()),
		Interval:  r.GetInterval(),
	}
	if r.GetUntil() != nil {
		t := r.GetUntil().AsTime()
		out.Until = &t
	}
	if r.GetCount() > 0 {
		count := r.GetCount()
		out.Count = &count
	}
	return out
}

func mapConflicts(conflicts []domain.Appointment) *appointmentv1.ConflictInfo {
	out := &appointmentv1.ConflictInfo{
		ConflictingAppointments: make([]*appointmentv1.Appointment, 0, len(conflicts)),
		Message:                 fmt.Sprintf("%d conflicting appointment(s) found", len(conflicts)),
	}
	for _, c := range conflicts {
		out.ConflictingAppointments = append(out.ConflictingAppointments, mapAppointment(c))
	}
	return out
}

func statusDomainToProto(v domain.AppointmentStatus) appointmentv1.AppointmentStatus {
	switch v {
	case domain.StatusCancelled:
		return appointmentv1.AppointmentStatus_APPOINTMENT_STATUS_CANCELLED
	case domain.StatusCompleted:
		return appointmentv1.AppointmentStatus_APPOINTMENT_STATUS_COMPLETED
	default:
		return appointmentv1.AppointmentStatus_APPOINTMENT_STATUS_SCHEDULED
	}
}

func statusProtoToDomain(v appointmentv1.AppointmentStatus) domain.AppointmentStatus {
	switch v {
	case appointmentv1.AppointmentStatus_APPOINTMENT_STATUS_CANCELLED:
		return domain.StatusCancelled
	case appointmentv1.AppointmentStatus_APPOINTMENT_STATUS_COMPLETED:
		return domain.StatusCompleted
	default:
		return domain.StatusScheduled
	}
}

func recurrenceDomainToProto(v domain.RecurrenceFrequency) appointmentv1.RecurrenceFrequency {
	switch v {
	case domain.RecurrenceDaily:
		return appointmentv1.RecurrenceFrequency_RECURRENCE_FREQUENCY_DAILY
	case domain.RecurrenceMonthly:
		return appointmentv1.RecurrenceFrequency_RECURRENCE_FREQUENCY_MONTHLY
	default:
		return appointmentv1.RecurrenceFrequency_RECURRENCE_FREQUENCY_WEEKLY
	}
}

func recurrenceProtoToDomain(v appointmentv1.RecurrenceFrequency) domain.RecurrenceFrequency {
	switch v {
	case appointmentv1.RecurrenceFrequency_RECURRENCE_FREQUENCY_DAILY:
		return domain.RecurrenceDaily
	case appointmentv1.RecurrenceFrequency_RECURRENCE_FREQUENCY_MONTHLY:
		return domain.RecurrenceMonthly
	default:
		return domain.RecurrenceWeekly
	}
}

func toStatusError(err error) error {
	if err == nil {
		return nil
	}
	switch {
	case errors.Is(err, domain.ErrAppointmentNotFound):
		return status.Error(codes.NotFound, err.Error())
	case errors.Is(err, domain.ErrInvalidTimeRange):
		return status.Error(codes.InvalidArgument, err.Error())
	case errors.Is(err, domain.ErrVersionConflict):
		return status.Error(codes.Aborted, err.Error())
	case errors.Is(err, domain.ErrAppointmentConflict):
		return status.Error(codes.AlreadyExists, err.Error())
	case errors.Is(err, context.Canceled):
		return status.Error(codes.Canceled, err.Error())
	case errors.Is(err, context.DeadlineExceeded):
		return status.Error(codes.DeadlineExceeded, err.Error())
	default:
		return status.Error(codes.Internal, err.Error())
	}
}
