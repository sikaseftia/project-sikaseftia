import AuthGuard from "@/components/AuthGuard";

export default function FeedPage() {
  return (
    <AuthGuard>
      <section className="p-6 text-sm text-neutral-400">
        Feed akan dibuat di Tahap 4.
      </section>
    </AuthGuard>
  );
}
