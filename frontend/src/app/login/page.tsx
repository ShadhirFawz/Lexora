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
  const [showPassword, setShowPassword] = useState(false);
  const [showContent, setShowContent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [loginError, setLoginError] = useState<string | null>(null);

  // ✅ Redirect if already logged in
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      const role = localStorage.getItem("role");
      // Redirect based on role if already logged in
      redirectBasedOnRole(role);
    }
    
    // Delay content animation by 1.2s (form slide duration)
    const timer = setTimeout(() => setShowContent(true), 1200);
    return () => clearTimeout(timer);
  }, [router]);

  // Function to redirect based on user role
  const redirectBasedOnRole = (role: string | null) => {
    if (role === "student") router.push("/dashboard/student");
    else if (role === "instructor") router.push("/dashboard/instructor");
    else if (role === "admin") router.push("/dashboard/admin");
    else router.push("/dashboard");
  };

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
      
      // Store token and role
      localStorage.setItem("token", data.token);
      localStorage.setItem("role", data.user.role);
      
      addToast({
        type: 'success',
        title: 'Login Successful',
        message: 'Redirecting to dashboard...',
        duration: 2000,
      });
      
      // Redirect based on user role
      setTimeout(() => redirectBasedOnRole(data.user.role), 1500);
    } catch (err: any) {
      // Clear password field only on login failure
      setPassword("");
      
      // Set login error and highlight password field
      const errorMessage = err.message || 'Invalid email or password';
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

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const ErrorIcon = () => (
    <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
    </svg>
  );

  const EyeIcon = () => (
    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  );

  const EyeSlashIcon = () => (
    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
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
            <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-1 ml-3 sm:mb-2" style={{ fontFamily: "sans-serif" }}>
              Email Address
            </label>
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
              <div className="absolute inset-y-0 right-0 pr-3 mt-7 flex items-center pointer-events-none">
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
            <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-1 ml-3 sm:mb-2" style={{ fontFamily: "sans-serif" }}>
                Password
            </label>
            <input
              type={showPassword ? "text" : "password"}
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
              className={`w-full p-3 border rounded-lg bg-gray-800 text-white placeholder-gray-400 focus:outline-none focus:ring-2 ${
                shouldShowPasswordError
                  ? 'border-red-500 focus:ring-red-500 pr-16' 
                  : 'border-gray-600 focus:ring-indigo-500 pr-10'
              }`}
              required
              disabled={isLoading}
            />
            
            {/* Password visibility toggle button */}
            <button
              type="button"
              className="absolute inset-y-0 right-0 pr-3 mt-7 flex items-center"
              onClick={togglePasswordVisibility}
              disabled={isLoading}
            >
              {showPassword ? <EyeSlashIcon /> : <EyeIcon />}
            </button>
            
            {/* Error icon - positioned left of the visibility toggle */}
            {shouldShowPasswordError && (
              <div className="absolute inset-y-0 right-0 pr-10 mt-7 flex items-center pointer-events-none">
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