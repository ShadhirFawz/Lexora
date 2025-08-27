"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface AnimatedLogoProps {
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

const AnimatedLogo: React.FC<AnimatedLogoProps> = ({ size = "lg", className = "" }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [currentLetter, setCurrentLetter] = useState(0);

  const sizeClasses = {
    sm: "text-2xl",
    md: "text-4xl",
    lg: "text-6xl",
    xl: "text-8xl"
  };

  const letters = ["L", "e", "x", "o", "r", "a"];

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (isVisible) {
      const interval = setInterval(() => {
        setCurrentLetter((prev) => (prev < letters.length - 1 ? prev + 1 : prev));
      }, 150);
      
      return () => clearInterval(interval);
    }
  }, [isVisible, letters.length]);

  return (
    <div className={`relative inline-block ${className}`}>
      {/* Main logo container */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
        className="relative z-10"
      >
        <div className={`font-bold ${sizeClasses[size]} tracking-wider`}>
          {letters.map((letter, index) => (
            <motion.span
              key={index}
              initial={{ 
                opacity: 0, 
                y: 100, 
                rotateX: -90,
                scale: 2,
                filter: "blur(10px)"
              }}
              animate={isVisible && index <= currentLetter ? { 
                opacity: 1, 
                y: 0, 
                rotateX: 0,
                scale: 1,
                filter: "blur(0px)"
              } : {}}
              transition={{
                type: "spring",
                damping: 12,
                stiffness: 200,
                delay: index * 0.1,
              }}
              className="inline-block text-white drop-shadow-2xl"
              style={{
                textShadow: "0 0 20px rgba(99, 102, 241, 0.8), 0 0 30px rgba(99, 102, 241, 0.6)"
              }}
            >
              {letter}
            </motion.span>
          ))}
        </div>
      </motion.div>

      {/* Animated background glow */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ 
          opacity: 1, 
          scale: 1,
          transition: {
            duration: 2,
            repeat: Infinity,
            repeatType: "reverse",
            ease: "easeInOut"
          }
        }}
        className="absolute inset-0 bg-gradient-to-r from-indigo-500/20 to-purple-600/20 rounded-full blur-xl -z-10"
        style={{
          top: "-50%",
          left: "-25%",
          right: "-25%",
          bottom: "-50%",
        }}
      />

      {/* Particle effects */}
      <AnimatePresence>
        {isVisible && (
          <>
            {[...Array(8)].map((_, i) => (
              <motion.div
                key={i}
                initial={{
                  opacity: 0,
                  scale: 0,
                  x: 0,
                  y: 0,
                }}
                animate={{
                  opacity: [0, 1, 0],
                  scale: [0, 1, 0],
                  x: Math.cos((i / 8) * Math.PI * 2) * 100,
                  y: Math.sin((i / 8) * Math.PI * 2) * 100,
                }}
                transition={{
                  duration: 2,
                  delay: i * 0.2,
                  repeat: Infinity,
                  repeatDelay: 3,
                }}
                className="absolute w-2 h-2 bg-indigo-400 rounded-full"
                style={{
                  left: "50%",
                  top: "50%",
                }}
              />
            ))}
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AnimatedLogo;