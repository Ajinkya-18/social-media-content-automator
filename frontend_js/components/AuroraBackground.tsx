"use client";

import { motion } from "framer-motion";
import React from "react";

export const AuroraBackground = () => {
  return (
    <div className="fixed inset-0 z-[-1] overflow-hidden bg-black">
      <motion.div
        animate={{
          scale: [1, 1.2, 1],
          rotate: [0, 90, 0],
          x: [0, 100, 0],
          y: [0, -50, 0],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="absolute top-[-10%] left-[-10%] h-[500px] w-[500px] rounded-full bg-purple-600/30 blur-[100px]"
      />
      <motion.div
        animate={{
          scale: [1, 1.5, 1],
          rotate: [0, -60, 0],
          x: [0, -100, 0],
          y: [0, 100, 0],
        }}
        transition={{
          duration: 25,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="absolute top-[20%] right-[-10%] h-[600px] w-[600px] rounded-full bg-blue-900/30 blur-[120px]"
      />
      <motion.div
        animate={{
          scale: [1, 1.3, 1],
          rotate: [0, 45, 0],
          x: [0, 50, 0],
          y: [0, 50, 0],
        }}
        transition={{
          duration: 22,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="absolute bottom-[-10%] left-[20%] h-[400px] w-[400px] rounded-full bg-cyan-500/20 blur-[90px]"
      />
    </div>
  );
};
