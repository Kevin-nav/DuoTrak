'use client';

import DashboardLayout from "@/components/dashboard-layout";
import DashboardContent from "@/components/dashboard-content";
import { useUser } from "@/contexts/UserContext";
import { PartnershipGuard } from "@/components/auth/PartnershipGuard";

export default function HomePage() {
  const { userDetails } = useUser();

  // The guards will ensure userDetails is available here.
  // We can assert non-null for cleaner access.
  const currentUser = userDetails!;

  return (
    <PartnershipGuard>
      <DashboardLayout>
        <DashboardContent 
          userName={currentUser.full_name || "User"}
          streak={currentUser.current_streak} 
          hasPartner={!!currentUser.partner_id}
          partnerName={currentUser.partner_full_name || "Partner"}
          partnerInitials={currentUser.partner_full_name?.charAt(0) || "P"}
        />
      </DashboardLayout>
    </PartnershipGuard>
  );
}
