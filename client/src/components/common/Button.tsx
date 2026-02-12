import type { ButtonHTMLAttributes } from 'react'

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement>

function Button(props: ButtonProps): JSX.Element {
  return <button {...props} />
}

export default Button
