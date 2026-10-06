import { ProblemForm } from "@/components/admin/problem-form";
import { createProblem } from "@/app/admin/problems/actions";
import { listProblemCompetitions } from "@/lib/data/admin-problems";

export default async function NewProblem() {
  const competitions = await listProblemCompetitions();
  return <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6"><h1 className="text-3xl font-bold">New archive problem</h1><p className="mt-2 text-sm text-muted-foreground">New problems start as drafts unless explicitly published.</p><div className="mt-8 border bg-card p-4 sm:p-6"><ProblemForm action={createProblem} competitions={competitions}/></div></main>;
}
