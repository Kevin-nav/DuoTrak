'use client';

import { useUser } from '@/contexts/UserContext';
import FullPageSpinner from '@/components/ui/FullPageSpinner';
import PartnerChatSurface from '@/components/partner/PartnerChatSurface';

export default function PartnerChatFullscreenPage() {
  const { userDetails, isLoading } = useUser();

  if (isLoading || !userDetails) {
    return <FullPageSpinner />;
  }

  const partnerName = userDetails.partner_nickname || userDetails.partner_full_name || 'Partner';
  const partnerInitials = partnerName
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <PartnerChatSurface
      mode="fullscreen"
      partnerId={userDetails.partner_id || undefined}
      partnershipId={userDetails.partnership_id || undefined}
      partnerName={partnerName}
      partnerAvatar={userDetails.partner_profile_picture_url || undefined}
      partnerInitials={partnerInitials}
    />
  );
}
