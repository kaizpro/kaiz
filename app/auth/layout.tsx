import type { ReactNode } from "react";
import { AuthFooter } from "@/components/auth-footer";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return <div>{children}<AuthFooter /></div>;
}
