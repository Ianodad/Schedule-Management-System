import { useState, useCallback, useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import { startOfMonth, endOfMonth } from 'date-fns';
import Calendar from '@/components/Calendar/Calendar';
import AppointmentForm from '@/components/Appointment/AppointmentForm';
import AppointmentList from '@/components/Appointment/AppointmentList';
import Modal from '@/components/common/Modal';
import Button from '@/components/common/Button';
import { useAppointments } from '@/hooks/useAppointments';
import { useRealtimeUpdates } from '@/hooks/useRealtimeUpdates';
import type { Appointment, AppointmentEvent, EventType } from '@/types/appointment';
import './App.css';

// For demo purposes, use a hardcoded user ID
// In production, this would come from authentication
const CURRENT_USER_ID = 'user-demo-123';

function App(): JSX.Element {
  const [showForm, setShowForm] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState<Appointment | undefined>();
  const [selectedDate] = useState(new Date());

  const { appointments, addAppointment, modifyAppointment, removeAppointment, refetchAppointments } =
    useAppointments({
      userId: CURRENT_USER_ID,
      from: startOfMonth(selectedDate).toISOString(),
      to: endOfMonth(selectedDate).toISOString(),
    });

  // Set up real-time updates
  useRealtimeUpdates({
    userId: CURRENT_USER_ID,
    onEvent: useCallback(
      (event: AppointmentEvent) => {
        console.log('Appointment event received:', event);
        // Refetch appointments when we receive an event
        refetchAppointments();
      },
      [refetchAppointments]
    ),
    onError: useCallback((error: Error) => {
      console.error('Real-time update error:', error);
    }, []),
    enabled: false, // Disable real-time for now (optional feature)
  });

  const handleCreateAppointment = useCallback(
    async (request: any) => {
      const result = await addAppointment(request);
      if (result.appointment && !result.conflicts) {
        setShowForm(false);
      }
      return result;
    },
    [addAppointment]
  );

  const handleEditAppointment = useCallback(
    (appointment: Appointment) => {
      setEditingAppointment(appointment);
      setShowForm(true);
    },
    []
  );

  const handleUpdateAppointment = useCallback(
    async (request: any) => {
      if (!editingAppointment) return;

      const result = await modifyAppointment({
        appointment: {
          ...editingAppointment,
          ...request,
          id: editingAppointment.id,
          version: editingAppointment.version,
        },
      });

      if (result.appointment) {
        setShowForm(false);
        setEditingAppointment(undefined);
      }

      return result;
    },
    [editingAppointment, modifyAppointment]
  );

  const handleCloseForm = useCallback(() => {
    setShowForm(false);
    setEditingAppointment(undefined);
  }, []);

  return (
    <div className="app">
      <Toaster position="top-right" />

      <header className="app-header">
        <h1>Schedule Management System</h1>
        <Button onClick={() => setShowForm(true)} className="btn-primary">
          + New Appointment
        </Button>
      </header>

      <main className="app-main">
        <section className="app-section">
          <Calendar appointments={appointments} onAppointmentClick={handleEditAppointment} />
        </section>

        <section className="app-section">
          <h2 className="app-section-title">Upcoming Appointments</h2>
          <AppointmentList
            appointments={appointments}
            onEdit={handleEditAppointment}
            onDelete={removeAppointment}
          />
        </section>
      </main>

      <Modal isOpen={showForm} onClose={handleCloseForm} title={editingAppointment ? 'Edit Appointment' : 'New Appointment'}>
        <AppointmentForm
          userId={CURRENT_USER_ID}
          appointment={editingAppointment}
          onSubmit={editingAppointment ? handleUpdateAppointment : handleCreateAppointment}
          onCancel={handleCloseForm}
        />
      </Modal>
    </div>
  );
}

export default App;
