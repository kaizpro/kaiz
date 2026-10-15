import plan from "@/content/learning/beginner-source-plan.json";

export function BeginnerSourcePlan() {
  const at = (cell: string) => plan.cells.find(entry => entry.cell === cell);
  const rows = [3, 5, 6, 7, 8, 9, 10, 11];
  return <details className="rounded-[5px] border bg-card p-4 sm:p-5"><summary className="cursor-pointer text-sm font-bold focus-visible:outline-2 focus-visible:outline-primary">Original mentor plan · order, parallel maths and later CV/NLP</summary>
    <p className="mt-4 max-w-3xl text-sm leading-6 text-muted-foreground">Maths and programming/ML run in parallel, not as consecutive prerequisites. The original June–October headings describe the source plan, not your deadline. Its Yes/No flags mean theory/practice availability, not completed study. Some provider pages are unavailable or account-restricted.</p>
    <div className="mt-4 grid gap-5 lg:grid-cols-2">{rows.filter(row => row !== 7).map(row => {
      const entries = plan.cells.filter(c => Number(c.cell.replace(/^[A-Z]+/, "")) === row && c.cell !== `A${row}` && c.value !== "Yes" && c.value !== "No" && c.value !== "NLP" && c.value !== "CV");
      return <section key={row}><h3 className="text-sm font-semibold">{row === 3 ? "Parallel maths lane (row 3)" : row === 5 ? "Programming / ML sequence (row 5)" : row === 6 ? "Exercises alongside programming (row 6)" : `Later CV / NLP selections (row ${row})`}</h3><ol className="mt-2 space-y-2">{entries.map(entry => <li key={entry.cell} className="text-sm leading-6"><span className="mr-2 font-mono text-xs text-muted-foreground">{entry.cell}</span><span>{entry.value}</span>{entry.url && <span className="ml-2 text-xs text-muted-foreground">({new URL(entry.url).hostname})</span>}</li>)}</ol></section>;
    })}</div>
    <p className="mt-4 text-xs leading-5 text-muted-foreground">Additional selections: {at("F7")?.value}; {at("G7")?.value}. CV and NLP theory/practice flags and all original hyperlinks are retained in the source, without interpreting them as saved progress.</p>
    <a href={plan.source} target="_blank" rel="noopener noreferrer" className="mt-4 inline-flex min-h-11 items-center text-sm font-semibold text-primary underline underline-offset-4">Open the original plan<span className="sr-only"> (new tab)</span></a>
  </details>;
}
