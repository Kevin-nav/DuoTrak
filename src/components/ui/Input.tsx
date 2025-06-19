'use client';

import React from 'react';
import { twMerge } from 'tailwind-merge';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, error, ...props }, ref) => {
    const baseStyles =
      'rounded-2xl h-14 bg-pearl-gray border-2 border-transparent w-full px-4 text-base font-normal text-charcoal placeholder:text-stone-gray transition-colors duration-200 focus:outline-none focus:border-primary-blue focus:ring-2 focus:ring-primary-blue/50';

    const errorStyles = 'border-error-red border-2';

    return (
      <input
        type={type}
        className={twMerge(baseStyles, error && errorStyles, className)}
        ref={ref}
        {...props}
      />
    );
  }
);

Input.displayName = 'Input';

export default Input;
