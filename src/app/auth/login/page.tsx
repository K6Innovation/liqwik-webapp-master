"use client";

import { useState, useEffect } from "react";
import { signIn, getSession, useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

type LoginStep = "credentials" | "role" | "otp";

interface UserRoleData {
  userRoleId: string;
  roleId: string;
  roleName: string;
  isRoleVerified: boolean;
}

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [selectedUserRoleId, setSelectedUserRoleId] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [currentStep, setCurrentStep] = useState<LoginStep>("credentials");
  const [userRoles, setUserRoles] = useState<UserRoleData[]>([]);
  const [userId, setUserId] = useState("");
  const [isFirstLogin, setIsFirstLogin] = useState(false);
  
  const router = useRouter();
  const searchParams = useSearchParams();
  const { update } = useSession();
  const callbackUrl = searchParams.get("callbackUrl") || "/";
  const [verificationSuccess, setVerificationSuccess] = useState(false);
  const [verifiedRole, setVerifiedRole] = useState("");
  
  useEffect(() => {
    const message = searchParams.get("message");
    const role = searchParams.get("role");
    if (message === "email_verified") {
      setVerificationSuccess(true);
      setVerifiedRole(role || "");
      setTimeout(() => {
        setVerificationSuccess(false);
        setVerifiedRole("");
      }, 5000);
    }
  }, [searchParams]);

  const handleCredentialsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const result = await signIn("credentials", {
        username: email,
        password: password,
        redirect: false,
      });

      if (result?.error) {
        setError("Invalid email or password");
        setLoading(false);
        return;
      }

      // Get the session
      const session = await getSession();
      
      if (session?.user) {
        const userRoleData = (session.user as any).userRoles || [];
        const user_id = (session.user as any).id;
        
        setUserId(user_id);
        
        // Filter only verified roles
        const verifiedRoles = userRoleData.filter((role: UserRoleData) => role.isRoleVerified);
        
        if (verifiedRoles.length === 0) {
          setError("You don't have any verified roles yet. Please verify your email for at least one role before logging in.");
          setLoading(false);
          return;
        }
        
        // Set only verified roles for display
        setUserRoles(verifiedRoles);
        
        // Check if user is first time login
        const response = await fetch("/api/auth/check-first-login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: user_id }),
        });
        
        const data = await response.json();
        setIsFirstLogin(data.isFirstLogin);
        
        // Always show role selection screen, even for single role
        setCurrentStep("role");
        setLoading(false);
      }
    } catch (error) {
      setError("An error occurred during login");
      setLoading(false);
    }
  };

  const handleFirstLogin = async (userId: string, selectedRole: UserRoleData) => {
    try {
      // Send first login success email
      const emailResponse = await fetch("/api/auth/send-first-login-success", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          userId, 
          email, 
          selectedRole: selectedRole.roleName,
          userRoleId: selectedRole.userRoleId,
        }),
      });

      if (!emailResponse.ok) {
        console.warn("Failed to send first login success email");
      }

      // Mark user as not first login
      await fetch("/api/auth/mark-not-first-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });

      // Redirect to dashboard
      redirectToDashboard(selectedRole.roleName, selectedRole.userRoleId);
    } catch (error) {
      console.error("Error in first login:", error);
      setError("An error occurred during first login");
      setLoading(false);
    }
  };

  const proceedToOtp = async (userId: string) => {
    try {
      // Generate and send OTP
      const response = await fetch("/api/auth/generate-login-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, email }),
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || "Failed to generate OTP");
        setLoading(false);
        return;
      }

      setCurrentStep("otp");
      setLoading(false);
    } catch (error) {
      setError("An error occurred while generating OTP");
      setLoading(false);
    }
  };

  const handleRoleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (!selectedUserRoleId) {
      setError("Please select a role");
      setLoading(false);
      return;
    }

    try {
      // Find the selected role data
      const selectedRole = userRoles.find(r => r.userRoleId === selectedUserRoleId);
      
      if (!selectedRole) {
        setError("Invalid role selection");
        setLoading(false);
        return;
      }

      // Check if the selected role is verified (should always be true at this point)
      if (!selectedRole.isRoleVerified) {
        setError("This role is not verified. Please verify your email for this role first.");
        setLoading(false);
        return;
      }

      // Update session with selected role
      await update({
        selectedRole: selectedRole.roleName,
        selectedUserRoleId: selectedRole.userRoleId,
      });

      if (isFirstLogin) {
        await handleFirstLogin(userId, selectedRole);
      } else {
        await proceedToOtp(userId);
      }
    } catch (error) {
      setError("An error occurred while processing role selection");
      setLoading(false);
    }
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (!otp) {
      setError("Please enter the OTP");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/auth/verify-login-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, otp }),
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || "Invalid OTP");
        setLoading(false);
        return;
      }

      // Get selected role
      const selectedRole = userRoles.find(r => r.userRoleId === selectedUserRoleId);
      if (selectedRole) {
        redirectToDashboard(selectedRole.roleName, selectedRole.userRoleId);
      }
    } catch (error) {
      setError("An error occurred during OTP verification");
      setLoading(false);
    }
  };

  const redirectToDashboard = (roleName: string, userRoleId: string) => {
    // Store the selected role in localStorage for client-side access
    if (typeof window !== 'undefined') {
      localStorage.setItem('selectedUserRoleId', userRoleId);
      localStorage.setItem('selectedRole', roleName);
    }
    
    if (roleName === "buyer") {
      router.push(`/buyers/${userId}`);
    } else if (roleName === "seller") {
      router.push(`/sellers/${userId}`);
    } else if (roleName === "admin") {
      router.push(`/admin/${userId}`);
    }
  };

  const handleResendOtp = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/auth/generate-login-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, email }),
      });

      if (response.ok) {
        setError("");
      } else {
        const data = await response.json();
        setError(data.error || "Failed to resend OTP");
      }
    } catch (error) {
      setError("Failed to resend OTP");
    } finally {
      setLoading(false);
    }
  };

  const renderCredentialsStep = () => (
    <div className="bg-white p-8 rounded-lg shadow-md">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-pink-600">Login to Liqwik</h2>
      </div>
      
      {verificationSuccess && (
        <div className="mb-4 text-green-600 text-sm text-center bg-green-50 p-3 rounded-md border border-green-200">
          <svg className="inline w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          Email verified successfully for {verifiedRole} role! You can now login to your account.
        </div>
      )}

      <form onSubmit={handleCredentialsSubmit} className="space-y-6">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
            placeholder="Enter your email"
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
            placeholder="Enter your password"
          />
        </div>

        {error && (
          <div className="text-red-600 text-sm text-center bg-red-50 p-3 rounded-md border border-red-200">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-pink-600 hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Verifying..." : "Continue"}
        </button>
      </form>

      <div className="mt-6 text-center">
        <p className="text-sm text-gray-600">
          Don't have an account?{" "}
          <Link href="/auth/register" className="text-pink-600 hover:text-pink-700 font-medium">
            Register here
          </Link>
        </p>
      </div>
    </div>
  );

  const renderRoleStep = () => (
    <div className="bg-white p-8 rounded-lg shadow-md">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-pink-600">Select Login Role</h2>
        <p className="text-gray-600 mt-2">Choose how you want to access Liqwik</p>
      </div>

      <form onSubmit={handleRoleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-4">
            Available Verified Roles
          </label>
          <div className="space-y-3">
            {userRoles.map((roleData) => (
              <label 
                key={roleData.userRoleId} 
                className="flex items-center justify-between p-3 border border-gray-200 rounded-md cursor-pointer hover:bg-gray-50"
              >
                <div className="flex items-center">
                  <input
                    type="radio"
                    name="role"
                    value={roleData.userRoleId}
                    checked={selectedUserRoleId === roleData.userRoleId}
                    onChange={(e) => setSelectedUserRoleId(e.target.value)}
                    className="mr-3 text-pink-600 focus:ring-pink-500"
                  />
                  <span className="capitalize font-medium">
                    {roleData.roleName}
                  </span>
                </div>

              </label>
            ))}
          </div>
        </div>

        {error && (
          <div className="text-red-600 text-sm text-center bg-red-50 p-3 rounded-md border border-red-200">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading || !selectedUserRoleId}
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-pink-600 hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Processing..." : isFirstLogin ? "Login to Dashboard" : "Continue"}
        </button>
      </form>

      <div className="mt-6 text-center">
        <button
          onClick={() => setCurrentStep("credentials")}
          className="text-pink-600 hover:text-pink-700 font-medium text-sm"
        >
          ← Back to Login
        </button>
      </div>
    </div>
  );

  const renderOtpStep = () => (
    <div className="bg-white p-8 rounded-lg shadow-md">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-pink-600">Enter OTP</h2>
        <p className="text-gray-600 mt-2">
          We've sent a verification code to {email}
        </p>
      </div>

      <form onSubmit={handleOtpSubmit} className="space-y-6">
        <div>
          <label htmlFor="otp" className="block text-sm font-medium text-gray-700 mb-2">
            Verification Code
          </label>
          <input
            id="otp"
            type="text"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            required
            maxLength={6}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent text-center text-lg tracking-widest"
            placeholder="Enter 6-digit code"
          />
        </div>

        {error && (
          <div className="text-red-600 text-sm text-center">{error}</div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-pink-600 hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Verifying..." : "Verify & Login"}
        </button>
      </form>

      <div className="mt-6 text-center space-y-2">
        <button
          onClick={handleResendOtp}
          disabled={loading}
          className="text-pink-600 hover:text-pink-700 font-medium text-sm"
        >
          Resend Code
        </button>
        <br />
        <button
          onClick={() => setCurrentStep("role")}
          className="text-gray-600 hover:text-gray-700 text-sm"
        >
          ← Back to Role Selection
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {currentStep === "credentials" && renderCredentialsStep()}
        {currentStep === "role" && renderRoleStep()}
        {currentStep === "otp" && renderOtpStep()}
      </div>
    </div>
  );
}