import React, { createContext, useContext, useId } from 'react';
import { clsx } from 'clsx';

interface FormContextType {
  formId: string;
}

const FormContext = createContext<FormContextType | undefined>(undefined);

interface FormProps extends React.FormHTMLAttributes<HTMLFormElement> {
  children: React.ReactNode;
}

/**
 * Accessible form component with proper ARIA attributes
 */
export function Form({ children, className, ...props }: FormProps) {
  const formId = useId();

  return (
    <FormContext.Provider value={{ formId }}>
      <form
        id={formId}
        className={clsx('space-y-4', className)}
        noValidate
        {...props}
      >
        {children}
      </form>
    </FormContext.Provider>
  );
}

interface FormFieldProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * Form field wrapper component
 */
export function FormField({ children, className }: FormFieldProps) {
  return (
    <div className={clsx('space-y-2', className)}>
      {children}
    </div>
  );
}

interface FormLabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  children: React.ReactNode;
  required?: boolean;
}

/**
 * Accessible form label component
 */
export function FormLabel({ 
  children, 
  required = false, 
  className, 
  ...props 
}: FormLabelProps) {
  return (
    <label
      className={clsx(
        'text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70',
        className
      )}
      {...props}
    >
      {children}
      {required && (
        <span className="text-destructive ml-1" aria-label="required">
          *
        </span>
      )}
    </label>
  );
}

interface FormErrorProps {
  children: React.ReactNode;
  id?: string;
  className?: string;
}

/**
 * Form error message component with proper ARIA attributes
 */
export function FormError({ children, id, className }: FormErrorProps) {
  return (
    <p
      id={id}
      className={clsx('text-sm text-destructive', className)}
      role="alert"
      aria-live="polite"
    >
      {children}
    </p>
  );
}

interface FormHelperTextProps {
  children: React.ReactNode;
  id?: string;
  className?: string;
}

/**
 * Form helper text component
 */
export function FormHelperText({ children, id, className }: FormHelperTextProps) {
  return (
    <p
      id={id}
      className={clsx('text-sm text-muted-foreground', className)}
    >
      {children}
    </p>
  );
}

interface FormGroupProps {
  children: React.ReactNode;
  role?: 'group' | 'radiogroup';
  'aria-labelledby'?: string;
  'aria-describedby'?: string;
  className?: string;
}

/**
 * Form group component for related form controls
 */
export function FormGroup({ 
  children, 
  role = 'group',
  'aria-labelledby': ariaLabelledBy,
  'aria-describedby': ariaDescribedBy,
  className 
}: FormGroupProps) {
  return (
    <div
      role={role}
      aria-labelledby={ariaLabelledBy}
      aria-describedby={ariaDescribedBy}
      className={clsx('space-y-3', className)}
    >
      {children}
    </div>
  );
}

interface FormSectionProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
  className?: string;
}

/**
 * Form section component with optional title and description
 */
export function FormSection({ 
  children, 
  title, 
  description, 
  className 
}: FormSectionProps) {
  const sectionId = useId();
  const titleId = title ? `${sectionId}-title` : undefined;
  const descriptionId = description ? `${sectionId}-description` : undefined;

  return (
    <fieldset 
      className={clsx('space-y-4 border-0 p-0', className)}
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
    >
      {title && (
        <legend id={titleId} className="text-lg font-semibold">
          {title}
        </legend>
      )}
      {description && (
        <p id={descriptionId} className="text-sm text-muted-foreground">
          {description}
        </p>
      )}
      {children}
    </fieldset>
  );
}

interface FormActionsProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * Form actions container component
 */
export function FormActions({ children, className }: FormActionsProps) {
  return (
    <div className={clsx('flex gap-2 pt-4', className)}>
      {children}
    </div>
  );
}