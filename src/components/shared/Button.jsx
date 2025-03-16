import React from 'react';

const Button = ({ 
  children, 
  onClick, 
  type = 'button', 
  variant = 'primary', 
  size = 'medium',
  disabled = false,
  className = '',
  ...props
}) => {
  // Base styles for all buttons
  const baseStyles = 'inline-flex items-center justify-center font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors rounded-md';
  
  // Define variant styles
  const variantStyles = {
    primary: 'bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary)]/90 focus:ring-[var(--color-primary)]',
    secondary: 'bg-gray-200 dark:bg-gray-700 text-[var(--color-text-primary)] hover:bg-gray-300 dark:hover:bg-gray-600 focus:ring-gray-400',
    success: 'bg-[var(--color-success)] text-white hover:bg-[var(--color-success)]/90 focus:ring-[var(--color-success)]',
    danger: 'bg-[var(--color-error)] text-white hover:bg-[var(--color-error)]/90 focus:ring-[var(--color-error)]',
    warning: 'bg-[var(--color-warning)] text-white hover:bg-[var(--color-warning)]/90 focus:ring-[var(--color-warning)]',
    outline: 'bg-transparent border border-[var(--color-primary)] text-[var(--color-primary)] hover:bg-[var(--color-primary)]/10 focus:ring-[var(--color-primary)]',
    ghost: 'bg-transparent text-[var(--color-text-primary)] hover:bg-gray-100 dark:hover:bg-gray-700 focus:ring-gray-300',
  };
  
  // Define size styles
  const sizeStyles = {
    small: 'text-xs py-1 px-2',
    medium: 'text-sm py-2 px-4',
    large: 'text-base py-2.5 px-5',
  };
  
  // Define disabled styles
  const disabledStyles = disabled ? 'opacity-50 cursor-not-allowed' : '';
  
  // Combine all styles
  const buttonClasses = [
    `btn btn-${variant} btn-${size}`, // Traditional CSS classes
    baseStyles,
    variantStyles[variant] || variantStyles.primary,
    sizeStyles[size] || sizeStyles.medium,
    disabledStyles,
    disabled ? 'btn-disabled' : '',
    className
  ].filter(Boolean).join(' ');

  return (
    <button
      type={type}
      className={buttonClasses}
      onClick={onClick}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;