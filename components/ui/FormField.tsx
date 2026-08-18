import React, { useId } from 'react';

export interface FormFieldProps {
  children: React.ReactElement;
  className?: string;
  error?: string;
  hint?: React.ReactNode;
  id?: string;
  label: React.ReactNode;
  required?: boolean;
}

export const FormField: React.FC<FormFieldProps> = ({ children, className = '', error, hint, id, label, required }) => {
  const generatedId = useId();
  const fieldId = id ?? generatedId;
  const hintId = hint ? `${fieldId}-hint` : undefined;
  const errorId = error ? `${fieldId}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(' ') || undefined;
  const child = children as React.ReactElement<any>;

  return (
    <div className={['space-y-1.5', className].filter(Boolean).join(' ')}>
      <label htmlFor={fieldId} className="block text-xs font-semibold text-navy-600 dark:text-carbon-100">
        {label}
        {required && <span className="ml-1 text-red-600 dark:text-red-400">*</span>}
      </label>
      {React.cloneElement(child, {
        id: fieldId,
        'aria-describedby': describedBy,
        'aria-invalid': error ? true : undefined,
        required: required ?? child.props.required,
      })}
      {hint && (
        <p id={hintId} className="text-xs text-navy-500 dark:text-carbon-400">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} className="text-xs font-semibold text-red-600 dark:text-red-400">
          {error}
        </p>
      )}
    </div>
  );
};
