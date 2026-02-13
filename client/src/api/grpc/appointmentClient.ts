/**
 * gRPC-Web client for Appointment Service
 *
 * This client communicates with the Go gRPC server via Envoy proxy
 * using gRPC-Web protocol over HTTP/1.1
 */

import type {
  Appointment,
  CreateAppointmentRequest,
  CreateAppointmentResponse,
  GetAppointmentRequest,
  GetAppointmentResponse,
  ListAppointmentsRequest,
  ListAppointmentsResponse,
  UpdateAppointmentRequest,
  UpdateAppointmentResponse,
  DeleteAppointmentRequest,
  CheckConflictsRequest,
  CheckConflictsResponse,
} from './types'

// Get Envoy proxy URL from environment or default to localhost
const GRPC_WEB_URL = import.meta.env.VITE_GRPC_WEB_URL || 'http://localhost:8080'

/**
 * AppointmentClient - Client for interacting with the Appointment Service
 */
export class AppointmentClient {
  private baseUrl: string

  constructor(baseUrl: string = GRPC_WEB_URL) {
    this.baseUrl = baseUrl
  }

  /**
   * Helper to make gRPC-Web requests
   */
  private async request<TRequest, TResponse>(
    method: string,
    request: TRequest
  ): Promise<TResponse> {
    const url = `${this.baseUrl}/appointment.v1.AppointmentService/${method}`

    // Convert dates to ISO strings for JSON serialization
    const serializedRequest = this.serializeRequest(request)

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(serializedRequest),
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      throw new Error(
        error.message || `gRPC request failed: ${response.status} ${response.statusText}`
      )
    }

    const data = await response.json()
    return this.deserializeResponse(data) as TResponse
  }

  /**
   * Serialize request data (convert Dates to ISO strings)
   */
  private serializeRequest(request: any): any {
    if (request === null || request === undefined) {
      return request
    }

    if (request instanceof Date) {
      return request.toISOString()
    }

    if (Array.isArray(request)) {
      return request.map(item => this.serializeRequest(item))
    }

    if (typeof request === 'object') {
      const serialized: any = {}
      for (const [key, value] of Object.entries(request)) {
        serialized[key] = this.serializeRequest(value)
      }
      return serialized
    }

    return request
  }

  /**
   * Deserialize response data (convert ISO strings to Dates)
   */
  private deserializeResponse(response: any): any {
    if (response === null || response === undefined) {
      return response
    }

    if (typeof response === 'string' && this.isISODate(response)) {
      return new Date(response)
    }

    if (Array.isArray(response)) {
      return response.map(item => this.deserializeResponse(item))
    }

    if (typeof response === 'object') {
      const deserialized: any = {}
      for (const [key, value] of Object.entries(response)) {
        // Handle timestamp fields
        if (key.endsWith('Time') || key.endsWith('At') || key === 'until') {
          deserialized[key] = value ? new Date(value as string) : undefined
        } else {
          deserialized[key] = this.deserializeResponse(value)
        }
      }
      return deserialized
    }

    return response
  }

  /**
   * Check if a string is an ISO date
   */
  private isISODate(str: string): boolean {
    return /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(str)
  }

  /**
   * Create a new appointment
   */
  async createAppointment(
    request: CreateAppointmentRequest
  ): Promise<CreateAppointmentResponse> {
    return this.request<CreateAppointmentRequest, CreateAppointmentResponse>(
      'CreateAppointment',
      request
    )
  }

  /**
   * Get an appointment by ID
   */
  async getAppointment(
    request: GetAppointmentRequest
  ): Promise<GetAppointmentResponse> {
    return this.request<GetAppointmentRequest, GetAppointmentResponse>(
      'GetAppointment',
      request
    )
  }

  /**
   * List appointments for a user
   */
  async listAppointments(
    request: ListAppointmentsRequest
  ): Promise<ListAppointmentsResponse> {
    return this.request<ListAppointmentsRequest, ListAppointmentsResponse>(
      'ListAppointments',
      request
    )
  }

  /**
   * Update an existing appointment
   */
  async updateAppointment(
    request: UpdateAppointmentRequest
  ): Promise<UpdateAppointmentResponse> {
    return this.request<UpdateAppointmentRequest, UpdateAppointmentResponse>(
      'UpdateAppointment',
      request
    )
  }

  /**
   * Delete an appointment
   */
  async deleteAppointment(
    request: DeleteAppointmentRequest
  ): Promise<void> {
    await this.request('DeleteAppointment', request)
  }

  /**
   * Check for scheduling conflicts
   */
  async checkConflicts(
    request: CheckConflictsRequest
  ): Promise<CheckConflictsResponse> {
    return this.request<CheckConflictsRequest, CheckConflictsResponse>(
      'CheckConflicts',
      request
    )
  }
}

// Export singleton instance
export const appointmentClient = new AppointmentClient()
