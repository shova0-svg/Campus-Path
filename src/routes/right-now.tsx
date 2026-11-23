import { createFileRoute } from "@tanstack/react-router";
import { LiveClasses } from "@/components/sohoj/LiveClasses";

export const Route = createFileRoute("/right-now")({
  head: () => ({
    meta: [
      { title: "Right now on campus — Campus Path" },
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
    <div className="bg-desk min-h-dvh px-4 py-6 md:px-6 lg:flex lg:justify-center">
      <main className="w-full max-w-md md:max-w-3xl lg:max-w-5xl">
        <LiveClasses />
      </main>
    </div>
  );
}
