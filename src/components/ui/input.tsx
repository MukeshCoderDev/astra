import * as React from "react";
import { clsx } from "clsx";
import { generateId } from "../../lib/accessibility";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  showLabel?: boolean;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ 
    className, 
    type, 
    label,
    error,
    helperText,
    showLabel = true,
    id,
    'aria-describedby': ariaDescribedBy,
    'aria-invalid': ariaInvalid,
    ...props 
  }, ref) => {
    const inputId = id || generateId('input');
    const errorId = error ? `${inputId}-error` : undefined;
    const helperTextId = helperText ? `${inputId}-helper` : undefined;
    
    const describedBy = [
      ariaDescribedBy,
      errorId,
      helperTextId
    ].filter(Boolean).join(' ') || undefined;

    const inputElement = (
      <input
        id={inputId}
        type={type}
        className={clsx(
          "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background",
          "file:border-0 file:bg-transparent file:text-sm file:font-medium",
          "placeholder:text-muted-foreground",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          "disabled:cursor-not-allowed disabled:opacity-50",
          "invalid:border-destructive invalid:ring-destructive",
          error && "border-destructive focus-visible:ring-destructive",
          className
        )}
        ref={ref}
        aria-describedby={describedBy}
        aria-invalid={ariaInvalid || !!error}
        {...props}
      />
    );

    if (!label) {
      return inputElement;
    }

    return (
      <div className="space-y-2">
        <label 
          htmlFor={inputId}
          className={clsx(
            "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
            !showLabel && "sr-only"
          )}
        >
          {label}
          {props.required && (
            <span className="text-destructive ml-1" aria-label="required">
              *
            </span>
          )}
        </label>
        {inputElement}
        {helperText && (
          <p 
            id={helperTextId}
            className="text-sm text-muted-foreground"
          >
            {helperText}
          </p>
        )}
        {error && (
          <p 
            id={errorId}
            className="text-sm text-destructive"
            role="alert"
            aria-live="polite"
          >
            {error}
          </p>
        )}
      </div>
    );
  }
);
Input.displayName = "Input";

export { Input };