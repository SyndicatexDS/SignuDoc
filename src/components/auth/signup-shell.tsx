"use client";

import Link from "next/link";
import {
  useState,
  type ChangeEvent,
  type ChangeEventHandler,
  type FormEvent,
} from "react";
import { Eye, EyeOff, Loader2 } from "lucide-react";

import { SsoButton, type SsoOption } from "@/components/auth/sso-button";
import { PanelAuthLayout } from "@/components/auth/panel-auth-layout";
import { authClient } from "@/lib/auth/client";
import {
  describePasswordRefusal,
  newPasswordLengthError,
  PASSWORD_TOO_SHORT_MESSAGE,
} from "@/lib/password-messages";
import { signUpSchema } from "@/lib/schemas/auth";

const defaultSuccessMessage = "Check your email to verify your sender account.";
// With no email provider connected, the verification email cannot be sent.
const SIGNUP_EMAIL_NOT_CONNECTED_MESSAGE =
  "Your account is created, but this site can't send email yet, so the email that verifies your address couldn't be sent. Ask an administrator to finish email setup in Settings, Organization. Once it's set up, log in and the verification email will be sent.";

type AuthErrorLike = {
  code?: string;
  message?: string;
};

// Codes the server answers with when this install's sign-up rule turns an
// address away.
const SIGNUP_RULE_ERROR_CODES = new Set([
  "setup_required",
  "signup_closed",
  "signup_domain_not_allowed",
]);

type SignupShellProps = {
  /** False when the install has no email provider to send with. */
  emailConnected?: boolean;
  /** False when password sign-in is turned off, so accounts come from SSO. */
  passwordSignIn?: boolean;
  /** Single sign-on, when the install has it (lib/auth/sso.ts). */
  sso?: SsoOption | null;
  /** False when this install is not taking new accounts at all. */
  signupAvailable?: boolean;
  /** One sentence on who can create an account, or null when anyone can. */
  signupRule?: string | null;
};

type SignupFormValues = {
  email: string;
  fullName: string;
  password: string;
};

type SignupFormErrors = Partial<Record<keyof SignupFormValues, string>>;

function createSignupFormValues(): SignupFormValues {
  return {
    email: "",
    fullName: "",
    password: "",
  };
}

function trimFormValues(values: SignupFormValues): SignupFormValues {
  return {
    email: values.email.trim(),
    fullName: values.fullName.trim(),
    password: values.password,
  };
}

function normalizeAuthErrorMessage(
  error: AuthErrorLike | null | undefined,
): string {
  return error?.message?.trim().toLowerCase() ?? "";
}

type SignupFormCardProps = {
  bannerMessage: string | null;
  errors: SignupFormErrors;
  formLocked: boolean;
  isResendingVerification?: boolean;
  isSubmitting: boolean;
  onEmailChange: ChangeEventHandler<HTMLInputElement>;
  onFullNameChange: ChangeEventHandler<HTMLInputElement>;
  onPasswordChange: ChangeEventHandler<HTMLInputElement>;
  onResendVerification?: () => void | Promise<void>;
  onSsoError: (message: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void | Promise<void>;
  passwordSignIn: boolean;
  showSuccess: boolean;
  signupRule: string | null;
  sso: SsoOption | null;
  successMessage: string | null;
  values: SignupFormValues;
};

function SignupFormCard({
  bannerMessage,
  errors,
  formLocked,
  isResendingVerification = false,
  isSubmitting,
  onEmailChange,
  onFullNameChange,
  onPasswordChange,
  onResendVerification,
  onSsoError,
  onSubmit,
  passwordSignIn,
  showSuccess,
  signupRule,
  sso,
  successMessage,
  values,
}: SignupFormCardProps) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="space-y-6">
      {/* Logo */}
      <div className="flex justify-center">
        <img
          src="https://panel.rustlabs.io/images/rustlabs-logo.png"
          alt="RustLabs"
          className="h-10 w-auto object-contain brightness-110 drop-shadow"
        />
      </div>

      {/* Header */}
      <div className="text-center">
        <h2 className="text-xl font-bold tracking-[0.14em] text-white uppercase">
          CREATE FREE ACCOUNT
        </h2>
        {signupRule ? (
          <p className="mt-2 text-xs text-gray-400">{signupRule}</p>
        ) : null}
      </div>

      {/* Alert Banner */}
      {bannerMessage ? (
        <div
          className="rounded-lg bg-red-950/60 border border-red-800/80 p-3.5 text-xs text-red-200"
          role="alert"
        >
          {bannerMessage}
        </div>
      ) : null}

      {/* Success Banner */}
      {showSuccess ? (
        <div
          aria-live="polite"
          className="rounded-lg bg-emerald-950/60 border border-emerald-800/80 p-4 text-xs text-emerald-200 space-y-3"
        >
          <p>{successMessage ?? defaultSuccessMessage}</p>
          <div className="flex flex-col gap-2 pt-2">
            <Link
              href="/login"
              className="w-full py-3 px-4 bg-gradient-to-r from-[#1034df] to-[#165cff] text-white font-bold text-xs tracking-widest uppercase rounded-lg text-center shadow-[0_4px_15px_rgba(16,52,223,0.4)]"
            >
              Go to sign in
            </Link>
            {onResendVerification ? (
              <button
                type="button"
                disabled={formLocked}
                onClick={onResendVerification}
                className="w-full py-2.5 px-4 bg-[#1a1a1a] border border-[#2e2e2e] text-gray-300 hover:text-white hover:border-gray-500 font-semibold text-xs uppercase tracking-wider rounded-lg transition-colors cursor-pointer"
              >
                {isResendingVerification
                  ? "Sending..."
                  : "Resend verification email"}
              </button>
            ) : null}
          </div>
        </div>
      ) : null}

      {/* SSO Button */}
      {sso && !showSuccess ? (
        <SsoButton
          onError={onSsoError}
          sso={sso}
          variant={passwordSignIn ? "secondary" : "primary"}
        />
      ) : null}

      {sso && passwordSignIn && !showSuccess ? (
        <div className="relative flex items-center justify-center">
          <div className="w-full border-t border-[#2a2a2a]" />
          <span className="absolute bg-[#111111] px-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
            or
          </span>
        </div>
      ) : null}

      {/* Form Fields */}
      {passwordSignIn && !showSuccess ? (
        <form className="space-y-4" noValidate onSubmit={onSubmit}>
          {/* Full Name */}
          <div className="space-y-1.5">
            <label
              htmlFor="signup-full-name"
              className="text-xs font-semibold uppercase tracking-wider text-gray-400"
            >
              Full name
            </label>
            <input
              id="signup-full-name"
              name="signup-full-name"
              type="text"
              autoComplete="name"
              disabled={formLocked}
              readOnly={formLocked}
              placeholder="Jane Smith"
              value={values.fullName}
              onChange={onFullNameChange}
              className="w-full rounded-lg bg-[#1a1a1a] border border-[#2e2e2e] px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#1034df] focus:ring-1 focus:ring-[#1034df] transition-colors"
            />
            {errors.fullName ? (
              <p className="text-xs text-red-400 mt-1">{errors.fullName}</p>
            ) : null}
          </div>

          {/* Email */}
          <div className="space-y-1.5">
            <label
              htmlFor="signup-email"
              className="text-xs font-semibold uppercase tracking-wider text-gray-400"
            >
              Email Address
            </label>
            <input
              id="signup-email"
              name="signup-email"
              type="email"
              autoComplete="email"
              disabled={formLocked}
              readOnly={formLocked}
              placeholder="jane@company.com"
              value={values.email}
              onChange={onEmailChange}
              className="w-full rounded-lg bg-[#1a1a1a] border border-[#2e2e2e] px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#1034df] focus:ring-1 focus:ring-[#1034df] transition-colors"
            />
            {errors.email ? (
              <p className="text-xs text-red-400 mt-1">{errors.email}</p>
            ) : null}
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <label
              htmlFor="signup-password"
              className="text-xs font-semibold uppercase tracking-wider text-gray-400"
            >
              Password
            </label>
            <div className="relative">
              <input
                id="signup-password"
                name="signup-password"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                disabled={formLocked}
                readOnly={formLocked}
                placeholder="Enter a secure password"
                value={values.password}
                onChange={onPasswordChange}
                className="w-full rounded-lg bg-[#1a1a1a] border border-[#2e2e2e] pl-4 pr-11 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#1034df] focus:ring-1 focus:ring-[#1034df] transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors cursor-pointer p-1"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
            <p className="text-[11px] text-gray-500">
              Must be at least 15 characters
            </p>
            {errors.password ? (
              <p className="text-xs text-red-400 mt-1">{errors.password}</p>
            ) : null}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={formLocked}
            className="w-full mt-2 py-3.5 px-4 bg-gradient-to-r from-[#1034df] to-[#165cff] hover:from-[#0d2bb8] hover:to-[#124cd4] text-white font-bold text-xs tracking-widest uppercase rounded-lg shadow-[0_4px_15px_rgba(16,52,223,0.4)] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>CREATING ACCOUNT...</span>
              </>
            ) : (
              "SIGN UP"
            )}
          </button>
        </form>
      ) : null}

      {/* Footer Link */}
      <div className="text-center text-xs text-gray-400 pt-4 border-t border-[#222222]">
        Already have an account?{" "}
        <Link
          href="/login"
          className="text-white hover:text-blue-400 font-semibold underline-offset-4 hover:underline transition-colors ml-1"
        >
          Sign in
        </Link>
      </div>
    </div>
  );
}

export function SignupShell({
  emailConnected = true,
  passwordSignIn = true,
  signupAvailable = true,
  signupRule = null,
  sso = null,
}: SignupShellProps) {
  return (
    <PanelAuthLayout>
      {!signupAvailable ? (
        <SignupClosedCard />
      ) : (
        <LiveSignupShell
          emailConnected={emailConnected}
          passwordSignIn={passwordSignIn || !sso}
          signupRule={signupRule}
          sso={sso}
        />
      )}
    </PanelAuthLayout>
  );
}

function SignupClosedCard() {
  return (
    <div className="space-y-6">
      <div className="flex justify-center">
        <img
          src="https://panel.rustlabs.io/images/rustlabs-logo.png"
          alt="RustLabs"
          className="h-10 w-auto object-contain brightness-110 drop-shadow"
        />
      </div>
      <div className="text-center space-y-2">
        <h2 className="text-xl font-bold tracking-[0.14em] text-white uppercase">
          SIGN-UP IS CLOSED
        </h2>
        <p className="text-xs text-gray-400 leading-relaxed">
          New accounts are not being accepted on this site right now. If you were
          sent a document to sign, use the link in that email. You do not need an
          account to sign.
        </p>
      </div>
      <Link
        href="/login"
        className="block w-full py-3.5 px-4 bg-gradient-to-r from-[#1034df] to-[#165cff] text-white font-bold text-xs tracking-widest uppercase rounded-lg text-center shadow-[0_4px_15px_rgba(16,52,223,0.4)]"
      >
        Go to sign in
      </Link>
    </div>
  );
}

function LiveSignupShell({
  emailConnected,
  passwordSignIn,
  signupRule,
  sso,
}: {
  emailConnected: boolean;
  passwordSignIn: boolean;
  signupRule: string | null;
  sso: SsoOption | null;
}) {
  const [values, setValues] = useState<SignupFormValues>(
    createSignupFormValues(),
  );
  const [errors, setErrors] = useState<SignupFormErrors>({});
  const [bannerMessage, setBannerMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResendingVerification, setIsResendingVerification] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successEmail, setSuccessEmail] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  function handleChange(field: keyof SignupFormValues) {
    return (event: ChangeEvent<HTMLInputElement>) => {
      const nextValue = event.target.value;

      setValues((currentValues) => ({
        ...currentValues,
        [field]: nextValue,
      }));

      setErrors((currentErrors) => ({
        ...currentErrors,
        [field]: undefined,
      }));
      setBannerMessage(null);
      setShowSuccess(false);
      setSuccessMessage(null);
    };
  }

  async function handleResendVerification() {
    if (!successEmail || isResendingVerification) {
      return;
    }

    setBannerMessage(null);
    setIsResendingVerification(true);

    try {
      const response = await fetch("/api/auth/send-verification-email", {
        body: JSON.stringify({
          callbackURL: `${window.location.origin}/dashboard`,
          email: successEmail,
        }),
        headers: {
          "content-type": "application/json",
        },
        method: "POST",
      });

      if (!response.ok) {
        setBannerMessage("We couldn't resend the verification email.");
        return;
      }

      setSuccessMessage("Verification email sent. Check your inbox.");
    } catch {
      setBannerMessage("We couldn't resend the verification email.");
    } finally {
      setIsResendingVerification(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isSubmitting || isResendingVerification) {
      return;
    }

    const formData = new FormData(event.currentTarget);
    const trimmedValues = trimFormValues({
      email: String(formData.get("signup-email") ?? values.email),
      fullName: String(formData.get("signup-full-name") ?? values.fullName),
      password: String(formData.get("signup-password") ?? values.password),
    });
    const validationResult = signUpSchema.safeParse(trimmedValues);

    if (!validationResult.success) {
      const nextErrors: SignupFormErrors = {};

      for (const issue of validationResult.error.issues) {
        const field = issue.path[0];

        if (field === "email") {
          nextErrors.email = "Enter a valid email address";
        }

        if (field === "fullName") {
          nextErrors.fullName = "Enter your full name";
        }

        if (field === "password") {
          nextErrors.password =
            newPasswordLengthError(trimmedValues.password) ??
            PASSWORD_TOO_SHORT_MESSAGE;
        }
      }

      setValues(trimmedValues);
      setErrors(nextErrors);
      setBannerMessage(null);
      setShowSuccess(false);
      setSuccessMessage(null);
      return;
    }

    setValues(validationResult.data);
    setErrors({});
    setBannerMessage(null);
    setShowSuccess(false);
    setSuccessMessage(null);
    setIsSubmitting(true);

    const result = await authClient.signUp.email({
      callbackURL: `${window.location.origin}/dashboard`,
      email: validationResult.data.email,
      name: validationResult.data.fullName,
      password: validationResult.data.password,
    });

    if (result.error) {
      const normalizedErrorMessage = normalizeAuthErrorMessage(result.error);

      if (SIGNUP_RULE_ERROR_CODES.has(result.error.code ?? "")) {
        setBannerMessage(
          result.error.message ?? "New accounts are not being accepted.",
        );
      } else if (
        normalizedErrorMessage.includes("user already exists") ||
        normalizedErrorMessage.includes("use another email")
      ) {
        setErrors({
          email: "This email is already registered",
        });
      } else if (describePasswordRefusal(result.error)) {
        setErrors({
          password: describePasswordRefusal(result.error)!,
        });
      } else {
        setBannerMessage("Something went wrong. Please try again.");
      }

      setIsSubmitting(false);
      return;
    }

    setSuccessEmail(validationResult.data.email);
    setSuccessMessage(
      emailConnected
        ? defaultSuccessMessage
        : SIGNUP_EMAIL_NOT_CONNECTED_MESSAGE,
    );
    setShowSuccess(true);
    setIsSubmitting(false);
  }

  return (
    <SignupFormCard
      bannerMessage={bannerMessage}
      errors={errors}
      formLocked={isSubmitting || isResendingVerification}
      isResendingVerification={isResendingVerification}
      isSubmitting={isSubmitting}
      onEmailChange={handleChange("email")}
      onFullNameChange={handleChange("fullName")}
      onPasswordChange={handleChange("password")}
      onResendVerification={
        emailConnected ? handleResendVerification : undefined
      }
      onSsoError={setBannerMessage}
      onSubmit={handleSubmit}
      passwordSignIn={passwordSignIn}
      showSuccess={showSuccess}
      signupRule={signupRule}
      sso={sso}
      successMessage={successMessage}
      values={values}
    />
  );
}
