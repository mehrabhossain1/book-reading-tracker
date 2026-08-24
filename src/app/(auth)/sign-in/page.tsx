import { Suspense } from "react";
import type { Metadata } from "next";

import { env } from "@/lib/env";
import { AuthForm } from "@/modules/auth/components/auth-form";

export const metadata: Metadata = { title: "Sign in" };

export default function SigninPage() {
  const googleEnabled = Boolean(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET);
  return (
    <Suspense>
      <AuthForm mode="sign-in" googleEnabled={googleEnabled} />
    </Suspense>
  );
}
