import * as jspb from 'google-protobuf'

import * as google_protobuf_timestamp_pb from 'google-protobuf/google/protobuf/timestamp_pb'; // proto import: "google/protobuf/timestamp.proto"


export class Appointment extends jspb.Message {
  getId(): string;
  setId(value: string): Appointment;

  getUserId(): string;
  setUserId(value: string): Appointment;

  getTitle(): string;
  setTitle(value: string): Appointment;

  getDescription(): string;
  setDescription(value: string): Appointment;

  getStartTime(): google_protobuf_timestamp_pb.Timestamp | undefined;
  setStartTime(value?: google_protobuf_timestamp_pb.Timestamp): Appointment;
  hasStartTime(): boolean;
  clearStartTime(): Appointment;

  getEndTime(): google_protobuf_timestamp_pb.Timestamp | undefined;
  setEndTime(value?: google_protobuf_timestamp_pb.Timestamp): Appointment;
  hasEndTime(): boolean;
  clearEndTime(): Appointment;

  getLocation(): string;
  setLocation(value: string): Appointment;

  getAttendeesList(): Array<string>;
  setAttendeesList(value: Array<string>): Appointment;
  clearAttendeesList(): Appointment;
  addAttendees(value: string, index?: number): Appointment;

  getStatus(): AppointmentStatus;
  setStatus(value: AppointmentStatus): Appointment;

  getRecurrence(): RecurrenceRule | undefined;
  setRecurrence(value?: RecurrenceRule): Appointment;
  hasRecurrence(): boolean;
  clearRecurrence(): Appointment;

  getCreatedAt(): google_protobuf_timestamp_pb.Timestamp | undefined;
  setCreatedAt(value?: google_protobuf_timestamp_pb.Timestamp): Appointment;
  hasCreatedAt(): boolean;
  clearCreatedAt(): Appointment;

  getUpdatedAt(): google_protobuf_timestamp_pb.Timestamp | undefined;
  setUpdatedAt(value?: google_protobuf_timestamp_pb.Timestamp): Appointment;
  hasUpdatedAt(): boolean;
  clearUpdatedAt(): Appointment;

  getVersion(): number;
  setVersion(value: number): Appointment;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): Appointment.AsObject;
  static toObject(includeInstance: boolean, msg: Appointment): Appointment.AsObject;
  static serializeBinaryToWriter(message: Appointment, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): Appointment;
  static deserializeBinaryFromReader(message: Appointment, reader: jspb.BinaryReader): Appointment;
}

export namespace Appointment {
  export type AsObject = {
    id: string;
    userId: string;
    title: string;
    description: string;
    startTime?: google_protobuf_timestamp_pb.Timestamp.AsObject;
    endTime?: google_protobuf_timestamp_pb.Timestamp.AsObject;
    location: string;
    attendeesList: Array<string>;
    status: AppointmentStatus;
    recurrence?: RecurrenceRule.AsObject;
    createdAt?: google_protobuf_timestamp_pb.Timestamp.AsObject;
    updatedAt?: google_protobuf_timestamp_pb.Timestamp.AsObject;
    version: number;
  };
}

export class RecurrenceRule extends jspb.Message {
  getFrequency(): RecurrenceFrequency;
  setFrequency(value: RecurrenceFrequency): RecurrenceRule;

  getInterval(): number;
  setInterval(value: number): RecurrenceRule;

  getUntil(): google_protobuf_timestamp_pb.Timestamp | undefined;
  setUntil(value?: google_protobuf_timestamp_pb.Timestamp): RecurrenceRule;
  hasUntil(): boolean;
  clearUntil(): RecurrenceRule;

  getCount(): number;
  setCount(value: number): RecurrenceRule;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): RecurrenceRule.AsObject;
  static toObject(includeInstance: boolean, msg: RecurrenceRule): RecurrenceRule.AsObject;
  static serializeBinaryToWriter(message: RecurrenceRule, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): RecurrenceRule;
  static deserializeBinaryFromReader(message: RecurrenceRule, reader: jspb.BinaryReader): RecurrenceRule;
}

export namespace RecurrenceRule {
  export type AsObject = {
    frequency: RecurrenceFrequency;
    interval: number;
    until?: google_protobuf_timestamp_pb.Timestamp.AsObject;
    count: number;
  };
}

export class ConflictInfo extends jspb.Message {
  getConflictingAppointmentsList(): Array<Appointment>;
  setConflictingAppointmentsList(value: Array<Appointment>): ConflictInfo;
  clearConflictingAppointmentsList(): ConflictInfo;
  addConflictingAppointments(value?: Appointment, index?: number): Appointment;

  getMessage(): string;
  setMessage(value: string): ConflictInfo;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): ConflictInfo.AsObject;
  static toObject(includeInstance: boolean, msg: ConflictInfo): ConflictInfo.AsObject;
  static serializeBinaryToWriter(message: ConflictInfo, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): ConflictInfo;
  static deserializeBinaryFromReader(message: ConflictInfo, reader: jspb.BinaryReader): ConflictInfo;
}

export namespace ConflictInfo {
  export type AsObject = {
    conflictingAppointmentsList: Array<Appointment.AsObject>;
    message: string;
  };
}

export class CreateAppointmentRequest extends jspb.Message {
  getUserId(): string;
  setUserId(value: string): CreateAppointmentRequest;

  getTitle(): string;
  setTitle(value: string): CreateAppointmentRequest;

  getDescription(): string;
  setDescription(value: string): CreateAppointmentRequest;

  getStartTime(): google_protobuf_timestamp_pb.Timestamp | undefined;
  setStartTime(value?: google_protobuf_timestamp_pb.Timestamp): CreateAppointmentRequest;
  hasStartTime(): boolean;
  clearStartTime(): CreateAppointmentRequest;

  getEndTime(): google_protobuf_timestamp_pb.Timestamp | undefined;
  setEndTime(value?: google_protobuf_timestamp_pb.Timestamp): CreateAppointmentRequest;
  hasEndTime(): boolean;
  clearEndTime(): CreateAppointmentRequest;

  getLocation(): string;
  setLocation(value: string): CreateAppointmentRequest;

  getAttendeesList(): Array<string>;
  setAttendeesList(value: Array<string>): CreateAppointmentRequest;
  clearAttendeesList(): CreateAppointmentRequest;
  addAttendees(value: string, index?: number): CreateAppointmentRequest;

  getRecurrence(): RecurrenceRule | undefined;
  setRecurrence(value?: RecurrenceRule): CreateAppointmentRequest;
  hasRecurrence(): boolean;
  clearRecurrence(): CreateAppointmentRequest;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): CreateAppointmentRequest.AsObject;
  static toObject(includeInstance: boolean, msg: CreateAppointmentRequest): CreateAppointmentRequest.AsObject;
  static serializeBinaryToWriter(message: CreateAppointmentRequest, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): CreateAppointmentRequest;
  static deserializeBinaryFromReader(message: CreateAppointmentRequest, reader: jspb.BinaryReader): CreateAppointmentRequest;
}

export namespace CreateAppointmentRequest {
  export type AsObject = {
    userId: string;
    title: string;
    description: string;
    startTime?: google_protobuf_timestamp_pb.Timestamp.AsObject;
    endTime?: google_protobuf_timestamp_pb.Timestamp.AsObject;
    location: string;
    attendeesList: Array<string>;
    recurrence?: RecurrenceRule.AsObject;
  };
}

export class CreateAppointmentResponse extends jspb.Message {
  getAppointment(): Appointment | undefined;
  setAppointment(value?: Appointment): CreateAppointmentResponse;
  hasAppointment(): boolean;
  clearAppointment(): CreateAppointmentResponse;

  getConflicts(): ConflictInfo | undefined;
  setConflicts(value?: ConflictInfo): CreateAppointmentResponse;
  hasConflicts(): boolean;
  clearConflicts(): CreateAppointmentResponse;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): CreateAppointmentResponse.AsObject;
  static toObject(includeInstance: boolean, msg: CreateAppointmentResponse): CreateAppointmentResponse.AsObject;
  static serializeBinaryToWriter(message: CreateAppointmentResponse, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): CreateAppointmentResponse;
  static deserializeBinaryFromReader(message: CreateAppointmentResponse, reader: jspb.BinaryReader): CreateAppointmentResponse;
}

export namespace CreateAppointmentResponse {
  export type AsObject = {
    appointment?: Appointment.AsObject;
    conflicts?: ConflictInfo.AsObject;
  };
}

export class GetAppointmentRequest extends jspb.Message {
  getId(): string;
  setId(value: string): GetAppointmentRequest;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): GetAppointmentRequest.AsObject;
  static toObject(includeInstance: boolean, msg: GetAppointmentRequest): GetAppointmentRequest.AsObject;
  static serializeBinaryToWriter(message: GetAppointmentRequest, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): GetAppointmentRequest;
  static deserializeBinaryFromReader(message: GetAppointmentRequest, reader: jspb.BinaryReader): GetAppointmentRequest;
}

export namespace GetAppointmentRequest {
  export type AsObject = {
    id: string;
  };
}

export class GetAppointmentResponse extends jspb.Message {
  getAppointment(): Appointment | undefined;
  setAppointment(value?: Appointment): GetAppointmentResponse;
  hasAppointment(): boolean;
  clearAppointment(): GetAppointmentResponse;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): GetAppointmentResponse.AsObject;
  static toObject(includeInstance: boolean, msg: GetAppointmentResponse): GetAppointmentResponse.AsObject;
  static serializeBinaryToWriter(message: GetAppointmentResponse, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): GetAppointmentResponse;
  static deserializeBinaryFromReader(message: GetAppointmentResponse, reader: jspb.BinaryReader): GetAppointmentResponse;
}

export namespace GetAppointmentResponse {
  export type AsObject = {
    appointment?: Appointment.AsObject;
  };
}

export class ListAppointmentsRequest extends jspb.Message {
  getUserId(): string;
  setUserId(value: string): ListAppointmentsRequest;

  getFrom(): google_protobuf_timestamp_pb.Timestamp | undefined;
  setFrom(value?: google_protobuf_timestamp_pb.Timestamp): ListAppointmentsRequest;
  hasFrom(): boolean;
  clearFrom(): ListAppointmentsRequest;

  getTo(): google_protobuf_timestamp_pb.Timestamp | undefined;
  setTo(value?: google_protobuf_timestamp_pb.Timestamp): ListAppointmentsRequest;
  hasTo(): boolean;
  clearTo(): ListAppointmentsRequest;

  getStatus(): AppointmentStatus;
  setStatus(value: AppointmentStatus): ListAppointmentsRequest;

  getLimit(): number;
  setLimit(value: number): ListAppointmentsRequest;

  getOffset(): number;
  setOffset(value: number): ListAppointmentsRequest;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): ListAppointmentsRequest.AsObject;
  static toObject(includeInstance: boolean, msg: ListAppointmentsRequest): ListAppointmentsRequest.AsObject;
  static serializeBinaryToWriter(message: ListAppointmentsRequest, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): ListAppointmentsRequest;
  static deserializeBinaryFromReader(message: ListAppointmentsRequest, reader: jspb.BinaryReader): ListAppointmentsRequest;
}

export namespace ListAppointmentsRequest {
  export type AsObject = {
    userId: string;
    from?: google_protobuf_timestamp_pb.Timestamp.AsObject;
    to?: google_protobuf_timestamp_pb.Timestamp.AsObject;
    status: AppointmentStatus;
    limit: number;
    offset: number;
  };
}

export class ListAppointmentsResponse extends jspb.Message {
  getAppointmentsList(): Array<Appointment>;
  setAppointmentsList(value: Array<Appointment>): ListAppointmentsResponse;
  clearAppointmentsList(): ListAppointmentsResponse;
  addAppointments(value?: Appointment, index?: number): Appointment;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): ListAppointmentsResponse.AsObject;
  static toObject(includeInstance: boolean, msg: ListAppointmentsResponse): ListAppointmentsResponse.AsObject;
  static serializeBinaryToWriter(message: ListAppointmentsResponse, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): ListAppointmentsResponse;
  static deserializeBinaryFromReader(message: ListAppointmentsResponse, reader: jspb.BinaryReader): ListAppointmentsResponse;
}

export namespace ListAppointmentsResponse {
  export type AsObject = {
    appointmentsList: Array<Appointment.AsObject>;
  };
}

export class UpdateAppointmentRequest extends jspb.Message {
  getAppointment(): Appointment | undefined;
  setAppointment(value?: Appointment): UpdateAppointmentRequest;
  hasAppointment(): boolean;
  clearAppointment(): UpdateAppointmentRequest;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): UpdateAppointmentRequest.AsObject;
  static toObject(includeInstance: boolean, msg: UpdateAppointmentRequest): UpdateAppointmentRequest.AsObject;
  static serializeBinaryToWriter(message: UpdateAppointmentRequest, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): UpdateAppointmentRequest;
  static deserializeBinaryFromReader(message: UpdateAppointmentRequest, reader: jspb.BinaryReader): UpdateAppointmentRequest;
}

export namespace UpdateAppointmentRequest {
  export type AsObject = {
    appointment?: Appointment.AsObject;
  };
}

export class UpdateAppointmentResponse extends jspb.Message {
  getAppointment(): Appointment | undefined;
  setAppointment(value?: Appointment): UpdateAppointmentResponse;
  hasAppointment(): boolean;
  clearAppointment(): UpdateAppointmentResponse;

  getConflicts(): ConflictInfo | undefined;
  setConflicts(value?: ConflictInfo): UpdateAppointmentResponse;
  hasConflicts(): boolean;
  clearConflicts(): UpdateAppointmentResponse;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): UpdateAppointmentResponse.AsObject;
  static toObject(includeInstance: boolean, msg: UpdateAppointmentResponse): UpdateAppointmentResponse.AsObject;
  static serializeBinaryToWriter(message: UpdateAppointmentResponse, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): UpdateAppointmentResponse;
  static deserializeBinaryFromReader(message: UpdateAppointmentResponse, reader: jspb.BinaryReader): UpdateAppointmentResponse;
}

export namespace UpdateAppointmentResponse {
  export type AsObject = {
    appointment?: Appointment.AsObject;
    conflicts?: ConflictInfo.AsObject;
  };
}

export class DeleteAppointmentRequest extends jspb.Message {
  getId(): string;
  setId(value: string): DeleteAppointmentRequest;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): DeleteAppointmentRequest.AsObject;
  static toObject(includeInstance: boolean, msg: DeleteAppointmentRequest): DeleteAppointmentRequest.AsObject;
  static serializeBinaryToWriter(message: DeleteAppointmentRequest, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): DeleteAppointmentRequest;
  static deserializeBinaryFromReader(message: DeleteAppointmentRequest, reader: jspb.BinaryReader): DeleteAppointmentRequest;
}

export namespace DeleteAppointmentRequest {
  export type AsObject = {
    id: string;
  };
}

export class DeleteAppointmentResponse extends jspb.Message {
  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): DeleteAppointmentResponse.AsObject;
  static toObject(includeInstance: boolean, msg: DeleteAppointmentResponse): DeleteAppointmentResponse.AsObject;
  static serializeBinaryToWriter(message: DeleteAppointmentResponse, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): DeleteAppointmentResponse;
  static deserializeBinaryFromReader(message: DeleteAppointmentResponse, reader: jspb.BinaryReader): DeleteAppointmentResponse;
}

export namespace DeleteAppointmentResponse {
  export type AsObject = {
  };
}

export class CheckConflictsRequest extends jspb.Message {
  getUserId(): string;
  setUserId(value: string): CheckConflictsRequest;

  getStartTime(): google_protobuf_timestamp_pb.Timestamp | undefined;
  setStartTime(value?: google_protobuf_timestamp_pb.Timestamp): CheckConflictsRequest;
  hasStartTime(): boolean;
  clearStartTime(): CheckConflictsRequest;

  getEndTime(): google_protobuf_timestamp_pb.Timestamp | undefined;
  setEndTime(value?: google_protobuf_timestamp_pb.Timestamp): CheckConflictsRequest;
  hasEndTime(): boolean;
  clearEndTime(): CheckConflictsRequest;

  getExcludeId(): string;
  setExcludeId(value: string): CheckConflictsRequest;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): CheckConflictsRequest.AsObject;
  static toObject(includeInstance: boolean, msg: CheckConflictsRequest): CheckConflictsRequest.AsObject;
  static serializeBinaryToWriter(message: CheckConflictsRequest, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): CheckConflictsRequest;
  static deserializeBinaryFromReader(message: CheckConflictsRequest, reader: jspb.BinaryReader): CheckConflictsRequest;
}

export namespace CheckConflictsRequest {
  export type AsObject = {
    userId: string;
    startTime?: google_protobuf_timestamp_pb.Timestamp.AsObject;
    endTime?: google_protobuf_timestamp_pb.Timestamp.AsObject;
    excludeId: string;
  };
}

export class CheckConflictsResponse extends jspb.Message {
  getConflicts(): ConflictInfo | undefined;
  setConflicts(value?: ConflictInfo): CheckConflictsResponse;
  hasConflicts(): boolean;
  clearConflicts(): CheckConflictsResponse;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): CheckConflictsResponse.AsObject;
  static toObject(includeInstance: boolean, msg: CheckConflictsResponse): CheckConflictsResponse.AsObject;
  static serializeBinaryToWriter(message: CheckConflictsResponse, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): CheckConflictsResponse;
  static deserializeBinaryFromReader(message: CheckConflictsResponse, reader: jspb.BinaryReader): CheckConflictsResponse;
}

export namespace CheckConflictsResponse {
  export type AsObject = {
    conflicts?: ConflictInfo.AsObject;
  };
}

export class StreamAppointmentsRequest extends jspb.Message {
  getUserId(): string;
  setUserId(value: string): StreamAppointmentsRequest;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): StreamAppointmentsRequest.AsObject;
  static toObject(includeInstance: boolean, msg: StreamAppointmentsRequest): StreamAppointmentsRequest.AsObject;
  static serializeBinaryToWriter(message: StreamAppointmentsRequest, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): StreamAppointmentsRequest;
  static deserializeBinaryFromReader(message: StreamAppointmentsRequest, reader: jspb.BinaryReader): StreamAppointmentsRequest;
}

export namespace StreamAppointmentsRequest {
  export type AsObject = {
    userId: string;
  };
}

export class AppointmentEvent extends jspb.Message {
  getType(): AppointmentEvent.EventType;
  setType(value: AppointmentEvent.EventType): AppointmentEvent;

  getAppointment(): Appointment | undefined;
  setAppointment(value?: Appointment): AppointmentEvent;
  hasAppointment(): boolean;
  clearAppointment(): AppointmentEvent;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): AppointmentEvent.AsObject;
  static toObject(includeInstance: boolean, msg: AppointmentEvent): AppointmentEvent.AsObject;
  static serializeBinaryToWriter(message: AppointmentEvent, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): AppointmentEvent;
  static deserializeBinaryFromReader(message: AppointmentEvent, reader: jspb.BinaryReader): AppointmentEvent;
}

export namespace AppointmentEvent {
  export type AsObject = {
    type: AppointmentEvent.EventType;
    appointment?: Appointment.AsObject;
  };

  export enum EventType {
    EVENT_TYPE_UNSPECIFIED = 0,
    EVENT_TYPE_CREATED = 1,
    EVENT_TYPE_UPDATED = 2,
    EVENT_TYPE_DELETED = 3,
  }
}

export enum AppointmentStatus {
  APPOINTMENT_STATUS_UNSPECIFIED = 0,
  APPOINTMENT_STATUS_SCHEDULED = 1,
  APPOINTMENT_STATUS_CANCELLED = 2,
  APPOINTMENT_STATUS_COMPLETED = 3,
}
export enum RecurrenceFrequency {
  RECURRENCE_FREQUENCY_UNSPECIFIED = 0,
  RECURRENCE_FREQUENCY_DAILY = 1,
  RECURRENCE_FREQUENCY_WEEKLY = 2,
  RECURRENCE_FREQUENCY_MONTHLY = 3,
}
