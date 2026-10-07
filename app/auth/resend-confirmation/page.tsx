import { AuthPanel } from "@/components/auth-panel";
import { AuthForm } from "@/components/auth-form";
import { resendConfirmation } from "@/app/auth/actions";

export default function ResendConfirmationPage() {
  return <AuthPanel>
      <h1 className="text-2xl font-bold">Resend confirmation</h1>
      <p className="mt-2 text-sm text-muted-foreground">Request a new verification link for your account.</p>
      <div className="mt-6"><AuthForm mode="resend" action={resendConfirmation}/></div>
  </AuthPanel>;
}
