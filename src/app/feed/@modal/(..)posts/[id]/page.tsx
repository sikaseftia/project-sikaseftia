import PostOverlay from "@/components/PostOverlay";

export default async function InterceptedPostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <PostOverlay id={id} />;
}
