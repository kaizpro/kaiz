"use client";

import { useState } from "react";
import { BrainCircuit } from "lucide-react";

// No optimizer fetch of arbitrary publisher URLs. Reviewed HTTPS media only;
// browser loading uses no referrer and failures retain the neutral placeholder.
export function CompetitionMedia({ logoUrl, heroUrl }: { logoUrl?: string; heroUrl?: string }) {
  const [failed, setFailed] = useState<Record<string, boolean>>({});
  return <>
    {heroUrl && !failed[heroUrl] && <div className="mb-5 h-36 overflow-hidden bg-muted sm:h-48">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={heroUrl} alt="" referrerPolicy="no-referrer" className="h-full w-full object-cover" onError={() => setFailed((value) => ({ ...value, [heroUrl]: true }))}/>
    </div>}
    <div className="mb-4 flex size-12 items-center justify-center bg-muted" aria-label="Competition identity">
      {logoUrl && !failed[logoUrl] ?
        // eslint-disable-next-line @next/next/no-img-element
        <img src={logoUrl} alt="" width={48} height={48} referrerPolicy="no-referrer" className="size-12 object-contain" onError={() => setFailed((value) => ({ ...value, [logoUrl]: true }))}/>
        : <BrainCircuit className="size-6 text-muted-foreground"/>}
    </div>
  </>;
}
