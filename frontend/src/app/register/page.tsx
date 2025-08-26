"use client";

import { useState, useEffect } from "react";
import { apiRequest } from "@/lib/api";
import AuthLayout from "@/components/AuthLayout";
import { useRouter } from "next/navigation";
import { useToast } from "@/contexts/ToastContext";
import { validateForm, validationRules, ValidationResult } from "@/utils/validation";

export default function RegisterPage() {
  const router = useRouter();
  const { addToast } = useToast();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("student");
  const [showContent, setShowContent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [registerError, setRegisterError] = useState<string | null>(null);

  useEffect(() => {
    // Delay content animation by 1.2s (form slide duration)
    const timer = setTimeout(() => setShowContent(true), 1200);
    return () => clearTimeout(timer);
  }, []);

  const handleBlur = (field: string) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    
    // Clear register error when user interacts with fields
    if (registerError && field !== 'role') {
      setRegisterError(null);
      setErrors(prev => ({ ...prev, [field]: "" }));
    }
    
    // Validate single field on blur (except role which is a select)
    if (field !== 'role') {
      const validation = validateForm(
        { [field]: field === 'name' ? name : field === 'email' ? email : password },
        { [field]: validationRules.register[field as keyof typeof validationRules.register] }
      );
      
      if (!validation.isValid) {
        setErrors(prev => ({ ...prev, [field]: validation.errors[field] }));
      } else {
        setErrors(prev => ({ ...prev, [field]: "" }));
      }
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setRegisterError(null); // Clear previous register errors

    // Store the current password for the API call
    const currentPassword = password;

    // Validate all fields
    const validation = validateForm(
      { name, email, password: currentPassword, role },
      validationRules.register
    );

    if (!validation.isValid) {
      setErrors(validation.errors);
      // Mark all fields as touched to show errors
      setTouched({
        name: true,
        email: true,
        password: true,
        role: true
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
      const data = await apiRequest("/register", "POST", {
        name,
        email,
        password: currentPassword, // Use the stored password
        role,
      });

      addToast({
        type: 'success',
        title: 'Registration Successful',
        message: 'Redirecting to login page...',
        duration: 2000,
      });
      
      setTimeout(() => router.push("/login"), 1500);
    } catch (err: any) {
      // Clear password field only on registration failure
      setPassword("");
      
      // Set register error
      const errorMessage = err.message || 'An error occurred during registration';
      setRegisterError(errorMessage);
      
      addToast({
        type: 'error',
        title: 'Registration Failed',
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

  // Determine if field should show error
  const shouldShowError = (field: string) => touched[field] && errors[field];

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
        Create Account
      </h1>
      
      <form onSubmit={handleRegister} className="space-y-4">
        {/* Name Field */}
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
              type="text"
              placeholder="Full Name"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (touched.name && errors.name) {
                  setErrors(prev => ({ ...prev, name: "" }));
                }
                if (registerError) {
                  setRegisterError(null);
                }
              }}
              onBlur={() => handleBlur('name')}
              className={`w-full p-3 border rounded-lg bg-gray-800 text-white placeholder-gray-400 focus:outline-none focus:ring-2 pr-10 ${
                shouldShowError('name')
                  ? 'border-red-500 focus:ring-red-500' 
                  : 'border-gray-600 focus:ring-indigo-500'
              }`}
              required
              disabled={isLoading}
            />
            {shouldShowError('name') && (
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <ErrorIcon />
              </div>
            )}
          </div>
          {shouldShowError('name') && (
            <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
              <ErrorIcon />
              {errors.name}
            </p>
          )}
        </div>
        
        {/* Email Field */}
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
              type="email"
              placeholder="Email Address"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (touched.email && errors.email) {
                  setErrors(prev => ({ ...prev, email: "" }));
                }
                if (registerError) {
                  setRegisterError(null);
                }
              }}
              onBlur={() => handleBlur('email')}
              className={`w-full p-3 border rounded-lg bg-gray-800 text-white placeholder-gray-400 focus:outline-none focus:ring-2 pr-10 ${
                shouldShowError('email')
                  ? 'border-red-500 focus:ring-red-500' 
                  : 'border-gray-600 focus:ring-indigo-500'
              }`}
              required
              disabled={isLoading}
            />
            {shouldShowError('email') && (
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <ErrorIcon />
              </div>
            )}
          </div>
          {shouldShowError('email') && (
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
            transitionDelay: '0.4s'
          }}
        >
          <div className="relative">
            <input
              type="password"
              placeholder="Password (min 6 characters)"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (touched.password && errors.password) {
                  setErrors(prev => ({ ...prev, password: "" }));
                }
                if (registerError) {
                  setRegisterError(null);
                }
              }}
              onBlur={() => handleBlur('password')}
              className={`w-full p-3 border rounded-lg bg-gray-800 text-white placeholder-gray-400 focus:outline-none focus:ring-2 pr-10 ${
                shouldShowError('password')
                  ? 'border-red-500 focus:ring-red-500' 
                  : 'border-gray-600 focus:ring-indigo-500'
              }`}
              required
              disabled={isLoading}
            />
            {shouldShowError('password') && (
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <ErrorIcon />
              </div>
            )}
          </div>
          {shouldShowError('password') && (
            <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
              <ErrorIcon />
              {errors.password}
            </p>
          )}
        </div>
        
        {/* Role Selection Field */}
        <div
          style={{
            transform: showContent ? 'translateY(0)' : 'translateY(20px)',
            opacity: showContent ? 1 : 0,
            transition: 'transform 0.7s ease-out, opacity 0.7s ease-out',
            transitionDelay: '0.5s'
          }}
        >
          <div className="relative">
            <select
              value={role}
              onChange={(e) => {
                setRole(e.target.value);
                if (registerError) {
                  setRegisterError(null);
                }
              }}
              onBlur={() => handleBlur('role')}
              className={`w-full p-3 border rounded-lg bg-gray-800 text-white focus:outline-none focus:ring-2 ${
                touched.role && errors.role
                  ? 'border-red-500 focus:ring-red-500' 
                  : 'border-gray-600 focus:ring-indigo-500'
              }`}
              disabled={isLoading}
            >
              <option value="student">Student</option>
              <option value="instructor">Instructor</option>
            </select>
            {touched.role && errors.role && (
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <ErrorIcon />
              </div>
            )}
          </div>
          {touched.role && errors.role && (
            <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
              <ErrorIcon />
              {errors.role}
            </p>
          )}
        </div>
        
        {/* Submit Button */}
        <div
          style={{
            transform: showContent ? 'translateY(0)' : 'translateY(20px)',
            opacity: showContent ? 1 : 0,
            transition: 'transform 0.7s ease-out, opacity 0.7s ease-out',
            transitionDelay: '0.6s'
          }}
        >
          <button
            type="submit"
            disabled={isLoading}
            className="mt-10 w-full bg-indigo-800 text-white p-3 rounded-lg hover:opacity-90 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-3 transition-colors duration-300"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                <span>Registering...</span>
              </>
            ) : (
              <span>Register</span>
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
          transitionDelay: '0.8s'
        }}
      >
        <p className="text-gray-400">
          Already have an account?{" "}
          <span 
            className="text-indigo-400 hover:text-indigo-300 cursor-pointer font-medium"
            onClick={() => !isLoading && router.push("/login")}
          >
            Login
          </span>
        </p>
      </div>
    </AuthLayout>
  );
}