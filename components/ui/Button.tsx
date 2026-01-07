'use client';

import React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'icon';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const variantStyles = {
  primary: 'btn-primary shine-effect',
  secondary: 'btn-secondary',
  ghost: 'btn-ghost',
  icon: 'btn-icon',
};

const sizeStyles = {
  sm: 'px-4 py-2 text-sm min-h-touch-sm',
  md: 'px-6 py-4 text-touch min-h-touch',
  lg: 'px-8 py-5 text-touch-lg min-h-touch-lg',
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className = '',
      variant = 'primary',
      size = 'md',
      isLoading = false,
      disabled,
      leftIcon,
      rightIcon,
      children,
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || isLoading;

    return (
      <button
        ref={ref}
        className={`
          ${variantStyles[variant]}
          ${variant !== 'icon' ? sizeStyles[size] : ''}
          inline-flex items-center justify-center gap-2
          no-tap-highlight
          ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}
          ${className}
        `.trim()}
        disabled={isDisabled}
        {...props}
      >
        {isLoading ? (
          <>
            <span className="loading-spinner" />
            <span>Chargement...</span>
          </>
        ) : (
          <>
            {leftIcon && <span className="shrink-0">{leftIcon}</span>}
            {children}
            {rightIcon && <span className="shrink-0">{rightIcon}</span>}
          </>
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';

export default Button;
