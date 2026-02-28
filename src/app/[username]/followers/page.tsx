import { FollowersList } from "@/components/profile/FollowersList";

export default function FollowersPage({ params }: { params: Promise<{ username: string }> }) {
  return async function () {
    const { username } = await params;
    return <FollowersList username={username} />;
  }();
}
