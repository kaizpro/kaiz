import { Card } from "@/components/ui/card";
import { AuthForm } from "@/components/auth-form";
import { resendConfirmation } from "@/app/auth/actions";

export default function ResendConfirmationPage() {
  return <div className="mx-auto grid min-h-[70vh] max-w-md place-items-center px-4 py-12">
    <Card className="w-full p-6 sm:p-8">
      <h1 className="text-2xl font-bold">Resend confirmation</h1>
      <p className="mt-2 text-sm text-muted-foreground">Request a new verification link for your account.</p>
      <div className="mt-6"><AuthForm mode="resend" action={resendConfirmation}/></div>
    </Card>
  </div>;
}
