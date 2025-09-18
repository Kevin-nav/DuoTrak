'use client';

import React from 'react';
import TopNavbar from '@/components/layout/TopNavbar';
import BottomNavbar from '@/components/layout/BottomNavbar';
import { RouteGuard } from '@/components/auth/RouteGuard';
import { InvitationProvider } from '@/contexts/invitation-context';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <RouteGuard>
      <InvitationProvider>
        <div className="min-h-screen bg-off-white">
          <TopNavbar />
          <main className="container mx-auto flex-grow pt-20 px-4 pb-24 sm:px-6 lg:px-8">{children}</main>
          <BottomNavbar />
        </div>
      </InvitationProvider>
    </RouteGuard>
  );
}
