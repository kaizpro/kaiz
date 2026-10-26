// Component interaction fixture ONLY. No database, Auth or publication endpoint.
import { useState } from "react";
import { createRoot } from "react-dom/client";
import { ResultSetForm, ResultsPublicationForm } from "@/components/admin/result-forms";

function Fixture() {
  const [published, setPublished] = useState(false);
  const [payload, setPayload] = useState("");
  return <main className="mx-auto max-w-xl space-y-6 p-5">
    <h1 className="text-xl font-bold">Local publication controls QA</h1>
    <p>Component fixture only — no Auth, database or production requests.</p>
    <section aria-label="Publication controls" className="space-y-3 rounded-md border p-4">
      <p>Synthetic final standings · {published ? "published" : "draft"}</p>
      <ResultsPublicationForm resultSetId="ad000000-0000-4000-8000-000000000001" published={published} action={async (_, data) => {
        setPayload(JSON.stringify(Object.fromEntries(data)));
        setPublished(data.get("published") === "true");
        return { success: "Local action payload inspected. No database write." };
      }}/>
      <output aria-label="Submitted fields" className="block break-all font-mono text-xs">{payload}</output>
    </section>
    <section aria-label="Metadata editor"><ResultSetForm action={async () => ({ success: "Local metadata form only." })}/></section>
  </main>;
}
createRoot(document.getElementById("qa-root")!).render(<Fixture/>);
