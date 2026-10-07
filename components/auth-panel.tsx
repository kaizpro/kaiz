import type { ReactNode } from "react";
import { Card } from "@/components/ui/card";

export function AuthPanel({ children }: { children: ReactNode }) {
  return <div className="mx-auto grid min-h-[65vh] w-full max-w-md place-items-center px-4 py-10 sm:py-12">
    <Card className="w-full p-6 sm:p-8">{children}</Card>
  </div>;
}
