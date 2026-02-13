/**
 * gRPC-Web client for Appointment Service
 *
 * Uses generated protobuf stubs to communicate with the Go gRPC server
 * via Envoy proxy using proper gRPC-Web binary protocol.
 */

import { AppointmentServiceClient } from '../../generated/appointment/v1/AppointmentServiceClientPb'
import * as pb from '../../generated/appointment/v1/appointment_pb_esm'
import { Timestamp } from 'google-protobuf/google/protobuf/timestamp_pb'

// Aliases for generated protobuf types
const PbAppointment = pb.Appointment
const PbCreateAppointmentRequest = pb.CreateAppointmentRequest
const PbGetAppointmentRequest = pb.GetAppointmentRequest
const PbListAppointmentsRequest = pb.ListAppointmentsRequest
const PbUpdateAppointmentRequest = pb.UpdateAppointmentRequest
const PbDeleteAppointmentRequest = pb.DeleteAppointmentRequest
const PbCheckConflictsRequest = pb.CheckConflictsRequest
const PbStreamAppointmentsRequest = pb.StreamAppointmentsRequest
const PbRecurrenceRule = pb.RecurrenceRule
const PbAppointmentStatus = pb.AppointmentStatus
const PbRecurrenceFrequency = pb.RecurrenceFrequency
import type * as grpcWeb from 'grpc-web'

import type {
  Appointment,
  CreateAppointmentRequest,
  CreateAppointmentResponse,
  GetAppointmentResponse,
  ListAppointmentsRequest,
  ListAppointmentsResponse,
  UpdateAppointmentRequest,
  UpdateAppointmentResponse,
  CheckConflictsRequest,
  CheckConflictsResponse,
  ConflictInfo,
  RecurrenceRule,
  AppointmentEvent,
} from './types'
import { AppointmentStatus, RecurrenceFrequency, EventType } from './types'

const GRPC_WEB_URL = import.meta.env.VITE_GRPC_WEB_URL || 'http://localhost:8080'

// --- Conversion helpers ---

function dateToTimestamp(date: Date): Timestamp {
  const ts = new Timestamp()
  ts.setSeconds(Math.floor(date.getTime() / 1000))
  ts.setNanos((date.getTime() % 1000) * 1_000_000)
  return ts
}

function timestampToDate(ts: Timestamp | undefined): Date {
  if (!ts) return new Date(0)
  return new Date(ts.getSeconds() * 1000 + ts.getNanos() / 1_000_000)
}

function appStatusToPb(status: AppointmentStatus): pb.AppointmentStatus {
  switch (status) {
    case AppointmentStatus.SCHEDULED:
      return PbAppointmentStatus.APPOINTMENT_STATUS_SCHEDULED
    case AppointmentStatus.CANCELLED:
      return PbAppointmentStatus.APPOINTMENT_STATUS_CANCELLED
    case AppointmentStatus.COMPLETED:
      return PbAppointmentStatus.APPOINTMENT_STATUS_COMPLETED
    default:
      return PbAppointmentStatus.APPOINTMENT_STATUS_UNSPECIFIED
  }
}

function pbStatusToApp(status: pb.AppointmentStatus): AppointmentStatus {
  switch (status) {
    case PbAppointmentStatus.APPOINTMENT_STATUS_SCHEDULED:
      return AppointmentStatus.SCHEDULED
    case PbAppointmentStatus.APPOINTMENT_STATUS_CANCELLED:
      return AppointmentStatus.CANCELLED
    case PbAppointmentStatus.APPOINTMENT_STATUS_COMPLETED:
      return AppointmentStatus.COMPLETED
    default:
      return AppointmentStatus.UNSPECIFIED
  }
}

function appFreqToPb(freq: RecurrenceFrequency): pb.RecurrenceFrequency {
  switch (freq) {
    case RecurrenceFrequency.DAILY:
      return PbRecurrenceFrequency.RECURRENCE_FREQUENCY_DAILY
    case RecurrenceFrequency.WEEKLY:
      return PbRecurrenceFrequency.RECURRENCE_FREQUENCY_WEEKLY
    case RecurrenceFrequency.MONTHLY:
      return PbRecurrenceFrequency.RECURRENCE_FREQUENCY_MONTHLY
    default:
      return PbRecurrenceFrequency.RECURRENCE_FREQUENCY_UNSPECIFIED
  }
}

function pbFreqToApp(freq: pb.RecurrenceFrequency): RecurrenceFrequency {
  switch (freq) {
    case PbRecurrenceFrequency.RECURRENCE_FREQUENCY_DAILY:
      return RecurrenceFrequency.DAILY
    case PbRecurrenceFrequency.RECURRENCE_FREQUENCY_WEEKLY:
      return RecurrenceFrequency.WEEKLY
    case PbRecurrenceFrequency.RECURRENCE_FREQUENCY_MONTHLY:
      return RecurrenceFrequency.MONTHLY
    default:
      return RecurrenceFrequency.UNSPECIFIED
  }
}

function recurrenceToPb(r: RecurrenceRule): pb.RecurrenceRule {
  const pb = new PbRecurrenceRule()
  pb.setFrequency(appFreqToPb(r.frequency))
  pb.setInterval(r.interval)
  if (r.until) pb.setUntil(dateToTimestamp(r.until))
  if (r.count !== undefined) pb.setCount(r.count)
  return pb
}

function pbRecurrenceToApp(msg: pb.RecurrenceRule | undefined): RecurrenceRule | undefined {
  if (!msg) return undefined
  const r: RecurrenceRule = {
    frequency: pbFreqToApp(msg.getFrequency()),
    interval: msg.getInterval(),
  }
  if (msg.hasUntil()) r.until = timestampToDate(msg.getUntil())
  if (msg.getCount() !== 0) r.count = msg.getCount()
  return r
}

function appointmentToPb(a: Appointment): pb.Appointment {
  const msg = new PbAppointment()
  msg.setId(a.id)
  msg.setUserId(a.userId)
  msg.setTitle(a.title)
  msg.setDescription(a.description)
  msg.setStartTime(dateToTimestamp(a.startTime))
  msg.setEndTime(dateToTimestamp(a.endTime))
  msg.setLocation(a.location)
  msg.setAttendeesList(a.attendees)
  msg.setStatus(appStatusToPb(a.status))
  msg.setCreatedAt(dateToTimestamp(a.createdAt))
  msg.setUpdatedAt(dateToTimestamp(a.updatedAt))
  msg.setVersion(a.version)
  if (a.recurrence) msg.setRecurrence(recurrenceToPb(a.recurrence))
  return msg
}

function pbAppointmentToApp(msg: pb.Appointment | undefined): Appointment {
  if (!msg) throw new Error('appointment is undefined')
  return {
    id: msg.getId(),
    userId: msg.getUserId(),
    title: msg.getTitle(),
    description: msg.getDescription(),
    startTime: timestampToDate(msg.getStartTime()),
    endTime: timestampToDate(msg.getEndTime()),
    location: msg.getLocation(),
    attendees: msg.getAttendeesList(),
    status: pbStatusToApp(msg.getStatus()),
    recurrence: pbRecurrenceToApp(msg.getRecurrence()),
    createdAt: timestampToDate(msg.getCreatedAt()),
    updatedAt: timestampToDate(msg.getUpdatedAt()),
    version: msg.getVersion(),
  }
}

function pbConflictInfoToApp(msg: pb.ConflictInfo | undefined): ConflictInfo | undefined {
  if (!msg) return undefined
  return {
    conflictingAppointments: msg.getConflictingAppointmentsList().map(a => pbAppointmentToApp(a)),
    message: msg.getMessage(),
  }
}

// --- Client class ---

export class AppointmentClient {
  private client: AppointmentServiceClient

  constructor(baseUrl: string = GRPC_WEB_URL) {
    this.client = new AppointmentServiceClient(baseUrl)
  }

  async createAppointment(request: CreateAppointmentRequest): Promise<CreateAppointmentResponse> {
    const req = new PbCreateAppointmentRequest()
    req.setUserId(request.userId)
    req.setTitle(request.title)
    req.setDescription(request.description)
    req.setStartTime(dateToTimestamp(request.startTime))
    req.setEndTime(dateToTimestamp(request.endTime))
    req.setLocation(request.location)
    req.setAttendeesList(request.attendees)
    if (request.recurrence) req.setRecurrence(recurrenceToPb(request.recurrence))

    const response = await this.client.createAppointment(req, null)
    return {
      appointment: response.hasAppointment() ? pbAppointmentToApp(response.getAppointment()) : undefined,
      conflicts: pbConflictInfoToApp(response.getConflicts()),
    }
  }

  async getAppointment(request: { id: string }): Promise<GetAppointmentResponse> {
    const req = new PbGetAppointmentRequest()
    req.setId(request.id)

    const response = await this.client.getAppointment(req, null)
    return {
      appointment: pbAppointmentToApp(response.getAppointment()),
    }
  }

  async listAppointments(request: ListAppointmentsRequest): Promise<ListAppointmentsResponse> {
    const req = new PbListAppointmentsRequest()
    req.setUserId(request.userId)
    if (request.from) req.setFrom(dateToTimestamp(request.from))
    if (request.to) req.setTo(dateToTimestamp(request.to))
    if (request.status !== undefined) req.setStatus(appStatusToPb(request.status))
    if (request.limit !== undefined) req.setLimit(request.limit)
    if (request.offset !== undefined) req.setOffset(request.offset)

    const response = await this.client.listAppointments(req, null)
    return {
      appointments: response.getAppointmentsList().map(a => pbAppointmentToApp(a)),
    }
  }

  async updateAppointment(request: UpdateAppointmentRequest): Promise<UpdateAppointmentResponse> {
    const req = new PbUpdateAppointmentRequest()
    req.setAppointment(appointmentToPb(request.appointment))

    const response = await this.client.updateAppointment(req, null)
    return {
      appointment: pbAppointmentToApp(response.getAppointment()),
      conflicts: pbConflictInfoToApp(response.getConflicts()),
    }
  }

  async deleteAppointment(request: { id: string }): Promise<void> {
    const req = new PbDeleteAppointmentRequest()
    req.setId(request.id)

    await this.client.deleteAppointment(req, null)
  }

  async checkConflicts(request: CheckConflictsRequest): Promise<CheckConflictsResponse> {
    const req = new PbCheckConflictsRequest()
    req.setUserId(request.userId)
    req.setStartTime(dateToTimestamp(request.startTime))
    req.setEndTime(dateToTimestamp(request.endTime))
    if (request.excludeId) req.setExcludeId(request.excludeId)

    const response = await this.client.checkConflicts(req, null)
    return {
      conflicts: pbConflictInfoToApp(response.getConflicts()),
    }
  }

  streamAppointments(
    userId: string,
    onEvent: (event: AppointmentEvent) => void,
    onError?: (err: grpcWeb.RpcError) => void,
    onEnd?: () => void,
  ): { cancel: () => void } {
    const req = new PbStreamAppointmentsRequest()
    req.setUserId(userId)

    const stream = this.client.streamAppointments(req)

    stream.on('data', (pbEvent) => {
      try {
        const eventTypeMap: Record<number, EventType> = {
          [0]: EventType.UNSPECIFIED,
          [1]: EventType.CREATED,
          [2]: EventType.UPDATED,
          [3]: EventType.DELETED,
        }

        onEvent({
          type: eventTypeMap[pbEvent.getType()] ?? EventType.UNSPECIFIED,
          appointment: pbAppointmentToApp(pbEvent.getAppointment()),
        })
      } catch (err) {
        console.error('[gRPC-Web] error processing stream event:', err)
      }
    })

    stream.on('error', (err) => {
      if (onError) onError(err)
    })

    stream.on('end', () => {
      if (onEnd) onEnd()
    })

    return {
      cancel: () => stream.cancel(),
    }
  }
}

// Export singleton instance
export const appointmentClient = new AppointmentClient()
