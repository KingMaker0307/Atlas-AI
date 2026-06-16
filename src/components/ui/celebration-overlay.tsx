"use client";

import React, { useEffect, useRef, useState } from "react";
import { useAtlasStore } from "@/store/useAtlasStore";
import { Award, Check, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ConfettiParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  shape: "circle" | "square" | "triangle";
  rotation: number;
  rotationSpeed: number;
}

const COLORS = ["#10b981", "#3b82f6", "#f59e0b", "#ec4899", "#8b5cf6", "#f43f5e"];

export function CelebrationOverlay() {
  const lastCompletedWorkoutId = useAtlasStore((state) => state.lastCompletedWorkoutId);
  const workouts = useAtlasStore((state) => state.workouts || []);
  const setLastCompletedWorkoutId = useAtlasStore((state) => state.setLastCompletedWorkoutId);
  
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [show, setShow] = useState(false);
  const [workoutName, setWorkoutName] = useState("");
  const [workoutVolume, setWorkoutVolume] = useState(0);
  const [workoutDuration, setWorkoutDuration] = useState(0);

  // Detect workout completion
  useEffect(() => {
    if (lastCompletedWorkoutId) {
      const w = workouts.find((item) => item.id === lastCompletedWorkoutId);
      if (w) {
        setWorkoutName(w.name || "Workout Session");
        setWorkoutDuration(w.durationMinutes || 0);

        // Compute volume
        let vol = 0;
        w.exercises.forEach((ex) => {
          ex.sets.forEach((set) => {
            if (set.completed) {
              vol += (set.reps || 0) * (set.weight || 0);
            }
          });
        });
        setWorkoutVolume(vol);
        setShow(true);
      }
    }
  }, [lastCompletedWorkoutId, workouts]);

  // Confetti Physics & Canvas Render
  useEffect(() => {
    if (!show || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Resize canvas
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const particles: ConfettiParticle[] = [];

    // Spawn 150 particles bursting from center-bottom or center
    const spawnX = canvas.width / 2;
    const spawnY = canvas.height / 2.2;

    for (let i = 0; i < 150; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 4 + Math.random() * 8;
      particles.push({
        x: spawnX,
        y: spawnY,
        vx: Math.cos(angle) * speed + (Math.random() - 0.5) * 2,
        vy: Math.sin(angle) * speed - 2 - Math.random() * 4,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        size: 5 + Math.random() * 8,
        shape: ["circle", "square", "triangle"][Math.floor(Math.random() * 3)] as any,
        rotation: Math.random() * Math.PI,
        rotationSpeed: (Math.random() - 0.5) * 0.1,
      });
    }

    let animationId: number;

    const updateAndDraw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      let active = false;

      particles.forEach((p) => {
        // Apply physics
        p.vy += 0.18; // gravity
        p.vx *= 0.98; // air resistance
        p.x += p.vx;
        p.y += p.vy;
        p.rotation += p.rotationSpeed;

        // Draw particle
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        ctx.fillStyle = p.color;

        ctx.beginPath();
        if (p.shape === "circle") {
          ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
        } else if (p.shape === "square") {
          ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
        } else if (p.shape === "triangle") {
          ctx.moveTo(0, -p.size / 2);
          ctx.lineTo(p.size / 2, p.size / 2);
          ctx.lineTo(-p.size / 2, p.size / 2);
          ctx.closePath();
        }
        ctx.fill();
        ctx.restore();

        // Check if particles are still on screen
        if (p.y < canvas.height && p.x > -20 && p.x < canvas.width + 20) {
          active = true;
        }
      });

      if (active) {
        animationId = requestAnimationFrame(updateAndDraw);
      }
    };

    animationId = requestAnimationFrame(updateAndDraw);

    // Resize handler
    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", handleResize);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener("resize", handleResize);
    };
  }, [show]);

  const handleClose = () => {
    setShow(false);
    setLastCompletedWorkoutId(null);
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none w-full h-full" />
      
      {/* Glassmorphic Award Card */}
      <div className="relative w-full max-w-sm rounded-3xl border border-amber-500/30 bg-card p-6 text-center shadow-[0_24px_80px_rgba(245,158,11,0.25)] flex flex-col items-center gap-4 animate-scale-up supports-[backdrop-filter]:backdrop-blur-2xl">
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 h-8 w-8 rounded-full flex items-center justify-center border border-zinc-200 dark:border-zinc-800 text-zinc-500 hover:text-foreground hover:bg-zinc-50 dark:hover:bg-white/5 active:scale-95 transition-all cursor-pointer"
          aria-label="Close celebration"
        >
          <X size={15} />
        </button>

        {/* Glow ring and icon */}
        <div className="relative h-20 w-20 rounded-full bg-gradient-to-tr from-amber-500 to-yellow-400 p-[1px] flex items-center justify-center shadow-lg shadow-amber-500/10">
          <div className="absolute inset-0.5 rounded-full bg-card flex items-center justify-center">
            <div className="h-16 w-16 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-500">
              <Award size={36} className="animate-pulse" />
            </div>
          </div>
        </div>

        {/* Text Area */}
        <div className="space-y-1">
          <span className="text-[10px] font-black uppercase text-amber-500 tracking-widest flex items-center justify-center gap-1">
            <Sparkles size={10} /> Goal Unlocked <Sparkles size={10} />
          </span>
          <h2 className="text-xl font-black text-foreground">Workout Completed!</h2>
          <p className="text-sm font-semibold text-zinc-600 dark:text-zinc-400 mt-2">
            Fantastic job completing <strong className="text-zinc-850 dark:text-white">{workoutName}</strong>.
          </p>
        </div>

        {/* Biometrics Log summary */}
        <div className="w-full grid grid-cols-2 gap-2 p-3.5 rounded-2xl bg-surface border border-surface-border text-left">
          <div>
            <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider">Total Volume</p>
            <p className="text-base font-black text-foreground mt-0.5">
              {workoutVolume.toLocaleString()} <span className="text-xs font-bold text-zinc-500">lbs</span>
            </p>
          </div>
          <div>
            <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider">Duration</p>
            <p className="text-base font-black text-foreground mt-0.5">
              {workoutDuration} <span className="text-xs font-bold text-zinc-500">min</span>
            </p>
          </div>
        </div>

        {/* CTA Button */}
        <Button
          onClick={handleClose}
          variant="primary"
          className="w-full py-3 bg-amber-500 text-white hover:bg-amber-600 border-transparent font-black uppercase tracking-wider text-xs shadow-md shadow-amber-500/10"
        >
          <Check size={14} className="mr-1.5 stroke-[3px]" />
          Awesome, keep it up!
        </Button>
      </div>
    </div>
  );
}
