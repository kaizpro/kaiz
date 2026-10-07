import { AuthPanel } from "@/components/auth-panel";
import { AuthForm } from "@/components/auth-form";
import { resetPassword } from "@/app/auth/actions";

export default function ResetPage() {
  return <AuthPanel><h1 className="text-2xl font-bold">Reset password</h1><p className="mt-2 text-sm text-muted-foreground">Request a secure recovery link for your email.</p><div className="mt-6"><AuthForm mode="reset" action={resetPassword} /></div></AuthPanel>;
}
