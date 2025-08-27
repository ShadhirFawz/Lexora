"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import AnimatedLogo from "./AnimatedLogo";
import AppLogo from "@/assets/images/AppLogo.png"
import Image from "next/image";

// Pre-generated stable positions for the 20 particles
const STABLE_PARTICLE_POSITIONS = Array.from({ length: 20 }, (_, i) => ({
  left: Math.floor(Math.random() * 100),
  top: Math.floor(Math.random() * 100),
  id: i,
}));

interface AuthBackgroundProps {
  isMobile?: boolean;
}

const AuthBackground: React.FC<AuthBackgroundProps> = ({ isMobile = false }) => {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const floatingShapes = [
    { delay: 0, duration: 8, size: "w-16 h-16", color: "bg-indigo-500/10" },
    { delay: 1, duration: 10, size: "w-24 h-24", color: "bg-purple-500/10" },
    { delay: 2, duration: 12, size: "w-20 h-20", color: "bg-blue-500/10" },
    { delay: 3, duration: 9, size: "w-28 h-28", color: "bg-indigo-600/10" },
  ];

  return (
    <div className={`relative w-full ${isMobile ? 'h-full' : 'h-screen'} flex items-center justify-center overflow-hidden`}>
      {/* Animated background elements */}
      <div className={`absolute inset-0 ${isMobile ? 'm-4 rounded-xl' : 'm-10 rounded-2xl'} bg-gradient-to-br from-gray-900 via-indigo-900 to-purple-900`}>
        {/* Floating shapes - Reduced number on mobile */}
        {floatingShapes.map((shape, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 100, rotate: 0 }}
            animate={{
              opacity: [0.1, 0.3, 0.1],
              y: [0, -100, 0],
              rotate: 360,
            }}
            transition={{
              duration: shape.duration,
              delay: shape.delay,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className={`absolute rounded-full ${isMobile ? shape.size.replace('w-', 'w-8 ').replace('h-', 'h-8 ') : shape.size} ${shape.color} blur-xl`}
            style={{
              left: `${20 + index * 15}%`,
              top: `${30 + index * 10}%`,
            }}
          />
        ))}

        {/* Grid pattern */}
        <div className="absolute inset-0 opacity-20">
          <div 
            className="absolute inset-0"
            style={{
              backgroundImage: `radial-gradient(circle at 1px 1px, rgba(255,255,255,0.1) 1px, transparent 0)`,
              backgroundSize: '40px 40px',
            }}
          />
        </div>
      </div>

      {/* Main logo and content - Simplified for mobile */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={isMounted ? { opacity: 1, scale: 1 } : {}}
        transition={{ duration: 2, ease: "easeOut" }}
        className="relative z-10 text-center"
      >
        {isMobile ? (
          // Mobile version with smaller logo
          <>
            <AnimatedLogo size="md" />
            
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={isMounted ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.5, duration: 1 }}
              className="mb-4 mt-4 flex items-center justify-center"
            >
              <Image
                src={AppLogo}
                alt="Logo"
                width={80}
                height={80}
                className="rounded-lg shadow-lg"
              />
            </motion.div>
            
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={isMounted ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 1, duration: 1 }}
              className="mt-4 text-sm text-gray-300 font-light tracking-wide"
            >
              Transform Your Learning Journey
            </motion.p>
          </>
        ) : (
          // Desktop version (unchanged)
          <>
            <AnimatedLogo size="xl" />

            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={isMounted ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.5, duration: 1 }}
              className="mb-6 mt-6 flex items-center justify-center"
            >
              <Image
                src={AppLogo}
                alt="Logo"
                width={120}
                height={120}
                className="rounded-lg shadow-lg"
              />
            </motion.div>
            
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={isMounted ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 1, duration: 1 }}
              className="mt-6 text-xl text-gray-300 font-light tracking-wide"
            >
              Transform Your Learning Journey
            </motion.p>

            <motion.div
              initial={{ scale: 0 }}
              animate={isMounted ? { scale: 1 } : {}}
              transition={{ delay: 1.5, duration: 1 }}
              className="mt-8 w-32 h-1 bg-gradient-to-r from-indigo-400 to-purple-400 mx-auto rounded-full"
            />
          </>
        )}
      </motion.div>

      {/* Animated particles with stable positions - Reduced on mobile */}
      <div className="absolute inset-0">
        {STABLE_PARTICLE_POSITIONS.slice(0, isMobile ? 10 : 20).map((particle) => (
          <motion.div
            key={particle.id}
            initial={{
              opacity: 0,
              scale: 0,
            }}
            animate={{
              opacity: [0, 0.5, 0],
              scale: [0, 1, 0],
            }}
            transition={{
              duration: Math.random() * 3 + 2,
              delay: Math.random() * 2,
              repeat: Infinity,
              ease: "easeOut",
            }}
            className="absolute w-2 h-2 bg-white rounded-full opacity-30"
            style={{
              left: `${particle.left}%`,
              top: `${particle.top}%`,
            }}
          />
        ))}
      </div>
    </div>
  );
};

export default AuthBackground;