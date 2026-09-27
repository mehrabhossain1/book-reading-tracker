"use client";

import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch, type UseFormRegisterReturn } from "react-hook-form";
import { toast } from "sonner";

import { PasswordInput } from "@/components/password-input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { MIN_PASSWORD_LENGTH } from "@/lib/password";
import { changeOwnPassword, setOwnPassword } from "@/modules/auth/actions";
import {
  changePasswordSchema,
  setPasswordSchema,
  type ChangePasswordValues,
  type SetPasswordValues,
} from "@/modules/auth/schema";

/**
 * Your own password, on /settings.
 *
 * Two shapes, because the accounts differ: someone who signed up with an email
 * and password proves themselves with the current one, while someone who only
 * ever used Google has no current password to give — their live session is the
 * proof. The fields, wording and submit behaviour are shared between them.
 */
export function PasswordForm({ hasPassword }: { hasPassword: boolean }) {
  return hasPassword ? <ChangePasswordForm /> : <SetPasswordForm />;
}

function PasswordField({
  id,
  label,
  autoComplete,
  field,
  error,
  description,
}: {
  id: string;
  label: string;
  autoComplete: "current-password" | "new-password";
  field: UseFormRegisterReturn;
  error?: { message?: string };
  description?: string;
}) {
  return (
    <Field data-invalid={Boolean(error)}>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <PasswordInput
        id={id}
        autoComplete={autoComplete}
        aria-invalid={Boolean(error)}
        {...field}
      />
      {description && <FieldDescription>{description}</FieldDescription>}
      <FieldError errors={[error]} />
    </Field>
  );
}

function ChangePasswordForm() {
  const router = useRouter();
  const form = useForm<ChangePasswordValues>({
    resolver: zodResolver(changePasswordSchema),
    // Only the checkbox gets a default: a default on a text field is written
    // into the DOM when the field registers, erasing anything a password
    // manager filled in before hydration. See auth-form.tsx.
    defaultValues: { signOutOtherSessions: true },
  });

  const signOutOthers = useWatch({ control: form.control, name: "signOutOtherSessions" });

  const onSubmit = form.handleSubmit(async (values) => {
    const result = await changeOwnPassword(values);

    if (!result.ok) {
      for (const [field, messages] of Object.entries(result.fieldErrors ?? {})) {
        form.setError(field as keyof ChangePasswordValues, { message: messages[0] });
      }
      toast.error(result.error);
      return;
    }

    // reset() with no argument, deliberately: React Hook Form only clears the
    // DOM (via the native form.reset()) when it is called with nothing. Passing
    // values updates its own state and leaves the typed characters on screen —
    // three passwords left sitting in the fields.
    form.reset();
    toast.success(
      result.data.signedOutOthers
        ? "Password changed. Your other devices have been signed out."
        : "Password changed.",
    );
    router.refresh();
  });

  return (
    <form onSubmit={onSubmit} noValidate>
      <FieldGroup>
        <PasswordField
          id="currentPassword"
          label="Current password"
          autoComplete="current-password"
          field={form.register("currentPassword")}
          error={form.formState.errors.currentPassword}
        />
        <PasswordField
          id="newPassword"
          label="New password"
          autoComplete="new-password"
          field={form.register("newPassword")}
          error={form.formState.errors.newPassword}
          description={`At least ${MIN_PASSWORD_LENGTH} characters.`}
        />
        <PasswordField
          id="confirmPassword"
          label="Repeat new password"
          autoComplete="new-password"
          field={form.register("confirmPassword")}
          error={form.formState.errors.confirmPassword}
        />

        <Field orientation="horizontal">
          <Checkbox
            id="signOutOtherSessions"
            checked={signOutOthers}
            onCheckedChange={(checked) =>
              form.setValue("signOutOtherSessions", checked === true)
            }
          />
          <FieldLabel htmlFor="signOutOtherSessions" className="font-normal">
            Sign out my other devices
          </FieldLabel>
        </Field>

        <Button type="submit" size="lg" className="w-full sm:w-auto" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? "Saving…" : "Change password"}
        </Button>
      </FieldGroup>
    </form>
  );
}

function SetPasswordForm() {
  const router = useRouter();
  const form = useForm<SetPasswordValues>({ resolver: zodResolver(setPasswordSchema) });

  const onSubmit = form.handleSubmit(async (values) => {
    const result = await setOwnPassword(values);

    if (!result.ok) {
      for (const [field, messages] of Object.entries(result.fieldErrors ?? {})) {
        form.setError(field as keyof SetPasswordValues, { message: messages[0] });
      }
      toast.error(result.error);
      return;
    }

    form.reset(); // see the note in ChangePasswordForm
    toast.success("Password set. You can now sign in with your email as well.");
    router.refresh();
  });

  return (
    <form onSubmit={onSubmit} noValidate>
      <FieldGroup>
        <PasswordField
          id="newPassword"
          label="New password"
          autoComplete="new-password"
          field={form.register("newPassword")}
          error={form.formState.errors.newPassword}
          description={`At least ${MIN_PASSWORD_LENGTH} characters.`}
        />
        <PasswordField
          id="confirmPassword"
          label="Repeat new password"
          autoComplete="new-password"
          field={form.register("confirmPassword")}
          error={form.formState.errors.confirmPassword}
        />

        <Button type="submit" size="lg" className="w-full sm:w-auto" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? "Saving…" : "Set password"}
        </Button>
      </FieldGroup>
    </form>
  );
}
