import { redirect } from "next/navigation";

type LegacyInvitePageProps = {
  params: Promise<{ token: string }>;
};

export default async function LegacyInvitePage({ params }: LegacyInvitePageProps) {
  const { token } = await params;
  redirect(`/invite-acceptance?token=${encodeURIComponent(token)}`);
}
