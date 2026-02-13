import { useState } from 'react';
import { format, addDays, subDays, addWeeks, subWeeks, addMonths, subMonths } from 'date-fns';
import CalendarGrid from './CalendarGrid';
import DayView from './DayView';
import WeekView from './WeekView';
import Button from '@/components/common/Button';
import type { Appointment } from '@/types/appointment';
import './Calendar.css';

type CalendarView = 'day' | 'week' | 'month';

interface CalendarProps {
  appointments: Appointment[];
  onAppointmentClick?: (appointment: Appointment) => void;
}

function Calendar({ appointments, onAppointmentClick }: CalendarProps): JSX.Element {
  const [view, setView] = useState<CalendarView>('week');
  const [currentDate, setCurrentDate] = useState(new Date());

  const handlePrevious = () => {
    switch (view) {
      case 'day':
        setCurrentDate(subDays(currentDate, 1));
        break;
      case 'week':
        setCurrentDate(subWeeks(currentDate, 1));
        break;
      case 'month':
        setCurrentDate(subMonths(currentDate, 1));
        break;
    }
  };

  const handleNext = () => {
    switch (view) {
      case 'day':
        setCurrentDate(addDays(currentDate, 1));
        break;
      case 'week':
        setCurrentDate(addWeeks(currentDate, 1));
        break;
      case 'month':
        setCurrentDate(addMonths(currentDate, 1));
        break;
    }
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const getDateRangeLabel = () => {
    switch (view) {
      case 'day':
        return format(currentDate, 'EEEE, MMMM d, yyyy');
      case 'week': {
        const startOfWeek = new Date(currentDate);
        startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
        const endOfWeek = addDays(startOfWeek, 6);
        return `${format(startOfWeek, 'MMM d')} - ${format(endOfWeek, 'MMM d, yyyy')}`;
      }
      case 'month':
        return format(currentDate, 'MMMM yyyy');
    }
  };

  return (
    <section className="calendar-container">
      <div className="calendar-header">
        <div className="calendar-navigation">
          <Button onClick={handlePrevious}>←</Button>
          <Button onClick={handleToday}>Today</Button>
          <Button onClick={handleNext}>→</Button>
          <h2 className="calendar-date-label">{getDateRangeLabel()}</h2>
        </div>

        <div className="calendar-view-switcher">
          <Button
            onClick={() => setView('day')}
            className={view === 'day' ? 'active' : ''}
          >
            Day
          </Button>
          <Button
            onClick={() => setView('week')}
            className={view === 'week' ? 'active' : ''}
          >
            Week
          </Button>
          <Button
            onClick={() => setView('month')}
            className={view === 'month' ? 'active' : ''}
          >
            Month
          </Button>
        </div>
      </div>

      <div className="calendar-view">
        {view === 'day' && (
          <DayView
            date={currentDate}
            appointments={appointments}
            onAppointmentClick={onAppointmentClick}
          />
        )}
        {view === 'week' && (
          <WeekView
            date={currentDate}
            appointments={appointments}
            onAppointmentClick={onAppointmentClick}
          />
        )}
        {view === 'month' && (
          <CalendarGrid
            date={currentDate}
            appointments={appointments}
            onAppointmentClick={onAppointmentClick}
          />
        )}
      </div>
    </section>
  );
}

export default Calendar;
