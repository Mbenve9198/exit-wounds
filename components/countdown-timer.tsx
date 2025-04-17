"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

export default function CountdownTimer() {
  // Launch date: April 28, 2025 at 7:30 AM Rome time (CEST/UTC+2)
  const launchDate = new Date("2025-04-28T07:30:00+02:00");
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  useEffect(() => {
    const calculateTimeLeft = () => {
      const difference = +launchDate - +new Date();
      let newTimeLeft: TimeLeft = {
        days: 0,
        hours: 0,
        minutes: 0,
        seconds: 0,
      };

      if (difference > 0) {
        newTimeLeft = {
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60),
        };
      }

      setTimeLeft(newTimeLeft);
    };

    // Calculate initially
    calculateTimeLeft();
    
    // Update every second
    const timer = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, []);

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 100,
      },
    },
  };

  const numberVariants = {
    initial: { scale: 1 },
    animate: { scale: [1, 1.1, 1], transition: { duration: 0.3 } },
  };

  return (
    <div className="w-full bg-black text-white rounded-lg p-6 mb-6">
      <h2 className="text-center text-xl mb-4 font-bold">The first comic will be available on:</h2>
      
      <motion.div 
        className="flex justify-center items-center space-x-4"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Days */}
        <motion.div className="flex flex-col items-center" variants={itemVariants}>
          <motion.div 
            className="text-3xl font-bold"
            variants={numberVariants}
            key={timeLeft.days}
            initial="initial"
            animate="animate"
          >
            {timeLeft.days}
          </motion.div>
          <div className="text-sm uppercase">Days</div>
        </motion.div>

        <motion.div className="text-3xl font-bold">:</motion.div>

        {/* Hours */}
        <motion.div className="flex flex-col items-center" variants={itemVariants}>
          <motion.div 
            className="text-3xl font-bold"
            variants={numberVariants}
            key={timeLeft.hours}
            initial="initial"
            animate="animate"
          >
            {timeLeft.hours.toString().padStart(2, '0')}
          </motion.div>
          <div className="text-sm uppercase">Hours</div>
        </motion.div>

        <motion.div className="text-3xl font-bold">:</motion.div>

        {/* Minutes */}
        <motion.div className="flex flex-col items-center" variants={itemVariants}>
          <motion.div 
            className="text-3xl font-bold"
            variants={numberVariants}
            key={timeLeft.minutes}
            initial="initial"
            animate="animate"
          >
            {timeLeft.minutes.toString().padStart(2, '0')}
          </motion.div>
          <div className="text-sm uppercase">Minutes</div>
        </motion.div>

        <motion.div className="text-3xl font-bold">:</motion.div>

        {/* Seconds */}
        <motion.div className="flex flex-col items-center" variants={itemVariants}>
          <motion.div 
            className="text-3xl font-bold"
            variants={numberVariants}
            key={timeLeft.seconds}
            initial="initial"
            animate="animate"
          >
            {timeLeft.seconds.toString().padStart(2, '0')}
          </motion.div>
          <div className="text-sm uppercase">Seconds</div>
        </motion.div>
      </motion.div>
    </div>
  );
} 