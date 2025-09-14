import DashboardLayout from "@/components/dashboard-layout"
import DashboardContent from "@/components/dashboard-content"

export default function HomePage() {
  return (
    <DashboardLayout>
      <DashboardContent userName="Sarah" streak={5} hasPartner={false} partnerName="John Doe" partnerInitials="JD" />
    </DashboardLayout>
  )
}
