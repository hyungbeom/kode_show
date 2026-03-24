import { memo, ButtonHTMLAttributes, ReactNode } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'icon' | 'text'
  size?: 'small' | 'medium' | 'large'
  children: ReactNode
  isLoading?: boolean
}

/**
 * 재사용 가능한 Button 컴포넌트
 */
const Button = memo(function Button({
  variant = 'primary',
  size = 'medium',
  children,
  isLoading = false,
  className = '',
  disabled,
  ...props
}: ButtonProps) {
  const baseClasses = 'button'
  const variantClasses = {
    primary: 'button--primary',
    secondary: 'button--secondary',
    icon: 'button--icon',
    text: 'button--text',
  }
  const sizeClasses = {
    small: 'button--small',
    medium: 'button--medium',
    large: 'button--large',
  }

  const classes = [
    baseClasses,
    variantClasses[variant],
    sizeClasses[size],
    isLoading && 'button--loading',
    className,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <button
      className={classes}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? 'Loading...' : children}
    </button>
  )
})

Button.displayName = 'Button'

export default Button
