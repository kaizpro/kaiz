import { AuthPanel } from "@/components/auth-panel";
import { AuthForm } from "@/components/auth-form";
import { GoogleAuthButton } from "@/components/google-auth-button";
import { register, signInWithGoogle } from "@/app/auth/actions";

export default function RegisterPage() {
  return <AuthPanel>
    <p className="font-mono text-xs uppercase tracking-[.16em] text-primary">Join the field</p>
    <h1 className="mt-2 text-2xl font-bold">Create your account</h1>
    <p className="mt-2 text-sm text-muted-foreground">Use a real email — verification is required.</p>
    <div className="mt-6"><AuthForm mode="register" action={register} /></div>
    <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground"><span className="h-px flex-1 bg-border" />or<span className="h-px flex-1 bg-border" /></div>
    <form action={signInWithGoogle}><GoogleAuthButton /></form>
  </AuthPanel>;
}
