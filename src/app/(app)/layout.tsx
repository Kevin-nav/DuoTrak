'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import TopNavbar from '@/components/layout/TopNavbar';
import BottomNavbar from '@/components/layout/BottomNavbar';
import FloatingChatButton from '@/components/layout/FloatingChatButton';
import NotificationToastListener from '@/components/NotificationToastListener';
import { RouteGuard } from '@/components/auth/RouteGuard';
import { InvitationProvider } from '@/contexts/invitation-context';
import { useUser } from '@/contexts/UserContext';
import { Users, Lock, User } from 'lucide-react';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { userDetails, isLoading } = useUser();
  const isFullscreenPartnerChat = pathname.startsWith('/partner/chat');
  const hasPartner = !!userDetails?.partner_id;

  const partnerBypassPaths = [
    '/invite-partner',
    '/invite-partner/pending',
    '/onboarding/start',
    '/onboarding/inviter',
    '/profile',
  ];

  const isPartnerBypassPath = partnerBypassPaths.some((path) => pathname === path || pathname.startsWith(`${path}/`));
  const shouldShowPartnerOverlay =
    !isLoading &&
    !!userDetails &&
    !hasPartner &&
    !isPartnerBypassPath;

  return (
    <RouteGuard>
      <InvitationProvider>
        <div className="min-h-screen bg-landing-cream">
          <NotificationToastListener />
          {!isFullscreenPartnerChat ? <TopNavbar /> : null}
          <main
            className={
              isFullscreenPartnerChat
                ? 'relative min-h-screen'
                : 'relative container mx-auto flex-grow px-4 pb-24 pt-20 sm:px-6 lg:px-8'
            }
          >
            {children}
            <FloatingChatButton partnerId={userDetails?.partner_id ?? null} />

            {shouldShowPartnerOverlay ? (
              <div className="fixed inset-0 z-[80] flex items-start justify-center bg-black/35 p-4 pt-24 backdrop-blur-[2px] sm:pt-28">
                <div className="w-full max-w-md rounded-2xl border border-landing-clay bg-white p-6 shadow-xl">
                  <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-landing-cream">
                    <Lock className="h-5 w-5 text-landing-terracotta" />
                  </div>
                  <h2 className="text-center text-xl font-black tracking-tight text-landing-espresso">Partner Required</h2>
                  <p className="mt-2 text-center text-sm leading-relaxed text-landing-espresso-light">
                    Your account is ready, but partner features are locked until you invite and connect with a partner.
                  </p>

                  <div className="mt-5 grid grid-cols-1 gap-2 sm:grid-cols-2">
                    <Link
                      href="/invite-partner"
                      className="inline-flex items-center justify-center gap-2 rounded-xl bg-landing-terracotta px-4 py-2.5 text-sm font-bold text-white hover:bg-landing-espresso"
                    >
                      <Users className="h-4 w-4" />
                      Invite Partner
                    </Link>
                    <Link
                      href="/profile"
                      className="inline-flex items-center justify-center gap-2 rounded-xl border border-landing-clay px-4 py-2.5 text-sm font-semibold text-landing-espresso-light hover:bg-landing-cream"
                    >
                      <User className="h-4 w-4" />
                      Go to Profile
                    </Link>
                  </div>
                </div>
              </div>
            ) : null}
          </main>
          {!isFullscreenPartnerChat ? <BottomNavbar /> : null}
        </div>
      </InvitationProvider>
    </RouteGuard>
  );
}
