'use client';

import { useEffect } from 'react';
import InviteeOnboardingFlow from '@/components/onboarding/InviteeOnboardingFlow';
import { trackEvent } from '@/lib/analytics/events';

export default function InviteeOnboardingPage() {
  useEffect(() => {
    trackEvent('onboarding_started', {
      entry_point: 'invitee_onboarding_start',
    });
  }, []);

  return <InviteeOnboardingFlow />;
}
