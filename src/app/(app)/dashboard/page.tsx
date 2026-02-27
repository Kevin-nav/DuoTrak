'use client';

import DashboardLayout from "@/components/dashboard-layout";
import DashboardContent from "@/components/dashboard-content";
import { useUser } from "@/contexts/UserContext";

export default function HomePage() {
  const { userDetails } = useUser();

  // The RouteGuard now ensures userDetails and an active partnership exist.
  // We can assert non-null for cleaner access.
  const currentUser = userDetails!;

  return (
    <DashboardLayout>
      <DashboardContent
        userName={currentUser.full_name || "User"}
        streak={currentUser.shared_current_streak ?? currentUser.current_streak ?? undefined}
        hasPartner={!!currentUser.partner_id}
        partnerName={currentUser.partner_full_name || "Partner"}
      />
    </DashboardLayout>
  );
}
