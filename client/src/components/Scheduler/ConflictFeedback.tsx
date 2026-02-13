import type { ConflictInfo } from '../../types/appointment'
import {
  formatTimeRange,
  toDate,
} from './schedulerUtils'

interface ConflictFeedbackProps {
  conflicts: ConflictInfo | null
}

function ConflictFeedback({ conflicts }: ConflictFeedbackProps) {
  if (!conflicts) {
    return null
  }

  return (
    <div className="conflict-box" role="alert">
      <p className="conflict-title">Conflict detected</p>
      <p>{conflicts.message || 'This time overlaps with an existing appointment.'}</p>
      {conflicts.conflictingAppointments?.length ? (
        <ul className="conflict-list">
          {conflicts.conflictingAppointments.map((appointment) => (
            <li key={appointment.id} className="conflict-item">
              <strong>{appointment.title}</strong>
              <span>
                {toDate(appointment.startTime).toLocaleDateString()} ·{' '}
                {formatTimeRange(
                  toDate(appointment.startTime),
                  toDate(appointment.endTime),
                )}
              </span>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}

export default ConflictFeedback
