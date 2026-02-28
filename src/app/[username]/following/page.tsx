import { FollowingList } from "@/components/profile/FollowingList";

export default function FollowingPage({ params }: { params: Promise<{ username: string }> }) {
  return async function () {
    const { username } = await params;
    return <FollowingList username={username} />;
  }();
}
