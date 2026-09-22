import { redirect } from "next/navigation";
import { UpdatePasswordForm } from "@/components/update-password-form";
import { getCurrentUser } from "@/lib/auth";

export default async function UpdatePasswordPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/auth/reset-password");
  }

  return <UpdatePasswordForm />;
}
