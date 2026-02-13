package grpc

import (
	"context"
	"errors"

	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
	"google.golang.org/protobuf/types/known/timestamppb"

	"schedule-management-system/server/internal/domain"
	"schedule-management-system/server/internal/service"
	pb "schedule-management-system/server/proto/appointment/v1"
)

// AppointmentHandler implements the AppointmentService gRPC service
type AppointmentHandler struct {
	pb.UnimplementedAppointmentServiceServer
	service *service.AppointmentService
}

// NewAppointmentHandler creates a new appointment handler
func NewAppointmentHandler(svc *service.AppointmentService) *AppointmentHandler {
	return &AppointmentHandler{
		service: svc,
	}
}

// CreateAppointment creates a new appointment
func (h *AppointmentHandler) CreateAppointment(ctx context.Context, req *pb.CreateAppointmentRequest) (*pb.CreateAppointmentResponse, error) {
	// Convert protobuf to domain model
	appt := domain.Appointment{
		UserID:      req.UserId,
		Title:       req.Title,
		Description: req.Description,
		StartTime:   req.StartTime.AsTime(),
		EndTime:     req.EndTime.AsTime(),
		Location:    req.Location,
		Attendees:   req.Attendees,
		Status:      domain.StatusScheduled,
	}

	// Handle recurrence if provided
	if req.Recurrence != nil {
		appt.Recurrence = protoToRecurrence(req.Recurrence)
	}

	// Create appointment
	created, conflicts, err := h.service.CreateAppointment(ctx, appt)
	if err != nil {
		if errors.Is(err, domain.ErrAppointmentConflict) {
			return &pb.CreateAppointmentResponse{
				Appointment: nil,
				Conflicts:   conflictsToProto(conflicts),
			}, status.Error(codes.AlreadyExists, "appointment conflicts with existing booking")
		}
		if errors.Is(err, domain.ErrInvalidTimeRange) {
			return nil, status.Error(codes.InvalidArgument, "end_time must be after start_time")
		}
		return nil, status.Error(codes.Internal, "failed to create appointment")
	}

	return &pb.CreateAppointmentResponse{
		Appointment: domainToProto(created),
		Conflicts:   conflictsToProto(conflicts),
	}, nil
}

// GetAppointment retrieves an appointment by ID
func (h *AppointmentHandler) GetAppointment(ctx context.Context, req *pb.GetAppointmentRequest) (*pb.GetAppointmentResponse, error) {
	appt, err := h.service.GetAppointment(ctx, req.Id)
	if err != nil {
		if errors.Is(err, domain.ErrAppointmentNotFound) {
			return nil, status.Error(codes.NotFound, "appointment not found")
		}
		return nil, status.Error(codes.Internal, "failed to get appointment")
	}

	return &pb.GetAppointmentResponse{
		Appointment: domainToProto(appt),
	}, nil
}

// ListAppointments lists appointments for a user
func (h *AppointmentHandler) ListAppointments(ctx context.Context, req *pb.ListAppointmentsRequest) (*pb.ListAppointmentsResponse, error) {
	filter := domain.AppointmentFilter{
		Limit:  req.Limit,
		Offset: req.Offset,
	}

	// Add time range filters
	if req.From != nil {
		t := req.From.AsTime()
		filter.From = &t
	}
	if req.To != nil {
		t := req.To.AsTime()
		filter.To = &t
	}

	// Add status filter
	if req.Status != pb.AppointmentStatus_APPOINTMENT_STATUS_UNSPECIFIED {
		s := protoToStatus(req.Status)
		filter.Status = &s
	}

	appointments, err := h.service.ListAppointments(ctx, req.UserId, filter)
	if err != nil {
		return nil, status.Error(codes.Internal, "failed to list appointments")
	}

	// Convert to protobuf
	protoAppts := make([]*pb.Appointment, len(appointments))
	for i, appt := range appointments {
		protoAppts[i] = domainToProto(appt)
	}

	return &pb.ListAppointmentsResponse{
		Appointments: protoAppts,
	}, nil
}

// UpdateAppointment updates an existing appointment
func (h *AppointmentHandler) UpdateAppointment(ctx context.Context, req *pb.UpdateAppointmentRequest) (*pb.UpdateAppointmentResponse, error) {
	// Convert protobuf to domain
	appt := protoToDomain(req.Appointment)

	updated, conflicts, err := h.service.UpdateAppointment(ctx, appt)
	if err != nil {
		if errors.Is(err, domain.ErrAppointmentNotFound) {
			return nil, status.Error(codes.NotFound, "appointment not found")
		}
		if errors.Is(err, domain.ErrVersionConflict) {
			return nil, status.Error(codes.Aborted, "appointment was modified by another process, please retry")
		}
		if errors.Is(err, domain.ErrAppointmentConflict) {
			return &pb.UpdateAppointmentResponse{
				Appointment: nil,
				Conflicts:   conflictsToProto(conflicts),
			}, status.Error(codes.AlreadyExists, "appointment conflicts with existing booking")
		}
		if errors.Is(err, domain.ErrInvalidTimeRange) {
			return nil, status.Error(codes.InvalidArgument, "end_time must be after start_time")
		}
		return nil, status.Error(codes.Internal, "failed to update appointment")
	}

	return &pb.UpdateAppointmentResponse{
		Appointment: domainToProto(updated),
		Conflicts:   conflictsToProto(conflicts),
	}, nil
}

// DeleteAppointment deletes an appointment
func (h *AppointmentHandler) DeleteAppointment(ctx context.Context, req *pb.DeleteAppointmentRequest) (*pb.DeleteAppointmentResponse, error) {
	err := h.service.DeleteAppointment(ctx, req.Id)
	if err != nil {
		if errors.Is(err, domain.ErrAppointmentNotFound) {
			return nil, status.Error(codes.NotFound, "appointment not found")
		}
		return nil, status.Error(codes.Internal, "failed to delete appointment")
	}

	return &pb.DeleteAppointmentResponse{}, nil
}

// CheckConflicts checks for scheduling conflicts
func (h *AppointmentHandler) CheckConflicts(ctx context.Context, req *pb.CheckConflictsRequest) (*pb.CheckConflictsResponse, error) {
	var excludeID *string
	if req.ExcludeId != "" {
		excludeID = &req.ExcludeId
	}

	conflicts, err := h.service.CheckConflicts(
		ctx,
		req.UserId,
		req.StartTime.AsTime(),
		req.EndTime.AsTime(),
		excludeID,
	)
	if err != nil {
		if errors.Is(err, domain.ErrInvalidTimeRange) {
			return nil, status.Error(codes.InvalidArgument, "end_time must be after start_time")
		}
		return nil, status.Error(codes.Internal, "failed to check conflicts")
	}

	return &pb.CheckConflictsResponse{
		Conflicts: conflictsToProto(conflicts),
	}, nil
}

// StreamAppointments streams appointment updates (stub for now)
func (h *AppointmentHandler) StreamAppointments(req *pb.StreamAppointmentsRequest, stream pb.AppointmentService_StreamAppointmentsServer) error {
	// This would be implemented with database event polling or Redis pub/sub
	// For now, return unimplemented
	return status.Error(codes.Unimplemented, "streaming not yet implemented")
}

// Helper functions for converting between domain and protobuf models

func domainToProto(appt domain.Appointment) *pb.Appointment {
	proto := &pb.Appointment{
		Id:          appt.ID,
		UserId:      appt.UserID,
		Title:       appt.Title,
		Description: appt.Description,
		StartTime:   timestamppb.New(appt.StartTime),
		EndTime:     timestamppb.New(appt.EndTime),
		Location:    appt.Location,
		Attendees:   appt.Attendees,
		Status:      statusToProto(appt.Status),
		CreatedAt:   timestamppb.New(appt.CreatedAt),
		UpdatedAt:   timestamppb.New(appt.UpdatedAt),
		Version:     appt.Version,
	}

	if appt.Recurrence != nil {
		proto.Recurrence = recurrenceToProto(appt.Recurrence)
	}

	return proto
}

func protoToDomain(proto *pb.Appointment) domain.Appointment {
	appt := domain.Appointment{
		ID:          proto.Id,
		UserID:      proto.UserId,
		Title:       proto.Title,
		Description: proto.Description,
		StartTime:   proto.StartTime.AsTime(),
		EndTime:     proto.EndTime.AsTime(),
		Location:    proto.Location,
		Attendees:   proto.Attendees,
		Status:      protoToStatus(proto.Status),
		CreatedAt:   proto.CreatedAt.AsTime(),
		UpdatedAt:   proto.UpdatedAt.AsTime(),
		Version:     proto.Version,
	}

	if proto.Recurrence != nil {
		appt.Recurrence = protoToRecurrence(proto.Recurrence)
	}

	return appt
}

func statusToProto(status domain.AppointmentStatus) pb.AppointmentStatus {
	switch status {
	case domain.StatusScheduled:
		return pb.AppointmentStatus_APPOINTMENT_STATUS_SCHEDULED
	case domain.StatusCancelled:
		return pb.AppointmentStatus_APPOINTMENT_STATUS_CANCELLED
	case domain.StatusCompleted:
		return pb.AppointmentStatus_APPOINTMENT_STATUS_COMPLETED
	default:
		return pb.AppointmentStatus_APPOINTMENT_STATUS_UNSPECIFIED
	}
}

func protoToStatus(status pb.AppointmentStatus) domain.AppointmentStatus {
	switch status {
	case pb.AppointmentStatus_APPOINTMENT_STATUS_SCHEDULED:
		return domain.StatusScheduled
	case pb.AppointmentStatus_APPOINTMENT_STATUS_CANCELLED:
		return domain.StatusCancelled
	case pb.AppointmentStatus_APPOINTMENT_STATUS_COMPLETED:
		return domain.StatusCompleted
	default:
		return domain.StatusScheduled
	}
}

func recurrenceToProto(r *domain.RecurrenceRule) *pb.RecurrenceRule {
	if r == nil {
		return nil
	}

	proto := &pb.RecurrenceRule{
		Frequency: frequencyToProto(r.Frequency),
		Interval:  r.Interval,
	}

	if r.Until != nil {
		proto.Until = timestamppb.New(*r.Until)
	}
	if r.Count != nil {
		proto.Count = *r.Count
	}

	return proto
}

func protoToRecurrence(proto *pb.RecurrenceRule) *domain.RecurrenceRule {
	if proto == nil {
		return nil
	}

	r := &domain.RecurrenceRule{
		Frequency: protoToFrequency(proto.Frequency),
		Interval:  proto.Interval,
	}

	if proto.Until != nil {
		t := proto.Until.AsTime()
		r.Until = &t
	}
	if proto.Count != 0 {
		r.Count = &proto.Count
	}

	return r
}

func frequencyToProto(freq domain.RecurrenceFrequency) pb.RecurrenceFrequency {
	switch freq {
	case domain.RecurrenceDaily:
		return pb.RecurrenceFrequency_RECURRENCE_FREQUENCY_DAILY
	case domain.RecurrenceWeekly:
		return pb.RecurrenceFrequency_RECURRENCE_FREQUENCY_WEEKLY
	case domain.RecurrenceMonthly:
		return pb.RecurrenceFrequency_RECURRENCE_FREQUENCY_MONTHLY
	default:
		return pb.RecurrenceFrequency_RECURRENCE_FREQUENCY_UNSPECIFIED
	}
}

func protoToFrequency(freq pb.RecurrenceFrequency) domain.RecurrenceFrequency {
	switch freq {
	case pb.RecurrenceFrequency_RECURRENCE_FREQUENCY_DAILY:
		return domain.RecurrenceDaily
	case pb.RecurrenceFrequency_RECURRENCE_FREQUENCY_WEEKLY:
		return domain.RecurrenceWeekly
	case pb.RecurrenceFrequency_RECURRENCE_FREQUENCY_MONTHLY:
		return domain.RecurrenceMonthly
	default:
		return domain.RecurrenceWeekly
	}
}

func conflictsToProto(conflicts []domain.Appointment) *pb.ConflictInfo {
	if len(conflicts) == 0 {
		return nil
	}

	protoConflicts := make([]*pb.Appointment, len(conflicts))
	for i, c := range conflicts {
		protoConflicts[i] = domainToProto(c)
	}

	message := "appointment conflicts with existing bookings"
	if len(conflicts) == 1 {
		message = "appointment conflicts with 1 existing booking"
	} else {
		message = "appointment conflicts with multiple existing bookings"
	}

	return &pb.ConflictInfo{
		ConflictingAppointments: protoConflicts,
		Message:                 message,
	}
}
