import { z } from "zod";
import { notFound } from "next/navigation";
import { ProblemForm } from "@/components/admin/problem-form";
import { updateProblem } from "@/app/admin/problems/actions";
import { getAdminProblem, listProblemCompetitions } from "@/lib/data/admin-problems";

export default async function EditProblem({ params, searchParams }: {
  params: Promise<{ id: string }>; searchParams: Promise<{ saved?: string }>;
}) {
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();
  const [problem, competitions, query] = await Promise.all([getAdminProblem(id), listProblemCompetitions(), searchParams]);
  if (!problem) notFound();
  return <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6"><h1 className="text-3xl font-bold">Edit archive problem</h1>{query.saved === "1" && <p role="status" className="mt-4 text-sm text-success">Problem saved.</p>}<div className="mt-8 border bg-card p-4 sm:p-6"><ProblemForm key={problem.updated_at ?? problem.id} action={updateProblem.bind(null, id)} problem={problem} competitions={competitions}/></div></main>;
}
