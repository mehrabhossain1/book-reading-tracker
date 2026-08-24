import { Suspense } from "react";
import type { Metadata } from "next";

import { env } from "@/lib/env";
import { AuthForm } from "@/modules/auth/components/auth-form";

export const metadata: Metadata = { title: "Sign up" };

export default function SignupPage() {
  const googleEnabled = Boolean(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET);
  return (
    <Suspense>
      <AuthForm mode="sign-up" googleEnabled={googleEnabled} />
    </Suspense>
  );
}
