"use client";

import { ReactNode, useEffect, useState } from "react";

interface AuthLayoutProps {
  children: ReactNode;
  onAnimationComplete?: (complete: boolean) => void;
}

export default function AuthLayout({ children, onAnimationComplete }: AuthLayoutProps) {
  const [isMounted, setIsMounted] = useState(false);
  const [isAnimationComplete, setIsAnimationComplete] = useState(false);

  useEffect(() => {
    // Use requestAnimationFrame for smoother animation timing
    const animationFrame = requestAnimationFrame(() => {
      setIsMounted(true);
    });
    
    // Set timeout to mark animation as complete after the duration
    const completionTimer = setTimeout(() => {
      setIsAnimationComplete(true);
      onAnimationComplete?.(true);
    }, 1000); // Match this with your transition duration (1.2s)
    
    return () => {
      cancelAnimationFrame(animationFrame);
      clearTimeout(completionTimer);
    };
  }, [onAnimationComplete]);

  return (
    <div className="min-h-screen flex items-center justify-end bg-gradient-to-br from-gray-700 via-gray-200 to-gray-700 overflow-hidden">
      <div 
        className="bg-slate-900 shadow-2xl rounded-l-2xl p-8 w-2/5 h-screen flex items-center justify-center"
        style={{
          transform: isMounted ? 'translateX(0)' : 'translateX(40%)',
          opacity: isMounted ? 1 : 0,
          transition: 'transform 1.2s cubic-bezier(0.25, 0.46, 0.45, 0.94), opacity 1.2s ease-out'
        }}
      >
        <div className="w-full max-w-md">
          {children}
        </div>
      </div>
    </div>
  );
}