import CalendarGrid from './CalendarGrid'
import DayView from './DayView'

function Calendar(): JSX.Element {
  return (
    <section>
      <h2>Calendar</h2>
      <CalendarGrid />
      <DayView />
    </section>
  )
}

export default Calendar
