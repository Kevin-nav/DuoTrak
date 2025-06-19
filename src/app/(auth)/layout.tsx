import React from 'react';
import AuthFooter from '@/components/layout/AuthFooter';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-off-white p-6">
      <main className="flex-grow flex items-center justify-center">{children}</main>
      <AuthFooter />
    </div>
  );
}
