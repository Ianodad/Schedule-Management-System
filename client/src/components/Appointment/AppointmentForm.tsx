import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import DateTimePicker from '@/components/common/DateTimePicker';
import Button from '@/components/common/Button';
import Modal from '@/components/common/Modal';
import ConflictModal from './ConflictModal';
import { useConflictDetection } from '@/hooks/useConflictDetection';
import type {
  Appointment,
  CreateAppointmentRequest,
  RecurrenceRule,
  RecurrenceFrequency,
  AppointmentStatus,
} from '@/types/appointment';
import './AppointmentForm.css';

interface AppointmentFormProps {
  userId: string;
  appointment?: Appointment;
  onSubmit: (request: CreateAppointmentRequest) => Promise<any>;
  onCancel?: () => void;
}

function AppointmentForm({ userId, appointment, onSubmit, onCancel }: AppointmentFormProps): JSX.Element {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [location, setLocation] = useState('');
  const [attendees, setAttendees] = useState<string[]>([]);
  const [attendeeInput, setAttendeeInput] = useState('');
  const [hasRecurrence, setHasRecurrence] = useState(false);
  const [recurrenceFrequency, setRecurrenceFrequency] = useState<RecurrenceFrequency>(
    1 // DAILY
  );
  const [recurrenceInterval, setRecurrenceInterval] = useState(1);
  const [recurrenceCount, setRecurrenceCount] = useState<number | undefined>(undefined);
  const [submitting, setSubmitting] = useState(false);

  const { checking, conflicts, checkForConflicts, clearConflicts } = useConflictDetection();
  const [showConflictModal, setShowConflictModal] = useState(false);

  // Initialize form with appointment data if editing
  useEffect(() => {
    if (appointment) {
      setTitle(appointment.title);
      setDescription(appointment.description || '');
      setStartTime(toDatetimeLocal(appointment.startTime));
      setEndTime(toDatetimeLocal(appointment.endTime));
      setLocation(appointment.location || '');
      setAttendees(appointment.attendees || []);
      if (appointment.recurrence) {
        setHasRecurrence(true);
        setRecurrenceFrequency(appointment.recurrence.frequency);
        setRecurrenceInterval(appointment.recurrence.interval);
        setRecurrenceCount(appointment.recurrence.count);
      }
    }
  }, [appointment]);

  const toDatetimeLocal = (isoString: string): string => {
    const date = new Date(isoString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const handleAddAttendee = () => {
    if (attendeeInput.trim() && !attendees.includes(attendeeInput.trim())) {
      setAttendees([...attendees, attendeeInput.trim()]);
      setAttendeeInput('');
    }
  };

  const handleRemoveAttendee = (email: string) => {
    setAttendees(attendees.filter((a) => a !== email));
  };

  const validateForm = (): string | null => {
    if (!title.trim()) return 'Title is required';
    if (!startTime) return 'Start time is required';
    if (!endTime) return 'End time is required';
    if (new Date(startTime) >= new Date(endTime)) {
      return 'End time must be after start time';
    }
    return null;
  };

  const handleSubmit = async (event: React.FormEvent, ignoreConflicts = false) => {
    event.preventDefault();

    const validationError = validateForm();
    if (validationError) {
      alert(validationError);
      return;
    }

    const startTimeISO = new Date(startTime).toISOString();
    const endTimeISO = new Date(endTime).toISOString();

    // Check for conflicts first (unless ignoring)
    if (!ignoreConflicts) {
      const conflictInfo = await checkForConflicts(
        userId,
        startTimeISO,
        endTimeISO,
        appointment?.id
      );

      if (conflictInfo && conflictInfo.conflictingAppointments.length > 0) {
        setShowConflictModal(true);
        return;
      }
    }

    setSubmitting(true);
    try {
      const recurrence: RecurrenceRule | undefined = hasRecurrence
        ? {
            frequency: recurrenceFrequency,
            interval: recurrenceInterval,
            count: recurrenceCount,
          }
        : undefined;

      const request: CreateAppointmentRequest = {
        userId,
        title: title.trim(),
        description: description.trim() || undefined,
        startTime: startTimeISO,
        endTime: endTimeISO,
        location: location.trim() || undefined,
        attendees: attendees.length > 0 ? attendees : undefined,
        recurrence,
      };

      await onSubmit(request);

      // Reset form
      setTitle('');
      setDescription('');
      setStartTime('');
      setEndTime('');
      setLocation('');
      setAttendees([]);
      setHasRecurrence(false);
      clearConflicts();
    } catch (error) {
      console.error('Failed to submit appointment:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleConflictOverride = () => {
    setShowConflictModal(false);
    clearConflicts();
    // Create a synthetic event to submit with ignoreConflicts = true
    const syntheticEvent = new Event('submit') as any;
    syntheticEvent.preventDefault = () => {};
    handleSubmit(syntheticEvent, true);
  };

  return (
    <>
      <form className="appointment-form" onSubmit={(e) => handleSubmit(e, false)}>
        <div className="form-group">
          <label htmlFor="title">Title *</label>
          <input
            id="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Appointment title"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="description">Description</label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Add description..."
            rows={3}
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="startTime">Start Time *</label>
            <DateTimePicker
              id="startTime"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="endTime">End Time *</label>
            <DateTimePicker
              id="endTime"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              required
            />
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="location">Location</label>
          <input
            id="location"
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Meeting location or link"
          />
        </div>

        <div className="form-group">
          <label htmlFor="attendees">Attendees</label>
          <div className="attendee-input">
            <input
              id="attendees"
              type="email"
              value={attendeeInput}
              onChange={(e) => setAttendeeInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddAttendee())}
              placeholder="Enter email and press Enter"
            />
            <Button type="button" onClick={handleAddAttendee}>
              Add
            </Button>
          </div>
          {attendees.length > 0 && (
            <div className="attendee-list">
              {attendees.map((email) => (
                <span key={email} className="attendee-tag">
                  {email}
                  <button type="button" onClick={() => handleRemoveAttendee(email)}>
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="form-group">
          <label>
            <input
              type="checkbox"
              checked={hasRecurrence}
              onChange={(e) => setHasRecurrence(e.target.checked)}
            />
            Recurring appointment
          </label>
        </div>

        {hasRecurrence && (
          <div className="recurrence-options">
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="recurrenceFrequency">Frequency</label>
                <select
                  id="recurrenceFrequency"
                  value={recurrenceFrequency}
                  onChange={(e) => setRecurrenceFrequency(Number(e.target.value))}
                >
                  <option value={1}>Daily</option>
                  <option value={2}>Weekly</option>
                  <option value={3}>Monthly</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="recurrenceInterval">Every</label>
                <input
                  id="recurrenceInterval"
                  type="number"
                  min="1"
                  value={recurrenceInterval}
                  onChange={(e) => setRecurrenceInterval(Number(e.target.value))}
                />
              </div>

              <div className="form-group">
                <label htmlFor="recurrenceCount">Occurrences</label>
                <input
                  id="recurrenceCount"
                  type="number"
                  min="1"
                  value={recurrenceCount || ''}
                  onChange={(e) => setRecurrenceCount(e.target.value ? Number(e.target.value) : undefined)}
                  placeholder="Unlimited"
                />
              </div>
            </div>
          </div>
        )}

        <div className="form-actions">
          {onCancel && (
            <Button type="button" onClick={onCancel}>
              Cancel
            </Button>
          )}
          <Button type="submit" disabled={submitting || checking}>
            {submitting ? 'Saving...' : appointment ? 'Update' : 'Create'} Appointment
          </Button>
        </div>
      </form>

      {showConflictModal && conflicts && (
        <ConflictModal
          conflicts={conflicts}
          onOverride={handleConflictOverride}
          onCancel={() => {
            setShowConflictModal(false);
            clearConflicts();
          }}
        />
      )}
    </>
  );
}

export default AppointmentForm;
