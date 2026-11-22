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
    <div className="bg-desk min-h-dvh px-4 py-6 lg:flex lg:justify-center">
      <main className="w-full max-w-md">
        <TeacherDirectory instituteName={INSTITUTES[0].name} />
      </main>
    </div>
  );
}
