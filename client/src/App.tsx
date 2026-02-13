import { useAppointments } from './hooks/useAppointments'
import './App.css'

function App(): JSX.Element {
  const { appointments, loading, createAppointment, deleteAppointment } = useAppointments()

  return (
    <div className="app">
      <header>
        <h1>Schedule Management System</h1>
      </header>
      <main className="container">
        {loading && <div className="loading">Loading...</div>}
        <div className="appointments-grid">
          <h2>Your Appointments</h2>
          {appointments.length === 0 ? (
            <p className="empty-state">No appointments yet. The calendar UI is coming soon!</p>
          ) : (
            <ul className="appointments-list">
              {appointments.map(apt => (
                <li key={apt.id} className="appointment-card">
                  <h3>{apt.title}</h3>
                  <p>{apt.description}</p>
                  <p>
                    <strong>When:</strong> {new Date(apt.startTime).toLocaleString()} - {new Date(apt.endTime).toLocaleString()}
                  </p>
                  {apt.location && <p><strong>Where:</strong> {apt.location}</p>}
                  <button onClick={() => deleteAppointment(apt.id)}>Delete</button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </main>
    </div>
  )
}

export default App
