"use client";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";

export function GoogleAuthButton() {
  const { pending } = useFormStatus();
  return <Button type="submit" className="w-full" variant="outline" disabled={pending} aria-busy={pending}>
    <svg aria-hidden="true" focusable="false" className="h-4 w-4 shrink-0" viewBox="0 0 48 48">
      <path fill="#4285F4" d="M43.61 24.46c0-1.36-.12-2.66-.35-3.92H24.4v7.43h10.77a9.2 9.2 0 0 1-3.99 6.04v5.02h6.47c3.78-3.48 5.96-8.61 5.96-14.57Z" />
      <path fill="#34A853" d="M24.4 44c5.39 0 9.91-1.79 13.25-4.97l-6.47-5.02c-1.8 1.2-4.1 1.91-6.78 1.91-5.21 0-9.63-3.52-11.21-8.26H6.5v5.18A20 20 0 0 0 24.4 44Z" />
      <path fill="#FBBC05" d="M13.19 27.66a12 12 0 0 1 0-7.32v-5.18H6.5a20 20 0 0 0 0 17.68l6.69-5.18Z" />
      <path fill="#EA4335" d="M24.4 12.08c2.93 0 5.56 1.01 7.63 2.99l5.73-5.73A19.14 19.14 0 0 0 24.4 4 20 20 0 0 0 6.5 15.16l6.69 5.18c1.58-4.74 6-8.26 11.21-8.26Z" />
    </svg>
    {pending ? "Connecting to Google…" : "Continue with Google"}
  </Button>;
}
