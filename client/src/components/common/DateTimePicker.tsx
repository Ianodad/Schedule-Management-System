import type { InputHTMLAttributes } from 'react'

type DateTimePickerProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'type'>

function DateTimePicker(props: DateTimePickerProps): JSX.Element {
  return <input type="datetime-local" {...props} />
}

export default DateTimePicker
