import { createFileRoute } from "@tanstack/react-router";
import { TeacherDirectory } from "@/components/sohoj/TeacherDirectory";
import { INSTITUTES } from "@/lib/campus-data";

export const Route = createFileRoute("/teachers")({
  head: () => ({
    meta: [
      { title: "Teachers — Campus Path" },
      {
        name: "description",
        content: "Department-wise faculty directory of Rajshahi Govt. Polytechnic Institute.",
      },
    ],
  }),
  component: TeachersPage,
});

function TeachersPage() {
  return (
    <div className="bg-desk min-h-dvh px-4 pb-[calc(7rem+env(safe-area-inset-bottom))] pt-6 md:px-6 lg:flex lg:justify-center">
      <main className="w-full max-w-md md:max-w-3xl lg:max-w-5xl">
        <TeacherDirectory instituteName={INSTITUTES[0].name} />
      </main>
    </div>
  );
}
