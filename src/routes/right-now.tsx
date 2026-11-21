import { createFileRoute } from "@tanstack/react-router";
import { LiveClasses } from "@/components/sohoj/LiveClasses";

export const Route = createFileRoute("/right-now")({
  head: () => ({
    meta: [
      { title: "Right now on campus — Sohoj Rasta" },
      {
        name: "description",
        content: "Live class schedule: what is happening on campus right now.",
      },
    ],
  }),
  component: RightNowPage,
});

function RightNowPage() {
  return (
    <div className="bg-desk min-h-dvh px-4 py-6 lg:flex lg:justify-center">
      <main className="w-full max-w-md">
        <LiveClasses />
      </main>
    </div>
  );
}
