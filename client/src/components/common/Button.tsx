import type { ButtonHTMLAttributes } from 'react';
import './Button.css';

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement>;

function Button({ className, ...props }: ButtonProps): JSX.Element {
  return <button className={`btn ${className || ''}`} {...props} />;
}

export default Button;
