'use client';

import React from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  rightElement?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className = '',
      label,
      error,
      hint,
      leftIcon,
      rightIcon,
      rightElement,
      id,
      ...props
    },
    ref
  ) => {
    const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={inputId} className="input-label">
            {label}
          </label>
        )}
        <div className="relative">
          {leftIcon && (
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-solaire-text-muted pointer-events-none">
              {leftIcon}
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            className={`
              input-field
              ${leftIcon ? 'pl-12' : ''}
              ${rightIcon || rightElement ? 'pr-14' : ''}
              ${error ? 'border-solaire-error focus:border-solaire-error focus:ring-solaire-error/30' : ''}
              ${className}
            `.trim()}
            {...props}
          />
          {rightIcon && !rightElement && (
            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-solaire-text-muted pointer-events-none">
              {rightIcon}
            </div>
          )}
          {rightElement && (
            <div className="absolute right-2 top-1/2 -translate-y-1/2">
              {rightElement}
            </div>
          )}
        </div>
        {error && <p className="input-error">{error}</p>}
        {hint && !error && (
          <p className="text-sm text-solaire-text-muted mt-1">{hint}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
  rightElement?: React.ReactNode;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className = '', label, error, hint, rightElement, id, ...props }, ref) => {
    const inputId = id || `textarea-${Math.random().toString(36).substr(2, 9)}`;

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={inputId} className="input-label">
            {label}
          </label>
        )}
        <div className="relative">
          <textarea
            ref={ref}
            id={inputId}
            className={`
              textarea-field
              ${rightElement ? 'pr-14' : ''}
              ${error ? 'border-solaire-error focus:border-solaire-error focus:ring-solaire-error/30' : ''}
              ${className}
            `.trim()}
            {...props}
          />
          {rightElement && (
            <div className="absolute right-2 top-2">{rightElement}</div>
          )}
        </div>
        {error && <p className="input-error">{error}</p>}
        {hint && !error && (
          <p className="text-sm text-solaire-text-muted mt-1">{hint}</p>
        )}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  hint?: string;
  options: { value: string; label: string }[];
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className = '', label, error, hint, options, id, ...props }, ref) => {
    const inputId = id || `select-${Math.random().toString(36).substr(2, 9)}`;

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={inputId} className="input-label">
            {label}
          </label>
        )}
        <select
          ref={ref}
          id={inputId}
          className={`
            select-field
            ${error ? 'border-solaire-error focus:border-solaire-error focus:ring-solaire-error/30' : ''}
            ${className}
          `.trim()}
          {...props}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {error && <p className="input-error">{error}</p>}
        {hint && !error && (
          <p className="text-sm text-solaire-text-muted mt-1">{hint}</p>
        )}
      </div>
    );
  }
);

Select.displayName = 'Select';

export default Input;
