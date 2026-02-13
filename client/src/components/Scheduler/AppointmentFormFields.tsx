import type { AppointmentFormState } from './formTypes'

interface AppointmentFormFieldsProps {
  formState: AppointmentFormState
  onChange: (next: AppointmentFormState) => void
}

function AppointmentFormFields({
  formState,
  onChange,
}: AppointmentFormFieldsProps) {
  const now = new Date()
  const todayDate = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, '0'),
    String(now.getDate()).padStart(2, '0'),
  ].join('-')
  const currentTime = [
    String(now.getHours()).padStart(2, '0'),
    String(now.getMinutes()).padStart(2, '0'),
  ].join(':')
  const minStartTime = formState.date === todayDate ? currentTime : undefined

  return (
    <>
      <label>
        Title
        <input
          required
          value={formState.title}
          onChange={(event) =>
            onChange({ ...formState, title: event.target.value })
          }
          placeholder="Client check-in"
        />
      </label>

      <label>
        Description
        <textarea
          value={formState.description}
          onChange={(event) =>
            onChange({ ...formState, description: event.target.value })
          }
          placeholder="Agenda, notes, expectations"
        />
      </label>

      <div className="form-row">
        <label>
          Date
          <input
            required
            type="date"
            value={formState.date}
            onChange={(event) =>
              onChange({ ...formState, date: event.target.value })
            }
            min={todayDate}
            max="2099-12-31"
          />
        </label>
        <label>
          Start
          <input
            required
            type="time"
            value={formState.startTime}
            onChange={(event) =>
              onChange({ ...formState, startTime: event.target.value })
            }
            min={minStartTime}
          />
        </label>
        <label>
          End
          <input
            required
            type="time"
            value={formState.endTime}
            onChange={(event) =>
              onChange({ ...formState, endTime: event.target.value })
            }
          />
        </label>
      </div>

      <label>
        Location
        <input
          value={formState.location}
          onChange={(event) =>
            onChange({ ...formState, location: event.target.value })
          }
          placeholder="Board room A / Zoom"
        />
      </label>

      <label>
        Attendees (comma separated)
        <input
          value={formState.attendees}
          onChange={(event) =>
            onChange({ ...formState, attendees: event.target.value })
          }
          placeholder="alice@company.com, bob@company.com"
        />
      </label>

      <div className="form-row recurrence-row">
        <label>
          Repeat
          <select
            value={formState.recurrence}
            onChange={(event) =>
              onChange({
                ...formState,
                recurrence: event.target.value as AppointmentFormState['recurrence'],
              })
            }
          >
            <option value="none">None</option>
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
          </select>
        </label>

        <label>
          Interval
          <input
            type="number"
            min={1}
            value={formState.recurrenceInterval}
            onChange={(event) =>
              onChange({ ...formState, recurrenceInterval: event.target.value })
            }
            disabled={formState.recurrence === 'none'}
          />
        </label>
      </div>
    </>
  )
}

export default AppointmentFormFields
