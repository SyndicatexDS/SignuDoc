"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type ChangeEvent, type FormEvent } from "react";
import { Eye, EyeOff, Loader2 } from "lucide-react";

import { useBranding } from "@/components/layout/branding-provider";
import {
  describeSsoError,
  SsoButton,
  type SsoOption,
} from "@/components/auth/sso-button";
import { PanelAuthLayout } from "@/components/auth/panel-auth-layout";
import { authClient } from "@/lib/auth/client";
import {
  describePasswordRefusal,
  newPasswordLengthError,
  PASSWORD_TOO_LONG_MESSAGE,
} from "@/lib/password-messages";
import { forgotPasswordSchema, loginSchema } from "@/lib/schemas/auth";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const verificationRequiredMessage =
  "Verify your email before logging in. Check your inbox for a fresh link.";

type AuthErrorLike = {
  code?: string;
  message?: string;
};

type LoginFormValues = {
  email: string;
  password: string;
};

type ForgotPasswordFormValues = {
  email: string;
};

type LoginFormErrors = Partial<Record<keyof LoginFormValues, string>>;
type ForgotPasswordFormErrors = Partial<
  Record<keyof ForgotPasswordFormValues, string>
>;

type LoginShellProps = {
  /** "on", "off", or "fallback": off, but a few addresses may still use one. */
  passwordSignIn?: "fallback" | "off" | "on";
  resetError?: string | null;
  resetToken?: string | null;
  sso?: SsoOption | null;
  /** The ?error= single sign-on came back with. */
  ssoError?: string | null;
};

type ForgotPasswordModel = {
  bannerMessage: string | null;
  errors: ForgotPasswordFormErrors;
  isOpen: boolean;
  isSubmitting: boolean;
  successMessage: string | null;
  values: ForgotPasswordFormValues;
};

function createLoginFormValues(): LoginFormValues {
  return {
    email: "",
    password: "",
  };
}

function createForgotPasswordValues(
  email: string,
  trim = false,
): ForgotPasswordFormValues {
  return {
    email: trim ? email.trim() : email,
  };
}

function createForgotPasswordModel(
  email: string,
  overrides: Partial<Omit<ForgotPasswordModel, "values">> = {},
): ForgotPasswordModel {
  return {
    bannerMessage: null,
    errors: {},
    isOpen: false,
    isSubmitting: false,
    successMessage: null,
    values: createForgotPasswordValues(email),
    ...overrides,
  };
}

function trimLoginValues(values: LoginFormValues): LoginFormValues {
  return {
    email: values.email.trim(),
    password: values.password,
  };
}

function trimForgotPasswordValues(
  values: ForgotPasswordFormValues,
): ForgotPasswordFormValues {
  return createForgotPasswordValues(values.email, true);
}

function normalizeAuthErrorMessage(
  error: AuthErrorLike | null | undefined,
): string {
  return error?.message?.trim().toLowerCase() ?? "";
}

export function LoginShell(props: LoginShellProps) {
  return (
    <PanelAuthLayout>
      <LiveLoginShell {...props} />
    </PanelAuthLayout>
  );
}

function LiveLoginShell({
  passwordSignIn = "on",
  resetError = null,
  resetToken = null,
  sso = null,
  ssoError = null,
}: LoginShellProps) {
  const router = useRouter();
  const { signupAvailable } = useBranding();
  const [values, setValues] = useState<LoginFormValues>(
    createLoginFormValues(),
  );
  const [errors, setErrors] = useState<LoginFormErrors>({});
  const [bannerMessage, setBannerMessage] = useState<string | null>(
    resetError === "INVALID_TOKEN"
      ? "This reset link is invalid or has expired."
      : ssoError
        ? describeSsoError(ssoError)
        : null,
  );
  const [showPasswordForm, setShowPasswordForm] = useState(
    passwordSignIn === "on",
  );
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [forgotPassword, setForgotPassword] = useState<ForgotPasswordModel>(
    createForgotPasswordModel(""),
  );
  const [isResendingVerification, setIsResendingVerification] = useState(false);
  const [showResendVerification, setShowResendVerification] = useState(false);
  const [needsSecondStep, setNeedsSecondStep] = useState(false);

  function handleChange(field: keyof LoginFormValues) {
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
      setShowResendVerification(false);
    };
  }

  function openForgotPasswordModal() {
    setForgotPassword(
      createForgotPasswordModel(values.email.trim(), { isOpen: true }),
    );
  }

  function closeForgotPasswordModal() {
    if (forgotPassword.isSubmitting) {
      return;
    }

    setForgotPassword(createForgotPasswordModel(values.email.trim()));
  }

  function handleForgotPasswordChange(event: ChangeEvent<HTMLInputElement>) {
    const nextValue = event.target.value;

    setForgotPassword((currentForgotPassword) => ({
      ...currentForgotPassword,
      bannerMessage: null,
      errors: {
        ...currentForgotPassword.errors,
        email: undefined,
      },
      successMessage: null,
      values: createForgotPasswordValues(nextValue),
    }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    const formData = new FormData(event.currentTarget);
    const trimmedValues = trimLoginValues({
      email: String(formData.get("login-email") ?? values.email),
      password: String(formData.get("login-password") ?? values.password),
    });
    const validationResult = loginSchema.safeParse(trimmedValues);

    if (!validationResult.success) {
      const nextErrors: LoginFormErrors = {};

      for (const issue of validationResult.error.issues) {
        const field = issue.path[0];

        if (field === "email") {
          nextErrors.email = "Enter a valid email address";
        }

        if (field === "password") {
          nextErrors.password = "Enter your password";
        }
      }

      setValues(trimmedValues);
      setErrors(nextErrors);
      setBannerMessage(null);
      return;
    }

    setValues(validationResult.data);
    setErrors({});
    setBannerMessage(null);
    setShowResendVerification(false);
    setIsSubmitting(true);

    const result = await authClient.signIn.email({
      email: validationResult.data.email,
      password: validationResult.data.password,
    });

    if (result.error) {
      const normalizedErrorMessage = normalizeAuthErrorMessage(result.error);
      const errorCode = (result.error as AuthErrorLike).code;

      if (
        errorCode === "SIGN_IN_LOCKED" ||
        errorCode === "PASSWORD_SIGN_IN_OFF"
      ) {
        setBannerMessage(
          result.error.message ??
            "Too many wrong passwords. Try again in 15 minutes.",
        );
      } else if (normalizedErrorMessage.includes("email not verified")) {
        setBannerMessage(verificationRequiredMessage);
        setShowResendVerification(true);
      } else if (
        describePasswordRefusal(result.error) === PASSWORD_TOO_LONG_MESSAGE
      ) {
        setErrors({ password: PASSWORD_TOO_LONG_MESSAGE });
      } else {
        setBannerMessage(
          normalizedErrorMessage.includes("invalid email or password")
            ? "Invalid email or password. Please try again."
            : "Something went wrong. Please try again.",
        );
      }
      setIsSubmitting(false);
      return;
    }

    if (
      result.data &&
      typeof result.data === "object" &&
      "twoFactorRedirect" in result.data
    ) {
      setNeedsSecondStep(true);
      setIsSubmitting(false);
      return;
    }

    router.replace("/dashboard");
  }

  async function handleForgotPasswordSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (forgotPassword.isSubmitting) {
      return;
    }

    const formData = new FormData(event.currentTarget);
    const trimmedValues = trimForgotPasswordValues({
      email: String(
        formData.get("forgot-password-email") ?? forgotPassword.values.email,
      ),
    });
    const validationResult = forgotPasswordSchema.safeParse(trimmedValues);

    if (!validationResult.success) {
      setForgotPassword((currentForgotPassword) => ({
        ...currentForgotPassword,
        bannerMessage: null,
        errors: {
          email: "Enter a valid email address",
        },
        successMessage: null,
        values: trimmedValues,
      }));
      return;
    }

    setForgotPassword((currentForgotPassword) => ({
      ...currentForgotPassword,
      bannerMessage: null,
      errors: {},
      isSubmitting: true,
      successMessage: null,
      values: validationResult.data,
    }));

    const result = await authClient.requestPasswordReset({
      email: validationResult.data.email,
      redirectTo: `${window.location.origin}/login`,
    });

    setForgotPassword((currentForgotPassword) => ({
      ...currentForgotPassword,
      bannerMessage: result.error
        ? "We couldn't send the reset link. Please try again."
        : null,
      errors: {},
      isSubmitting: false,
      successMessage: result.error
        ? null
        : "Check your email for a reset link.",
    }));
  }

  async function handleResendVerification() {
    const email = values.email.trim();

    if (!email || isResendingVerification) {
      return;
    }

    setIsResendingVerification(true);

    try {
      const response = await fetch("/api/auth/send-verification-email", {
        body: JSON.stringify({
          callbackURL: `${window.location.origin}/dashboard`,
          email,
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

      setBannerMessage("Verification email sent. Check your inbox.");
    } catch {
      setBannerMessage("We couldn't resend the verification email.");
    } finally {
      setIsResendingVerification(false);
    }
  }

  if (resetToken) {
    return <ResetPasswordCard resetToken={resetToken} />;
  }

  if (needsSecondStep) {
    return (
      <SecondStepCard
        onRestart={(message) => {
          setNeedsSecondStep(false);
          setValues((currentValues) => ({ ...currentValues, password: "" }));
          setBannerMessage(message);
        }}
        onSignedIn={() => router.replace("/dashboard")}
      />
    );
  }

  const formLocked = isSubmitting;
  const forgotPasswordLocked = forgotPassword.isSubmitting;

  return (
    <>
      <div className="space-y-6">
        {/* Logo */}
        <div className="flex justify-center">
          <img
            src="https://panel.rustlabs.io/images/rustlabs-logo.png"
            alt="RustLabs"
            className="h-10 w-auto object-contain brightness-110 drop-shadow"
          />
        </div>

        {/* Title */}
        <div className="text-center">
          <h2 className="text-xl font-bold tracking-[0.14em] text-white uppercase">
            SIGN IN TO BLUEPRINT
          </h2>
        </div>

        {/* Banner Alert */}
        {bannerMessage ? (
          <div
            className="rounded-lg bg-red-950/60 border border-red-800/80 p-3.5 text-xs text-red-200"
            role="alert"
          >
            {bannerMessage}
          </div>
        ) : null}

        {/* SSO Button */}
        {sso ? (
          <SsoButton
            onError={setBannerMessage}
            sso={sso}
            variant={showPasswordForm ? "secondary" : "primary"}
          />
        ) : null}

        {sso && showPasswordForm ? (
          <div className="relative flex items-center justify-center">
            <div className="w-full border-t border-[#2a2a2a]" />
            <span className="absolute bg-[#111111] px-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
              or
            </span>
          </div>
        ) : null}

        {/* Login Form */}
        {showPasswordForm ? (
          <form className="space-y-4" noValidate onSubmit={handleSubmit}>
            {/* Email Field */}
            <div className="space-y-1.5">
              <label
                htmlFor="login-email"
                className="text-xs font-semibold uppercase tracking-wider text-gray-400"
              >
                Email
              </label>
              <input
                id="login-email"
                name="login-email"
                type="email"
                autoComplete="email"
                disabled={formLocked}
                readOnly={formLocked}
                placeholder="name@company.com"
                value={values.email}
                onChange={handleChange("email")}
                className="w-full rounded-lg bg-[#1a1a1a] border border-[#2e2e2e] px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#1034df] focus:ring-1 focus:ring-[#1034df] transition-colors"
              />
              {errors.email ? (
                <p className="text-xs text-red-400 mt-1">{errors.email}</p>
              ) : null}
            </div>

            {/* Password Field */}
            <div className="space-y-1.5">
              <label
                htmlFor="login-password"
                className="text-xs font-semibold uppercase tracking-wider text-gray-400"
              >
                Password
              </label>
              <div className="relative">
                <input
                  id="login-password"
                  name="login-password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  disabled={formLocked}
                  readOnly={formLocked}
                  placeholder="Enter your password"
                  value={values.password}
                  onChange={handleChange("password")}
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
              {errors.password ? (
                <p className="text-xs text-red-400 mt-1">{errors.password}</p>
              ) : null}
            </div>

            {/* Options Row */}
            <div className="flex items-center justify-between text-xs text-gray-400 pt-1">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-4 w-4 rounded bg-[#1a1a1a] border-[#2e2e2e] text-[#1034df] focus:ring-[#1034df] focus:ring-offset-0 focus:ring-1 cursor-pointer"
                />
                <span>Remember me</span>
              </label>
              <button
                type="button"
                onClick={openForgotPasswordModal}
                className="text-gray-400 hover:text-white transition-colors cursor-pointer"
              >
                Forgot Password?
              </button>
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
                  <span>SIGNING IN...</span>
                </>
              ) : (
                "SIGN IN"
              )}
            </button>

            {/* Resend Verification */}
            {showResendVerification ? (
              <button
                type="button"
                disabled={formLocked}
                onClick={handleResendVerification}
                className="w-full py-2.5 px-4 bg-[#1a1a1a] border border-[#2e2e2e] text-gray-300 hover:text-white hover:border-gray-500 font-semibold text-xs uppercase tracking-wider rounded-lg transition-colors cursor-pointer"
              >
                {isResendingVerification
                  ? "Sending..."
                  : "Resend verification email"}
              </button>
            ) : null}
          </form>
        ) : passwordSignIn === "fallback" ? (
          <button
            className="w-full p-2 text-center text-xs font-semibold text-blue-400 hover:underline cursor-pointer"
            onClick={() => setShowPasswordForm(true)}
            type="button"
          >
            Sign in with a password instead
          </button>
        ) : null}

        {/* Footer Link */}
        <div className="text-center text-xs text-gray-400 pt-4 border-t border-[#222222]">
          Don&apos;t have an account?{" "}
          <Link
            href="/signup"
            className="text-white hover:text-blue-400 font-semibold underline-offset-4 hover:underline transition-colors ml-1"
          >
            Sign up for free
          </Link>
        </div>
      </div>

      <ForgotPasswordDialog
        bannerMessage={forgotPassword.bannerMessage}
        email={forgotPassword.values.email}
        emailError={forgotPassword.errors.email}
        isOpen={forgotPassword.isOpen}
        isSubmitting={forgotPasswordLocked}
        onClose={closeForgotPasswordModal}
        onEmailChange={handleForgotPasswordChange}
        onSubmit={handleForgotPasswordSubmit}
        successMessage={forgotPassword.successMessage}
      />
    </>
  );
}

type ForgotPasswordDialogProps = {
  bannerMessage: string | null;
  email: string;
  emailError?: string;
  isOpen: boolean;
  isSubmitting: boolean;
  onClose: () => void;
  onEmailChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void | Promise<void>;
  successMessage: string | null;
};

function ForgotPasswordDialog({
  bannerMessage,
  email,
  emailError,
  isOpen,
  isSubmitting,
  onClose,
  onEmailChange,
  onSubmit,
  successMessage,
}: ForgotPasswordDialogProps) {
  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open && !isSubmitting) {
          onClose();
        }
      }}
    >
      <DialogContent
        className="max-w-[460px] bg-[#161616] border-[#2e2e2e] text-white sm:p-8"
        showCloseButton={false}
      >
        <div className="space-y-5">
          <DialogHeader className="space-y-2">
            <DialogTitle className="text-lg font-bold uppercase tracking-wider text-white">
              Reset Password
            </DialogTitle>
            <DialogDescription className="text-xs text-gray-400">
              Enter the email address associated with your account and we&apos;ll send you a reset link.
            </DialogDescription>
          </DialogHeader>

          {bannerMessage ? (
            <div className="rounded-lg bg-red-950/60 border border-red-800/80 p-3 text-xs text-red-200" role="alert">
              {bannerMessage}
            </div>
          ) : null}

          {successMessage ? (
            <div className="rounded-lg bg-emerald-950/60 border border-emerald-800/80 p-3 text-xs text-emerald-200" role="status">
              {successMessage}
            </div>
          ) : null}

          <form className="space-y-4" noValidate onSubmit={onSubmit}>
            <div className="space-y-1.5">
              <label htmlFor="forgot-password-email" className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                Email
              </label>
              <input
                id="forgot-password-email"
                name="forgot-password-email"
                type="email"
                autoComplete="email"
                disabled={isSubmitting}
                readOnly={isSubmitting}
                placeholder="name@company.com"
                value={email}
                onChange={onEmailChange}
                className="w-full rounded-lg bg-[#1a1a1a] border border-[#2e2e2e] px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#1034df] focus:ring-1 focus:ring-[#1034df] transition-colors"
              />
              {emailError ? (
                <p className="text-xs text-red-400 mt-1">{emailError}</p>
              ) : null}
            </div>

            <div className="flex gap-3 justify-end pt-2">
              <button
                type="button"
                disabled={isSubmitting}
                onClick={onClose}
                className="px-4 py-2 bg-[#222222] hover:bg-[#2c2c2c] text-gray-300 text-xs font-semibold uppercase tracking-wider rounded-lg transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 bg-gradient-to-r from-[#1034df] to-[#165cff] hover:from-[#0d2bb8] hover:to-[#124cd4] text-white text-xs font-bold uppercase tracking-wider rounded-lg shadow-[0_2px_10px_rgba(16,52,223,0.3)] transition-all cursor-pointer flex items-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>Sending...</span>
                  </>
                ) : (
                  "Send reset link"
                )}
              </button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ResetPasswordCard({ resetToken }: { resetToken: string }) {
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    const formData = new FormData(event.currentTarget);
    const trimmedPassword = String(
      formData.get("reset-password") ?? password,
    ).trim();

    const lengthError = newPasswordLengthError(trimmedPassword);

    if (lengthError) {
      setError(lengthError);
      setSuccessMessage(null);
      return;
    }

    setPassword(trimmedPassword);
    setError(null);
    setSuccessMessage(null);
    setIsSubmitting(true);

    const result = await authClient.resetPassword({
      newPassword: trimmedPassword,
      token: resetToken,
    });

    if (result.error) {
      const normalizedErrorMessage = normalizeAuthErrorMessage(result.error);

      setError(
        normalizedErrorMessage.includes("invalid token")
          ? "This reset link is invalid or has expired."
          : (describePasswordRefusal(result.error) ??
              "Something went wrong. Please try again."),
      );
      setIsSubmitting(false);
      return;
    }

    setSuccessMessage(
      "Your password has been reset. Log in with your new password.",
    );
    setIsSubmitting(false);
  }

  const formLocked = isSubmitting;

  return (
    <div className="space-y-6">
      <div className="flex justify-center">
        <img
          src="https://panel.rustlabs.io/images/rustlabs-logo.png"
          alt="RustLabs"
          className="h-10 w-auto object-contain brightness-110 drop-shadow"
        />
      </div>

      <div className="text-center">
        <h2 className="text-xl font-bold tracking-[0.14em] text-white uppercase">
          CREATE NEW PASSWORD
        </h2>
      </div>

      {error ? (
        <div className="rounded-lg bg-red-950/60 border border-red-800/80 p-3 text-xs text-red-200" role="alert">
          {error}
        </div>
      ) : null}

      {successMessage ? (
        <div className="rounded-lg bg-emerald-950/60 border border-emerald-800/80 p-3 text-xs text-emerald-200" role="status">
          {successMessage}
        </div>
      ) : null}

      <form className="space-y-4" noValidate onSubmit={handleSubmit}>
        <div className="space-y-1.5">
          <label htmlFor="reset-password" className="text-xs font-semibold uppercase tracking-wider text-gray-400">
            New Password
          </label>
          <div className="relative">
            <input
              id="reset-password"
              name="reset-password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              disabled={formLocked}
              readOnly={formLocked}
              placeholder="Enter at least 15 characters"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError(null);
                setSuccessMessage(null);
              }}
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
          <p className="text-xs text-gray-500">Must be at least 15 characters</p>
        </div>

        <button
          type="submit"
          disabled={formLocked}
          className="w-full py-3.5 px-4 bg-gradient-to-r from-[#1034df] to-[#165cff] hover:from-[#0d2bb8] hover:to-[#124cd4] text-white font-bold text-xs tracking-widest uppercase rounded-lg shadow-[0_4px_15px_rgba(16,52,223,0.4)] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Updating password...</span>
            </>
          ) : (
            "Update password"
          )}
        </button>

        <div className="text-center text-xs text-gray-400 pt-3 border-t border-[#222222]">
          <Link
            href="/login"
            className="text-white hover:text-blue-400 font-semibold underline-offset-4 hover:underline transition-colors"
          >
            Back to Sign in
          </Link>
        </div>
      </form>
    </div>
  );
}

type SecondStepCardProps = {
  onRestart: (message: string) => void;
  onSignedIn: () => void;
};

function SecondStepCard({ onRestart, onSignedIn }: SecondStepCardProps) {
  const [code, setCode] = useState("");
  const [useBackupCode, setUseBackupCode] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    const trimmed = code.replace(/\s+/g, "");

    if (!useBackupCode && !/^\d{6}$/.test(trimmed)) {
      setError("Enter the 6-digit code your authenticator app shows.");
      return;
    }

    if (useBackupCode && trimmed.length === 0) {
      setError("Enter one of your backup codes.");
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      const response = await fetch(
        useBackupCode
          ? "/api/auth/two-factor/verify-backup-code"
          : "/api/auth/two-factor/verify-totp",
        {
          body: JSON.stringify({ code: trimmed }),
          headers: { "content-type": "application/json" },
          method: "POST",
        },
      );

      if (response.ok) {
        onSignedIn();
        return;
      }

      const payload = (await response.json().catch(() => null)) as {
        code?: string;
        message?: string;
      } | null;

      switch (payload?.code) {
        case "INVALID_CODE":
          setError(
            "That code is not right. Check the time on your phone and try the newest code.",
          );
          break;
        case "INVALID_BACKUP_CODE":
          setError("That backup code is not right, or it was used before.");
          break;
        case "ACCOUNT_TEMPORARILY_LOCKED":
          setError(
            "Too many wrong codes. Two-step sign-in is locked for 15 minutes.",
          );
          break;
        case "TOO_MANY_ATTEMPTS_REQUEST_NEW_CODE":
          onRestart("Too many wrong codes. Log in again to get a new try.");
          return;
        case "INVALID_TWO_FACTOR_COOKIE":
          onRestart("That took too long. Log in again.");
          return;
        default:
          setError("Something went wrong. Please try again.");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-center">
        <img
          src="https://panel.rustlabs.io/images/rustlabs-logo.png"
          alt="RustLabs"
          className="h-10 w-auto object-contain brightness-110 drop-shadow"
        />
      </div>

      <div className="text-center">
        <h2 className="text-xl font-bold tracking-[0.14em] text-white uppercase">
          {useBackupCode ? "ENTER BACKUP CODE" : "TWO-STEP SIGN-IN"}
        </h2>
        <p className="text-xs text-gray-400 mt-2">
          {useBackupCode
            ? "Each backup code works once."
            : "Open your authenticator app and enter the 6-digit code it shows."}
        </p>
      </div>

      {error ? (
        <div className="rounded-lg bg-red-950/60 border border-red-800/80 p-3 text-xs text-red-200" role="alert">
          {error}
        </div>
      ) : null}

      <form className="space-y-4" noValidate onSubmit={handleSubmit}>
        <div className="space-y-1.5">
          <label htmlFor="second-step-code" className="text-xs font-semibold uppercase tracking-wider text-gray-400">
            {useBackupCode ? "Backup code" : "6-digit code"}
          </label>
          <input
            id="second-step-code"
            name="second-step-code"
            type="text"
            autoComplete="one-time-code"
            disabled={isSubmitting}
            readOnly={isSubmitting}
            placeholder={useBackupCode ? "Enter backup code" : "123456"}
            value={code}
            onChange={(e) => {
              setCode(e.target.value);
              setError(null);
            }}
            className="w-full rounded-lg bg-[#1a1a1a] border border-[#2e2e2e] px-4 py-3 text-sm text-center tracking-widest text-white placeholder-gray-500 focus:outline-none focus:border-[#1034df] focus:ring-1 focus:ring-[#1034df] transition-colors"
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-3.5 px-4 bg-gradient-to-r from-[#1034df] to-[#165cff] hover:from-[#0d2bb8] hover:to-[#124cd4] text-white font-bold text-xs tracking-widest uppercase rounded-lg shadow-[0_4px_15px_rgba(16,52,223,0.4)] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Checking...</span>
            </>
          ) : (
            "Continue"
          )}
        </button>

        <div className="pt-4 border-t border-[#222222] text-center">
          <button
            type="button"
            onClick={() => {
              setUseBackupCode((current) => !current);
              setCode("");
              setError(null);
            }}
            className="text-xs text-blue-400 hover:underline cursor-pointer"
          >
            {useBackupCode
              ? "Use a code from your app instead"
              : "Lost your phone? Use a backup code"}
          </button>
        </div>
      </form>
    </div>
  );
}
