"use client";

import { ReactNode, useEffect, useState } from "react";
import AuthBackground from "./AuthBackgroundDynamic";
import Image from "next/image";
import AppLogo from "@/assets/images/AppLogo.png";
import BrandLogo from "@/assets/images/BrandLogo.png"

interface AuthLayoutProps {
  children: ReactNode;
  onAnimationComplete?: (complete: boolean) => void;
}

// Pre-generate stable positions for decorative logos
const generateStableLogoPositions = (count: number) => {
  // Use a seeded random generator or fixed positions
  const positions = [
    { top: "15%", left: "10%", opacity: 0.1, scale: 0.7},
    { top: "18%", left: "75%", opacity: 0.05, scale: 0.8},
    { top: "45%", left: "20%", opacity: 0.07, scale: 0.6},
    { top: "50%", left: "65%", opacity: 0.04, scale: 0.9},
    { top: "75%", left: "30%", opacity: 0.06, scale: 0.75},
    { top: "85%", left: "80%", opacity: 0.03, scale: 0.85},
    { top: "35%", left: "50%", opacity: 0.05, scale: 0.7},
    { top: "55%", left: "40%", opacity: 0.04, scale: 0.8},
    { top: "78%", left: "90%", opacity: 0.04, scale: 0.8},
    { top: "90%", left: "10%", opacity: 0.04, scale: 0.8},
  ];
  
  return positions.slice(0, count).map((pos, i) => ({
    ...pos,
    id: i,
  }));
};

export default function AuthLayout({ children, onAnimationComplete }: AuthLayoutProps) {
  const [isMounted, setIsMounted] = useState(false);
  const [isAnimationComplete, setIsAnimationComplete] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  
  // Use stable positions that won't change between server and client
  const [logoPositions, setLogoPositions] = useState<Array<any>>([]);

  useEffect(() => {
    // Generate random positions only on client
    setLogoPositions(generateStableLogoPositions(10));
  }, []);

  useEffect(() => {
    // Check if mobile on mount and on resize
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    // Use requestAnimationFrame for smoother animation timing
    const animationFrame = requestAnimationFrame(() => {
      setIsMounted(true);
    });
    
    // Set timeout to mark animation as complete after the duration
    const completionTimer = setTimeout(() => {
      setIsAnimationComplete(true);
      onAnimationComplete?.(true);
    }, 1000);
    
    return () => {
      cancelAnimationFrame(animationFrame);
      clearTimeout(completionTimer);
      window.removeEventListener('resize', checkMobile);
    };
  }, [onAnimationComplete]);

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-gradient-to-br from-gray-700 via-gray-200 to-gray-700 overflow-hidden">
      {/* Background for mobile - shown above content */}
      <div className="lg:hidden relative h-64 md:h-80 w-full">
        <AuthBackground isMobile={true} />
      </div>
      
      {/* Left 3/5 section with animated background and logo - Hidden on mobile, visible on desktop */}
      <div className="hidden lg:block lg:w-3/5">
        <AuthBackground isMobile={false} />
      </div>
      
      {/* Right 2/5 section with form - Full width on mobile, 2/5 on desktop */}
      <div className="relative w-full">
        {/* Main content container */}
        <div 
          className="bg-slate-900 shadow-2xl lg:rounded-l-2xl p-4 sm:p-6 md:p-8 w-full h-full flex items-center justify-center relative pointer-events-auto z-10"
          style={{
            transform: isMounted ? 'translateX(0)' : (isMobile ? 'translateY(20px)' : 'translateX(20%)'),
            opacity: isMounted ? 1 : 0,
            transition: 'transform 1.2s cubic-bezier(0.25, 0.46, 0.45, 0.94), opacity 1.2s ease-out'
          }}
        >
          <div className="absolute inset-0 pointer-events-none z-5">
            {logoPositions.map((logo) => (
              <div
                key={logo.id}
                className="absolute select-none"
                style={{
                  top: logo.top,
                  left: logo.left,
                  opacity: logo.opacity,
                  transform: `scale(${logo.scale})`,
                }}
              >
                <Image
                  src={BrandLogo}
                  alt=""
                  width={80}
                  height={80}
                  className="select-none pointer-events-none"
                />
              </div>
            ))}
          </div>
          <div className="w-full max-w-md">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}