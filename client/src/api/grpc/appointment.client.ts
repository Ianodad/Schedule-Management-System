import { StatusCode, type RpcError } from 'grpc-web';
import { Timestamp } from 'google-protobuf/google/protobuf/timestamp_pb';
import { getGrpcConfig } from './client';
import { AppointmentServiceClient } from '@/api/generated/appointment/v1/AppointmentServiceClientPb';
import * as appointmentPb from '@/api/generated/appointment/v1/appointment_pb';
import type {
  Appointment,
  AppointmentEvent,
  CheckConflictsRequest,
  CheckConflictsResponse,
  ConflictInfo,
  CreateAppointmentRequest,
  CreateAppointmentResponse,
  DeleteAppointmentRequest,
  DeleteAppointmentResponse,
  GetAppointmentRequest,
  GetAppointmentResponse,
  ListAppointmentsRequest,
  ListAppointmentsResponse,
  RecurrenceRule,
  StreamAppointmentsRequest,
  UpdateAppointmentRequest,
  UpdateAppointmentResponse,
} from '@/types/appointment';

type PbAppointment = appointmentPb.Appointment;
type PbAppointmentEvent = appointmentPb.AppointmentEvent;
type PbRecurrenceRule = appointmentPb.RecurrenceRule;
type PbConflictInfo = appointmentPb.ConflictInfo;

const PbAppointment = appointmentPb.Appointment;
const PbAppointmentEvent = appointmentPb.AppointmentEvent;
const PbAppointmentStatus = appointmentPb.AppointmentStatus;
const PbRecurrenceFrequency = appointmentPb.RecurrenceFrequency;
const PbRecurrenceRule = appointmentPb.RecurrenceRule;
const PbConflictInfo = appointmentPb.ConflictInfo;
const PbCreateAppointmentRequest = appointmentPb.CreateAppointmentRequest;
const PbGetAppointmentRequest = appointmentPb.GetAppointmentRequest;
const PbListAppointmentsRequest = appointmentPb.ListAppointmentsRequest;
const PbUpdateAppointmentRequest = appointmentPb.UpdateAppointmentRequest;
const PbDeleteAppointmentRequest = appointmentPb.DeleteAppointmentRequest;
const PbCheckConflictsRequest = appointmentPb.CheckConflictsRequest;
const PbStreamAppointmentsRequest = appointmentPb.StreamAppointmentsRequest;

class GrpcError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: unknown
  ) {
    super(message);
    this.name = 'GrpcError';
  }
}

function getClient(): AppointmentServiceClient {
  return new AppointmentServiceClient(getGrpcConfig().baseUrl);
}

function toTimestamp(iso?: string): Timestamp | undefined {
  if (!iso) return undefined;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return undefined;
  const ts = new Timestamp();
  ts.fromDate(date);
  return ts;
}

function fromTimestamp(ts?: Timestamp): string {
  if (!ts) return '';
  return ts.toDate().toISOString();
}

function recurrenceToProto(r?: RecurrenceRule): PbRecurrenceRule | undefined {
  if (!r) return undefined;
  const out = new PbRecurrenceRule();
  out.setFrequency(r.frequency as unknown as PbRecurrenceFrequency);
  out.setInterval(r.interval);
  if (r.count !== undefined) out.setCount(r.count);
  const until = toTimestamp(r.until);
  if (until) out.setUntil(until);
  return out;
}

function recurrenceFromProto(r?: PbRecurrenceRule): RecurrenceRule | undefined {
  if (!r) return undefined;
  return {
    frequency: r.getFrequency() as unknown as RecurrenceRule['frequency'],
    interval: r.getInterval(),
    count: r.getCount() || undefined,
    until: r.getUntil() ? fromTimestamp(r.getUntil()) : undefined,
  };
}

function appointmentFromProto(appt?: PbAppointment): Appointment {
  return {
    id: appt?.getId() ?? '',
    userId: appt?.getUserId() ?? '',
    title: appt?.getTitle() ?? '',
    description: appt?.getDescription() || undefined,
    startTime: fromTimestamp(appt?.getStartTime()),
    endTime: fromTimestamp(appt?.getEndTime()),
    location: appt?.getLocation() || undefined,
    attendees: appt?.getAttendeesList() ?? [],
    status: (appt?.getStatus() ?? PbAppointmentStatus.APPOINTMENT_STATUS_UNSPECIFIED) as unknown as Appointment['status'],
    recurrence: recurrenceFromProto(appt?.getRecurrence()),
    createdAt: appt?.getCreatedAt() ? fromTimestamp(appt.getCreatedAt()) : undefined,
    updatedAt: appt?.getUpdatedAt() ? fromTimestamp(appt.getUpdatedAt()) : undefined,
    version: appt?.getVersion() ?? 0,
  };
}

function appointmentToProto(appt: Appointment): PbAppointment {
  const out = new PbAppointment();
  out.setId(appt.id);
  out.setUserId(appt.userId);
  out.setTitle(appt.title);
  out.setDescription(appt.description ?? '');
  const start = toTimestamp(appt.startTime);
  if (start) out.setStartTime(start);
  const end = toTimestamp(appt.endTime);
  if (end) out.setEndTime(end);
  out.setLocation(appt.location ?? '');
  out.setAttendeesList(appt.attendees ?? []);
  out.setStatus(appt.status as unknown as PbAppointmentStatus);
  out.setVersion(appt.version);
  const recurrence = recurrenceToProto(appt.recurrence);
  if (recurrence) out.setRecurrence(recurrence);
  return out;
}

function conflictsFromProto(conflicts?: PbConflictInfo): ConflictInfo | undefined {
  if (!conflicts) return undefined;
  return {
    conflictingAppointments: conflicts.getConflictingAppointmentsList().map((item) => appointmentFromProto(item)),
    message: conflicts.getMessage(),
  };
}

function grpcErrorFrom(error: unknown): GrpcError {
  if (error instanceof GrpcError) {
    return error;
  }
  const rpcError = error as Partial<RpcError> | undefined;
  const code = typeof rpcError?.code === 'number' ? StatusCode[rpcError.code] ?? 'UNKNOWN' : 'UNKNOWN';
  const message = rpcError?.message || 'gRPC request failed';
  return new GrpcError(message, code, rpcError?.metadata);
}

export async function createAppointment(request: CreateAppointmentRequest): Promise<CreateAppointmentResponse> {
  const pbReq = new PbCreateAppointmentRequest();
  pbReq.setUserId(request.userId);
  pbReq.setTitle(request.title);
  pbReq.setDescription(request.description ?? '');
  const start = toTimestamp(request.startTime);
  const end = toTimestamp(request.endTime);
  if (start) pbReq.setStartTime(start);
  if (end) pbReq.setEndTime(end);
  pbReq.setLocation(request.location ?? '');
  pbReq.setAttendeesList(request.attendees ?? []);
  const recurrence = recurrenceToProto(request.recurrence);
  if (recurrence) pbReq.setRecurrence(recurrence);

  try {
    const resp = await getClient().createAppointment(pbReq);
    const appt = resp.getAppointment();
    return {
      appointment: appointmentFromProto(appt) as CreateAppointmentResponse['appointment'],
      conflicts: conflictsFromProto(resp.getConflicts()),
    };
  } catch (error) {
    throw grpcErrorFrom(error);
  }
}

export async function getAppointment(request: GetAppointmentRequest): Promise<GetAppointmentResponse> {
  const pbReq = new PbGetAppointmentRequest();
  pbReq.setId(request.id);
  try {
    const resp = await getClient().getAppointment(pbReq);
    return { appointment: appointmentFromProto(resp.getAppointment()) };
  } catch (error) {
    throw grpcErrorFrom(error);
  }
}

export async function listAppointments(request: ListAppointmentsRequest): Promise<ListAppointmentsResponse> {
  const pbReq = new PbListAppointmentsRequest();
  pbReq.setUserId(request.userId);
  const from = toTimestamp(request.from);
  const to = toTimestamp(request.to);
  if (from) pbReq.setFrom(from);
  if (to) pbReq.setTo(to);
  if (request.status !== undefined) pbReq.setStatus(request.status as unknown as PbAppointmentStatus);
  if (request.limit !== undefined) pbReq.setLimit(request.limit);
  if (request.offset !== undefined) pbReq.setOffset(request.offset);

  try {
    const resp = await getClient().listAppointments(pbReq);
    return { appointments: resp.getAppointmentsList().map((appt) => appointmentFromProto(appt)) };
  } catch (error) {
    throw grpcErrorFrom(error);
  }
}

export async function updateAppointment(request: UpdateAppointmentRequest): Promise<UpdateAppointmentResponse> {
  const pbReq = new PbUpdateAppointmentRequest();
  pbReq.setAppointment(appointmentToProto(request.appointment));
  try {
    const resp = await getClient().updateAppointment(pbReq);
    const conflicts = conflictsFromProto(resp.getConflicts());
    if (conflicts && !resp.getAppointment()) {
      throw new GrpcError(conflicts.message || 'Appointment conflicts with existing appointments', 'ALREADY_EXISTS', conflicts);
    }
    return {
      appointment: appointmentFromProto(resp.getAppointment()),
      conflicts,
    };
  } catch (error) {
    throw grpcErrorFrom(error);
  }
}

export async function deleteAppointment(request: DeleteAppointmentRequest): Promise<DeleteAppointmentResponse> {
  const pbReq = new PbDeleteAppointmentRequest();
  pbReq.setId(request.id);
  try {
    await getClient().deleteAppointment(pbReq);
    return {};
  } catch (error) {
    throw grpcErrorFrom(error);
  }
}

export async function checkConflicts(request: CheckConflictsRequest): Promise<CheckConflictsResponse> {
  const pbReq = new PbCheckConflictsRequest();
  pbReq.setUserId(request.userId);
  const start = toTimestamp(request.startTime);
  const end = toTimestamp(request.endTime);
  if (start) pbReq.setStartTime(start);
  if (end) pbReq.setEndTime(end);
  if (request.excludeId) pbReq.setExcludeId(request.excludeId);

  try {
    const resp = await getClient().checkConflicts(pbReq);
    return { conflicts: conflictsFromProto(resp.getConflicts()) };
  } catch (error) {
    throw grpcErrorFrom(error);
  }
}

export function streamAppointments(
  request: StreamAppointmentsRequest,
  onEvent: (event: AppointmentEvent) => void,
  onError?: (error: Error) => void
): () => void {
  const pbReq = new PbStreamAppointmentsRequest();
  pbReq.setUserId(request.userId);

  const stream = getClient().streamAppointments(pbReq);
  stream.on('data', (event: PbAppointmentEvent) => {
    onEvent({
      eventType: event.getType() as unknown as AppointmentEvent['eventType'],
      appointment: appointmentFromProto(event.getAppointment()),
      timestamp: new Date().toISOString(),
    });
  });
  stream.on('error', (error: RpcError) => {
    onError?.(grpcErrorFrom(error));
  });

  return () => {
    stream.cancel();
  };
}

export { GrpcError };
