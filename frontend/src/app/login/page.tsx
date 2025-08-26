"use client";

import { useState, useEffect } from "react";
import { apiRequest } from "@/lib/api";
import AuthLayout from "@/components/AuthLayout";
import { useRouter } from "next/navigation";
import { useToast } from "@/contexts/ToastContext";
import { validateForm, validationRules, ValidationResult } from "@/utils/validation";

export default function LoginPage() {
  const router = useRouter();
  const { addToast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showContent, setShowContent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [loginError, setLoginError] = useState<string | null>(null);

  // ✅ Redirect if already logged in
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) router.push("/dashboard");
    
    // Delay content animation by 1.2s (form slide duration)
    const timer = setTimeout(() => setShowContent(true), 1200);
    return () => clearTimeout(timer);
  }, [router]);

  const handleBlur = (field: string) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    
    // Clear login error when user interacts with fields
    if (loginError) {
      setLoginError(null);
      setErrors(prev => ({ ...prev, password: "" }));
    }
    
    // Validate single field on blur
    const validation = validateForm(
      { email, password },
      { [field]: validationRules.login[field as keyof typeof validationRules.login] }
    );
    
    if (!validation.isValid) {
      setErrors(prev => ({ ...prev, [field]: validation.errors[field] }));
    } else {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setLoginError(null); // Clear previous login errors

    // Store the current password for the API call
    const currentPassword = password;

    // Validate all fields
    const validation = validateForm(
      { email, password: currentPassword },
      validationRules.login
    );

    if (!validation.isValid) {
      setErrors(validation.errors);
      // Mark all fields as touched to show errors
      setTouched({
        email: true,
        password: true
      });
      
      // Show first error in toast
      const firstError = Object.values(validation.errors)[0];
      addToast({
        type: 'error',
        title: 'Validation Error',
        message: firstError,
        duration: 4000,
      });
      setIsLoading(false);
      return;
    }

    // Clear validation errors if validation passes
    setErrors({});

    try {
      const data = await apiRequest("/login", "POST", { 
        email, 
        password: currentPassword // Use the stored password
      });
      localStorage.setItem("token", data.token);
      
      addToast({
        type: 'success',
        title: 'Login Successful',
        message: 'Redirecting to dashboard...',
        duration: 2000,
      });
      
      setTimeout(() => router.push("/dashboard"), 1500);
    } catch (err: any) {
      // Clear password field only on login failure
      setPassword("");
      
      // Set login error and highlight password field
      const errorMessage = 'Invalid email or password';
      setLoginError(errorMessage);
      setErrors(prev => ({ ...prev, password: errorMessage }));
      setTouched(prev => ({ ...prev, password: true }));
      
      addToast({
        type: 'error',
        title: 'Login Failed',
        message: errorMessage,
        duration: 5000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const ErrorIcon = () => (
    <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
    </svg>
  );

  // Determine if password field should show error (validation error OR login error)
  const shouldShowPasswordError = touched.password && (errors.password || loginError);

  return (
    <AuthLayout>
      <h1 
        className="text-3xl font-bold mb-15 text-center text-white transition-all duration-700 ease-out"
        style={{
          fontFamily: "'Times New Roman', sans-serif",
          transform: showContent ? 'translateY(0)' : 'translateY(-20px)',
          opacity: showContent ? 1 : 0,
          transitionDelay: '0.1s'
        }}
      >
        Login
      </h1>
      
      <form onSubmit={handleLogin} className="space-y-4">
        {/* Email Field */}
        <div
          style={{
            transform: showContent ? 'translateY(0)' : 'translateY(20px)',
            opacity: showContent ? 1 : 0,
            transition: 'transform 0.7s ease-out, opacity 0.7s ease-out',
            transitionDelay: '0.2s'
          }}
        >
          <div className="relative">
            <input
              type="email"
              placeholder="Email Address"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (touched.email && errors.email) {
                  // Clear error when user starts typing
                  setErrors(prev => ({ ...prev, email: "" }));
                }
                // Clear login error when email changes
                if (loginError) {
                  setLoginError(null);
                  setErrors(prev => ({ ...prev, password: "" }));
                }
              }}
              onBlur={() => handleBlur('email')}
              className={`w-full p-3 border rounded-lg bg-gray-800 text-white placeholder-gray-400 focus:outline-none focus:ring-2 pr-10 ${
                touched.email && errors.email 
                  ? 'border-red-500 focus:ring-red-500' 
                  : 'border-gray-600 focus:ring-indigo-500'
              }`}
              required
              disabled={isLoading}
            />
            {touched.email && errors.email && (
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <ErrorIcon />
              </div>
            )}
          </div>
          {touched.email && errors.email && (
            <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
              <ErrorIcon />
              {errors.email}
            </p>
          )}
        </div>
        
        {/* Password Field */}
        <div
          style={{
            transform: showContent ? 'translateY(0)' : 'translateY(20px)',
            opacity: showContent ? 1 : 0,
            transition: 'transform 0.7s ease-out, opacity 0.7s ease-out',
            transitionDelay: '0.3s'
          }}
        >
          <div className="relative">
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (touched.password && errors.password) {
                  // Clear error when user starts typing
                  setErrors(prev => ({ ...prev, password: "" }));
                }
                // Clear login error when password changes
                if (loginError) {
                  setLoginError(null);
                  setErrors(prev => ({ ...prev, password: "" }));
                }
              }}
              onBlur={() => handleBlur('password')}
              className={`w-full p-3 border rounded-lg bg-gray-800 text-white placeholder-gray-400 focus:outline-none focus:ring-2 pr-10 ${
                shouldShowPasswordError
                  ? 'border-red-500 focus:ring-red-500' 
                  : 'border-gray-600 focus:ring-indigo-500'
              }`}
              required
              disabled={isLoading}
            />
            {shouldShowPasswordError && (
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <ErrorIcon />
              </div>
            )}
          </div>
          {shouldShowPasswordError && (
            <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
              <ErrorIcon />
              {loginError || errors.password}
            </p>
          )}
        </div>
        
        {/* Submit Button */}
        <div
          style={{
            transform: showContent ? 'translateY(0)' : 'translateY(20px)',
            opacity: showContent ? 1 : 0,
            transition: 'transform 0.7s ease-out, opacity 0.7s ease-out',
            transitionDelay: '0.4s'
          }}
        >
          <button
            type="submit"
            disabled={isLoading}
            className="mt-10 w-full bg-indigo-800 text-white p-3 rounded-lg cursor-pointer hover:opacity-90 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-3 transition-colors duration-300"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                <span>Signing in...</span>
              </>
            ) : (
              <span>Sign In</span>
            )}
          </button>
        </div>
      </form>

      <div 
        className="mt-6 text-center"
        style={{
          transform: showContent ? 'translateY(0)' : 'translateY(20px)',
          opacity: showContent ? 1 : 0,
          transition: 'transform 0.7s ease-out, opacity 0.7s ease-out',
          transitionDelay: '0.6s'
        }}
      >
        <p className="text-gray-400">
          Don't have an account?{" "}
          <span 
            className="text-indigo-400 hover:text-indigo-300 cursor-pointer font-medium"
            onClick={() => !isLoading && router.push("/register")}
          >
            Sign up
          </span>
        </p>
      </div>
    </AuthLayout>
  );
}