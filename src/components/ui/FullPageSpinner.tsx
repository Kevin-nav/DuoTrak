import React from 'react';

export default function FullPageSpinner() {
  return (
    <div className="flex items-center justify-center h-screen bg-background-light">
      <div className="animate-spin rounded-full h-32 w-32 border-t-4 border-b-4 border-primary-blue"></div>
    </div>
  );
}
