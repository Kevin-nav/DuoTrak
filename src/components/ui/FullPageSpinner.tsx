import React from 'react';

interface FullPageSpinnerProps {
  message?: string;
}

export default function FullPageSpinner({ message }: FullPageSpinnerProps) {
  return (
    <div className="flex flex-col items-center justify-center h-screen bg-background-light">
      <div className="animate-spin rounded-full h-32 w-32 border-t-4 border-b-4 border-primary-blue"></div>
      {message && <p className="mt-4 text-stone-gray">{message}</p>}
    </div>
  );
}
