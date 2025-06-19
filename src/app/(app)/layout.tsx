import React from 'react';
import TopNavbar from '@/components/layout/TopNavbar';
import BottomNavbar from '@/components/layout/BottomNavbar';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-off-white">
      <TopNavbar />
      <main className="container mx-auto flex-grow p-6 pb-24">{children}</main>
      <BottomNavbar />
    </div>
  );
}
