import React, { useRef, useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { setToken } from "../utils/auth";
import {
  UserPlus,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle,
  ShieldCheck,
} from "lucide-react";

const SignUpPage: React.FC = () => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    firstName: "",
    lastName: "",
    company: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [otpStep, setOtpStep] = useState(false); // --- OTP LOGIC START ---
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);
  const [otpVerified, setOtpVerified] = useState(false);
  const router = useRouter();

  const handleOtpChange = (e, index) => {
    const value = e.target.value.replace(/\D/, ""); // only digits
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Move forward automatically
    if (value && index < 5) {
      inputsRef.current[index + 1].focus();
    }
  };

  const handleOtpKeyDown = (e, index) => {
    if (e.key === "Backspace") {
      e.preventDefault();
      const newOtp = [...otp];

      if (otp[index]) {
        // Clear current and move left
        newOtp[index] = "";
        setOtp(newOtp);

        if (index > 0) {
          inputsRef.current[index - 1].focus();
        }
      } else if (index > 0) {
        // Move left and clear previous
        newOtp[index - 1] = "";
        setOtp(newOtp);
        inputsRef.current[index - 1].focus();
      }
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const paste = e.clipboardData.getData("text").slice(0, 6);
    const digits = paste.split("").filter((ch) => /\d/.test(ch));
    if (digits.length === 6) {
      setOtp(digits);
      inputsRef.current[5].focus();
    }
  };

  const otpValue = otp.join("");

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleOtpVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess(false);

    // No need to call validateForm again — fields were already validated before OTP
    if (!otpValue || otpValue.length < 6) {
      setError("Please enter the 6-digit OTP code.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        // ✅ This payload exactly matches your backend verify-otp.ts
        body: JSON.stringify({
          email: formData.email,
          otp : otpValue, // include the entered OTP here
          password: formData.password,
          firstName: formData.firstName,
          lastName: formData.lastName,
          company: formData.company,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        const errorMessage =
          data.error || "OTP verification failed. Please try again.";
        console.error("OTP verification failed:", {
          status: response.status,
          error: errorMessage,
          data,
        });
        throw new Error(errorMessage);
      }

      if (!data.success) {
        throw new Error(data.error || "OTP verification failed");
      }

      // ✅ Success: store token and redirect just like your register logic
      setSuccess(true);
      if (data.token) {
        setToken(data.token);
      }

      setTimeout(() => {
        if (data.redirectTo) {
          router.push(data.redirectTo);
        } else if (!data.user.onboardingComplete) {
          router.push("/onboarding");
        } else {
          router.push("/dashboard");
        }
      }, 2000);
    } catch (err) {
      console.error("OTP verification error:", err);
      setError(err instanceof Error ? err.message : "OTP verification failed");
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    if (
      !formData.email ||
      !formData.password ||
      !formData.firstName ||
      !formData.lastName
    ) {
      setError("Please fill in all required fields");
      return false;
    }

    if (formData.password.length < 8) {
      setError("Password must be at least 8 characters long");
      return false;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError("Please enter a valid email address");
      return false;
    }

    return true;
  };

  // const handleOtpVerify = async (e: React.FormEvent) => {
  //   e.preventDefault();
  //   setError("");
  //   setSuccess(false);

  //   if (!validateForm()) {
  //     return;
  //   }

  //   setLoading(true);

  //   try {
  //     const response = await fetch("/api/auth/register", {
  //       method: "POST",
  //       headers: {
  //         "Content-Type": "application/json",
  //       },
  //       body: JSON.stringify({
  //         email: formData.email,
  //         password: formData.password,
  //         firstName: formData.firstName,
  //         lastName: formData.lastName,
  //         company: formData.company,
  //       }),
  //     });

  //     const data = await response.json();

  //     if (!response.ok) {
  //       const errorMessage =
  //         data.error || "Registration failed. Please try again.";
  //       console.error("Registration failed:", {
  //         status: response.status,
  //         error: errorMessage,
  //         data,
  //       });
  //       throw new Error(errorMessage);
  //     }

  //     if (!data.success) {
  //       throw new Error(data.error || "Registration failed");
  //     }

  //     setSuccess(true);

  //     // Store token and redirect after a brief success message
  //     if (data.token) {
  //       setToken(data.token);
  //     }

  //     setTimeout(() => {
  //       if (data.redirectTo) {
  //         router.push(data.redirectTo);
  //       } else if (!data.user.onboardingComplete) {
  //         router.push("/onboarding");
  //       } else {
  //         router.push("/dashboard");
  //       }
  //     }, 2000);
  //   } catch (err) {
  //     console.error("Registration error:", err);
  //     setError(err instanceof Error ? err.message : "Registration failed");
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess(false);

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      // --- STEP 1: Send OTP instead of registering immediately ---
      const response = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: formData.email,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        const errorMessage =
          data.error || "Failed to send OTP. Please try again.";
        console.error("Send OTP failed:", {
          status: response.status,
          error: errorMessage,
          data,
        });
        throw new Error(errorMessage);
      }

      if (!data.success) {
        throw new Error(data.error || "Failed to send OTP");
      }

      // --- STEP 2: Switch to OTP verification view ---
      setOtpStep(true); // show OTP input UI
      setError(""); // clear any previous errors
      setSuccess(false); // reset success state
      console.log("OTP sent successfully to:", formData.email);
    } catch (err) {
      console.error("OTP sending error:", err);
      setError(err instanceof Error ? err.message : "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  if (success && otpVerified) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
        <div className="max-w-md w-full space-y-8 text-center">
          <CheckCircle className="mx-auto h-12 w-12 text-green-500" />
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Account Verified Successfully!
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Welcome to Lync Bot! Redirecting to your dashboard...
          </p>
          <div className="mt-4 animate-spin rounded-full h-8 w-8 border-b-2 border-green-500 mx-auto"></div>
        </div>
      </div>
    );
  }

  // --- OTP VERIFICATION UI ---
  if (otpStep && !otpVerified) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
        <div className="max-w-md w-full space-y-6 bg-white p-6 rounded-2xl shadow-lg border border-gray-100">
          <div className="text-center">
            <ShieldCheck className="mx-auto h-12 w-12 text-blue-600" />
            <h2 className="mt-4 text-2xl font-semibold text-gray-900">
              Verify Your Email
            </h2>
            <p className="text-sm text-gray-600">
              Enter the 6-digit code sent to <strong>{formData.email}</strong>
            </p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          )}

          <form onSubmit={(e) => handleOtpVerify(e)} className="space-y-4">
            <div className="flex justify-between" onPaste={handlePaste}>
              {otp.map((digit, index) => (
                <input
                  key={index}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(e, index)}
                  onKeyDown={(e) => handleOtpKeyDown(e, index)}
                  ref={(el: HTMLInputElement | null) => { inputsRef.current[index] = el; }}
                  className="w-12 h-12 text-center border border-gray-300 rounded-lg text-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                />
              ))}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
            >
              {loading ? "Verifying..." : "Verify OTP"}
            </button>
          </form>

          <p className="text-sm text-center text-gray-500">
            Didn’t get the code?{" "}
            <button
              type="button"
              className="text-blue-600 hover:text-blue-500 font-medium"
              onClick={async () => {
                await fetch("/api/auth/resend-otp", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ email: formData.email }),
                });
              }}
            >
              Resend OTP
            </button>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Create your account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Join Lync Bot to automate your LinkedIn outreach
          </p>
        </div>

        {/* Sign Up Form */}
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="bg-white rounded-lg shadow-md p-6 space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                {error}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="firstName"
                  className="block text-sm font-medium text-gray-700"
                >
                  First Name *
                </label>
                <input
                  id="firstName"
                  name="firstName"
                  type="text"
                  required
                  value={formData.firstName}
                  onChange={handleInputChange}
                  className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                  placeholder="John"
                />
              </div>

              <div>
                <label
                  htmlFor="lastName"
                  className="block text-sm font-medium text-gray-700"
                >
                  Last Name *
                </label>
                <input
                  id="lastName"
                  name="lastName"
                  type="text"
                  required
                  value={formData.lastName}
                  onChange={handleInputChange}
                  className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                  placeholder="Doe"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700"
              >
                Email Address *
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={formData.email}
                onChange={handleInputChange}
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="john@example.com"
              />
            </div>

            <div>
              <label
                htmlFor="company"
                className="block text-sm font-medium text-gray-700"
              >
                Company (Optional)
              </label>
              <input
                id="company"
                name="company"
                type="text"
                value={formData.company}
                onChange={handleInputChange}
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Your Company"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700"
              >
                Password *
              </label>
              <div className="mt-1 relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  required
                  value={formData.password}
                  onChange={handleInputChange}
                  className="appearance-none relative block w-full px-3 py-2 pr-10 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                  placeholder="At least 8 characters"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-gray-400" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-400" />
                  )}
                </button>
              </div>
            </div>

            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium text-gray-700"
              >
                Confirm Password *
              </label>
              <div className="mt-1 relative">
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  autoComplete="new-password"
                  required
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  className="appearance-none relative block w-full px-3 py-2 pr-10 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                  placeholder="Confirm your password"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4 text-gray-400" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-400" />
                  )}
                </button>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Creating account...
                  </div>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4 mr-2" />
                    Create Account
                  </>
                )}
              </button>
            </div>
          </div>
        </form>

        {/* Sign In Link */}
        <div className="text-center">
          <p className="text-sm text-gray-600">
            Already have an account?{" "}
            <Link
              href="/signin"
              className="font-medium text-blue-600 hover:text-blue-500 transition-colors"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SignUpPage;
