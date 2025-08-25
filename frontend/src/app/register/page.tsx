"use client";

import { useState, useEffect } from "react";
import { apiRequest } from "@/lib/api";
import AuthLayout from "@/components/AuthLayout";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("student");
  const [message, setMessage] = useState("");
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    // Delay content animation by 1.2s (form slide duration)
    const timer = setTimeout(() => setShowContent(true), 1200);
    return () => clearTimeout(timer);
  }, []);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    // ✅ Validation
    if (!name || !email || !password) {
      return setMessage("⚠️ All fields are required");
    }
    if (!email.includes("@")) {
      return setMessage("⚠️ Invalid email format");
    }
    if (password.length < 6) {
      return setMessage("⚠️ Password must be at least 6 characters");
    }

    try {
      const data = await apiRequest("/register", "POST", {
        name,
        email,
        password,
        role,
      });

      setMessage(`✅ Registered successfully. Redirecting...`);
      setTimeout(() => router.push("/login"), 1500);
    } catch (err: any) {
      setMessage(`❌ Error: ${err.message}`);
    }
  };

  return (
    <AuthLayout>
      <h1 
        className="text-3xl font-bold mb-6 text-center text-white transition-all duration-700 ease-out"
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
        <div
          style={{
            transform: showContent ? 'translateY(0)' : 'translateY(20px)',
            opacity: showContent ? 1 : 0,
            transition: 'transform 0.7s ease-out, opacity 0.7s ease-out',
            transitionDelay: '0.2s'
          }}
        >
          <input
            type="text"
            placeholder="Full Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full p-3 border border-gray-600 rounded-lg bg-gray-800 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            required
          />
        </div>
        
        <div
          style={{
            transform: showContent ? 'translateY(0)' : 'translateY(20px)',
            opacity: showContent ? 1 : 0,
            transition: 'transform 0.7s ease-out, opacity 0.7s ease-out',
            transitionDelay: '0.3s'
          }}
        >
          <input
            type="email"
            placeholder="Email Address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-3 border border-gray-600 rounded-lg bg-gray-800 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            required
          />
        </div>
        
        <div
          style={{
            transform: showContent ? 'translateY(0)' : 'translateY(20px)',
            opacity: showContent ? 1 : 0,
            transition: 'transform 0.7s ease-out, opacity 0.7s ease-out',
            transitionDelay: '0.4s'
          }}
        >
          <input
            type="password"
            placeholder="Password (min 6 characters)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-3 border border-gray-600 rounded-lg bg-gray-800 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            required
          />
        </div>
        
        <div
          style={{
            transform: showContent ? 'translateY(0)' : 'translateY(20px)',
            opacity: showContent ? 1 : 0,
            transition: 'transform 0.7s ease-out, opacity 0.7s ease-out',
            transitionDelay: '0.5s'
          }}
        >
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="w-full p-3 border border-gray-600 rounded-lg bg-gray-800 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="student">Student</option>
            <option value="instructor">Instructor</option>
          </select>
        </div>
        
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
            className="mt-4 w-full bg-indigo-800 text-white p-3 rounded-lg hover:opacity-90 cursor-pointer"
          >
            Register
          </button>
        </div>
      </form>
      
      {message && (
        <div 
          className={`mt-4 p-3 rounded-lg text-center ${
            message.includes('✅') ? 'bg-green-900/30 text-green-300' : 'bg-red-900/30 text-red-300'
          }`}
          style={{
            transform: showContent ? 'translateY(0)' : 'translateY(20px)',
            opacity: showContent ? 1 : 0,
            transition: 'transform 0.7s ease-out, opacity 0.7s ease-out',
            transitionDelay: '0.7s'
          }}
        >
          {message}
        </div>
      )}

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
            onClick={() => router.push("/login")}
          >
            Login
          </span>
        </p>
      </div>
    </AuthLayout>
  );
}