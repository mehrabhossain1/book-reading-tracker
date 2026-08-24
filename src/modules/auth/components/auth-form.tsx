"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { authClient } from "@/lib/auth-client";
import {
  signInSchema,
  signUpSchema,
  type SignInValues,
  type SignUpValues,
} from "@/modules/auth/schema";

type Mode = "sign-in" | "sign-up";

const COPY = {
  "sign-in": {
    heading: "Welcome back",
    submit: "Sign in",
    footer: "Don't have an account?",
    footerAction: "Sign up",
    footerHref: "/sign-up",
  },
  "sign-up": {
    heading: "Create your account",
    submit: "Create account",
    footer: "Already have an account?",
    footerAction: "Sign in",
    footerHref: "/sign-in",
  },
} as const;

export function AuthForm({ mode, googleEnabled }: { mode: Mode; googleEnabled: boolean }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [formError, setFormError] = useState<string | null>(null);
  const copy = COPY[mode];
  const next = searchParams.get("next") ?? "/library";

  const form = useForm<SignUpValues>({
    resolver: zodResolver(
      (mode === "sign-up" ? signUpSchema : signInSchema) as typeof signUpSchema,
    ),
    defaultValues: { name: "", email: "", password: "" },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    setFormError(null);

    const result =
      mode === "sign-up"
        ? await authClient.signUp.email({
            name: values.name,
            email: values.email,
            password: values.password,
          })
        : await authClient.signIn.email({
            email: values.email,
            password: (values as SignInValues).password,
          });

    if (result.error) {
      setFormError(result.error.message ?? "That didn't work. Please try again.");
      return;
    }

    router.push(next);
    router.refresh();
  });

  return (
    <div>
      <h1 className="text-center text-xl font-semibold tracking-tight">{copy.heading}</h1>

      {googleEnabled ? (
        <>
          <Button
            type="button"
            variant="outline"
            size="lg"
            className="mt-8 w-full"
            onClick={() =>
              authClient.signIn.social({ provider: "google", callbackURL: next })
            }
          >
            Continue with Google
          </Button>
          <div className="text-muted-foreground my-6 flex items-center gap-3 text-xs">
            <span className="bg-border h-px flex-1" />
            or
            <span className="bg-border h-px flex-1" />
          </div>
        </>
      ) : (
        <div className="h-8" />
      )}

      <form onSubmit={onSubmit} noValidate>
        <FieldGroup>
          {mode === "sign-up" && (
            <Field data-invalid={Boolean(form.formState.errors.name)}>
              <FieldLabel htmlFor="name">Name</FieldLabel>
              <Input
                id="name"
                autoComplete="name"
                aria-invalid={Boolean(form.formState.errors.name)}
                {...form.register("name")}
              />
              <FieldError errors={[form.formState.errors.name]} />
            </Field>
          )}

          <Field data-invalid={Boolean(form.formState.errors.email)}>
            <FieldLabel htmlFor="email">Email</FieldLabel>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              aria-invalid={Boolean(form.formState.errors.email)}
              {...form.register("email")}
            />
            <FieldError errors={[form.formState.errors.email]} />
          </Field>

          <Field data-invalid={Boolean(form.formState.errors.password)}>
            <FieldLabel htmlFor="password">Password</FieldLabel>
            <Input
              id="password"
              type="password"
              autoComplete={mode === "sign-up" ? "new-password" : "current-password"}
              aria-invalid={Boolean(form.formState.errors.password)}
              {...form.register("password")}
            />
            <FieldError errors={[form.formState.errors.password]} />
          </Field>

          {formError && (
            <Alert variant="destructive">
              <AlertDescription>{formError}</AlertDescription>
            </Alert>
          )}

          <Button type="submit" size="lg" className="w-full" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? "One moment…" : copy.submit}
          </Button>
        </FieldGroup>
      </form>

      <p className="text-muted-foreground mt-6 text-center text-sm">
        {copy.footer}{" "}
        <Link href={copy.footerHref} className="text-foreground underline underline-offset-4">
          {copy.footerAction}
        </Link>
      </p>
    </div>
  );
}
