"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

export default function VerificationForm() {
  const [verificationCode, setVerificationCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [resendLoading, setResendLoading] = useState(false);
  const [resendMessage, setResendMessage] = useState("");
  const [countdown, setCountdown] = useState(0);
  
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Get parameters from URL
  const email = searchParams.get("email");
  const firstName = searchParams.get("firstName");
  const role = searchParams.get("role");
  const userRoleId = searchParams.get("userRoleId");

  useEffect(() => {
    // Redirect to register if no email or userRoleId in params
    if (!email || !userRoleId) {
      router.push("/auth/register");
      return;
    }
  }, [email, userRoleId, router]);

  useEffect(() => {
    // Countdown timer for resend button
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!verificationCode) {
      setError("Please enter the verification code");
      return;
    }

    if (verificationCode.length !== 6) {
      setError("Verification code must be 6 digits");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch("/api/auth/verify-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          code: verificationCode,
          userRoleId,
          role,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(`Email verified successfully for ${role} role! Redirecting to login...`);
        setTimeout(() => {
          router.push(`/auth/login?message=email_verified&role=${role}`);
        }, 1500);
      } else {
        setError(data.error || "Verification failed");
      }
    } catch (error) {
      setError("An error occurred during verification");
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    setResendLoading(true);
    setResendMessage("");
    setError("");

    try {
      const response = await fetch("/api/auth/verify-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          action: "resend",
          userRoleId,
          role,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setResendMessage("New verification code sent to your email");
        setCountdown(60);
        setVerificationCode("");
      } else {
        setError(data.error || "Failed to resend verification code");
      }
    } catch (error) {
      setError("An error occurred while resending verification code");
    } finally {
      setResendLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '');
    if (value.length <= 6) {
      setVerificationCode(value);
      setError("");
      setResendMessage("");
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '');
    if (pastedData.length <= 6) {
      setVerificationCode(pastedData);
      setError("");
      setResendMessage("");
    }
  };

  if (!email || !userRoleId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-pink-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Redirecting...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="bg-white p-8 rounded-lg shadow-md">
          <div className="text-center mb-8">
            <div className="mx-auto mb-4 w-16 h-16 bg-pink-100 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-pink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-pink-600 mb-2">Verify Your Email</h2>
            {role && (
              <div className="mb-2">
                <span className="inline-block px-3 py-1 bg-pink-100 text-pink-800 rounded-full text-xs font-semibold uppercase">
                  {role} Account
                </span>
              </div>
            )}
            <p className="text-gray-600 text-sm">
              Hi {firstName || "there"}! We&apos;ve sent a 6-digit verification code to
            </p>
            <p className="text-gray-800 font-medium text-sm mt-1 break-all">{email}</p>
            <p className="text-gray-500 text-xs mt-2">
              Please enter the code below to verify your email address for your {role || ""} account
            </p>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="verificationCode" className="block text-sm font-medium text-gray-700 mb-2 text-center">
                Verification Code
              </label>
              <input
                id="verificationCode"
                name="verificationCode"
                type="text"
                value={verificationCode}
                onChange={handleInputChange}
                onPaste={handlePaste}
                maxLength={6}
                placeholder="000000"
                className="w-full px-4 py-3 text-center text-2xl font-mono border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent tracking-widest"
                autoComplete="off"
                autoFocus
                required
              />
              <p className="text-xs text-gray-500 text-center mt-1">
                Enter the 6-digit code sent to your email
              </p>
            </div>

            {error && (
              <div className="text-red-600 text-sm text-center bg-red-50 p-3 rounded-md border border-red-200">
                <svg className="inline w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {error}
              </div>
            )}

            {success && (
              <div className="text-green-600 text-sm text-center bg-green-50 p-3 rounded-md border border-green-200">
                <svg className="inline w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                {success}
              </div>
            )}

            {resendMessage && (
              <div className="text-blue-600 text-sm text-center bg-blue-50 p-3 rounded-md border border-blue-200">
                <svg className="inline w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                {resendMessage}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || verificationCode.length !== 6}
              className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-pink-600 hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors duration-200"
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Verifying...
                </>
              ) : (
                `Verify ${role || ""} Account`
              )}
            </button>

            <div className="text-center">
              <p className="text-sm text-gray-600 mb-3">
                Didn&apos;t receive the code?
              </p>
              <button
                type="button"
                onClick={handleResendCode}
                disabled={resendLoading || countdown > 0}
                className="text-sm font-medium text-pink-600 hover:text-pink-500 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors duration-200"
              >
                {resendLoading ? (
                  <>
                    <svg className="animate-spin inline w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Sending...
                  </>
                ) : countdown > 0 ? (
                  `Resend in ${countdown}s`
                ) : (
                  "Resend verification code"
                )}
              </button>
            </div>

            <div className="text-center mt-6 pt-4 border-t border-gray-200">
              <Link 
                href="/auth/register" 
                className="text-sm text-gray-600 hover:text-gray-800 transition-colors duration-200"
              >
                ← Back to registration
              </Link>
            </div>
          </form>
        </div>

        <div className="text-center">
          <p className="text-xs text-gray-500">
            Having trouble? Check your spam folder or{" "}
            <Link href="/contact" className="text-pink-600 hover:text-pink-500">
              contact support
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}