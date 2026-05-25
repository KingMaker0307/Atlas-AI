"use client";

import { useState, useMemo, useEffect } from "react";
import {
  X,
  ChevronLeft,
  ChevronRight,
  Info,
  Clock3,
  Flame,
  Activity,
  CheckCircle2,
  AlertTriangle,
  Play,
  Heart,
  Image,
  Pause
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, Surface } from "@/components/ui/card";
import type { Exercise } from "@/types/domain";

// High-Fidelity Animated SVG Biomechanical Illustrations
function ExerciseSvgIllustration({ exerciseId }: { exerciseId: string }) {
  const normalizedId = exerciseId.toLowerCase();

  // Cardio Machine: Running / Walking (Treadmill)
  if (normalizedId.includes("treadmill") || normalizedId.includes("run") || normalizedId.includes("jog") || normalizedId.includes("walk")) {
    return (
      <svg viewBox="0 0 200 120" className="w-full h-full" aria-hidden="true">
        <style>{`
          @keyframes runnerBody {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-4px); }
          }
          @keyframes beltMove {
            0% { stroke-dashoffset: 0; }
            100% { stroke-dashoffset: 32; }
          }
          .runner-skeleton { animation: runnerBody 0.8s infinite ease-in-out; }
          .belt-flow { animation: beltMove 0.4s infinite linear; }
        `}</style>
        {/* Treadmill frame */}
        <line x1="30" y1="95" x2="170" y2="95" stroke="#3f3f46" strokeWidth="4" strokeLinecap="round" />
        <line x1="160" y1="95" x2="175" y2="45" stroke="#27272a" strokeWidth="3" />
        <rect x="165" y="38" width="16" height="8" fill="#18181b" stroke="#52525b" strokeWidth="1" rx="1" />
        
        {/* Belt motion flow */}
        <line x1="35" y1="99" x2="165" y2="99" stroke="#10b981" strokeWidth="1.5" strokeDasharray="8 8" className="belt-flow" />

        {/* Runner Stick Figure */}
        <g className="runner-skeleton">
          {/* Head */}
          <circle cx="100" cy="35" r="5" fill="#3b82f6" />
          {/* Torso */}
          <line x1="100" y1="40" x2="98" y2="60" stroke="#52525b" strokeWidth="3" strokeLinecap="round" />
          {/* Left Arm */}
          <path d="M 100,43 L 88,48 L 78,42" fill="none" stroke="#a1a1aa" strokeWidth="2" strokeLinecap="round" />
          {/* Right Arm */}
          <path d="M 100,43 L 112,48 L 105,58" fill="none" stroke="#71717a" strokeWidth="2" strokeLinecap="round" />
          {/* Left Leg */}
          <path d="M 98,60 L 85,73 L 95,88" fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" />
          {/* Right Leg */}
          <path d="M 98,60 L 108,71 L 115,85" fill="none" stroke="#047857" strokeWidth="2.5" strokeLinecap="round" />
        </g>
      </svg>
    );
  }

  // Cardio Machine: Cycling (Stationary Bike)
  if (normalizedId.includes("bike") || normalizedId.includes("cycling")) {
    return (
      <svg viewBox="0 0 200 120" className="w-full h-full" aria-hidden="true">
        <style>{`
          @keyframes pedaling {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          .pedal-wheel {
            transform-origin: 100px 75px;
            animation: pedaling 1.5s infinite linear;
          }
        `}</style>
        {/* Bike Frame */}
        <path d="M 60,95 L 90,60 L 130,60 L 100,75 Z M 100,75 L 85,95 M 130,60 L 135,45 M 90,60 L 88,50" fill="none" stroke="#3f3f46" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        {/* Feet bases */}
        <line x1="45" y1="95" x2="155" y2="95" stroke="#27272a" strokeWidth="2" />
        
        {/* Flywheel */}
        <circle cx="100" cy="75" r="16" fill="none" stroke="#10b981" strokeWidth="2" strokeOpacity="0.3" />
        
        {/* Pedaling System */}
        <g className="pedal-wheel">
          <line x1="100" y1="75" x2="100" y2="60" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="100" y1="75" x2="100" y2="90" stroke="#047857" strokeWidth="2.5" strokeLinecap="round" />
          <rect x="94" y="56" width="12" height="4" fill="#3b82f6" rx="1" />
          <rect x="94" y="90" width="12" height="4" fill="#3b82f6" rx="1" />
        </g>
        
        {/* Cyclist stick figure */}
        <g>
          {/* Head */}
          <circle cx="115" cy="30" r="5" fill="#3b82f6" />
          {/* Torso */}
          <path d="M 115,35 L 95,58" fill="none" stroke="#52525b" strokeWidth="3" strokeLinecap="round" />
          {/* Arm to Handlebar */}
          <path d="M 112,38 L 128,45 L 135,45" fill="none" stroke="#a1a1aa" strokeWidth="2" strokeLinecap="round" />
        </g>
      </svg>
    );
  }

  // Cardio Machine: Elliptical Trainer
  if (normalizedId.includes("elliptical")) {
    return (
      <svg viewBox="0 0 200 120" className="w-full h-full" aria-hidden="true">
        <style>{`
          @keyframes glide1 {
            0%, 100% { transform: translate(-8px, 4px); }
            50% { transform: translate(8px, -4px); }
          }
          @keyframes glide2 {
            0%, 100% { transform: translate(8px, -4px); }
            50% { transform: translate(-8px, 4px); }
          }
          .glide-left { animation: glide1 2s infinite ease-in-out; }
          .glide-right { animation: glide2 2s infinite ease-in-out; }
        `}</style>
        {/* Machine base */}
        <line x1="30" y1="95" x2="170" y2="95" stroke="#3f3f46" strokeWidth="3.5" strokeLinecap="round" />
        <path d="M 50,95 L 80,40 M 150,95 L 140,40" fill="none" stroke="#27272a" strokeWidth="2.5" />
        
        {/* Handles */}
        <g className="glide-left">
          <line x1="80" y1="40" x2="70" y2="15" stroke="#52525b" strokeWidth="2" strokeLinecap="round" />
          <path d="M 60,90 L 100,90" fill="none" stroke="#10b981" strokeWidth="3" strokeLinecap="round" />
        </g>
        <g className="glide-right">
          <line x1="140" y1="40" x2="150" y2="15" stroke="#52525b" strokeWidth="2" strokeLinecap="round" />
          <path d="M 100,90 L 140,90" fill="none" stroke="#047857" strokeWidth="3" strokeLinecap="round" />
        </g>
        
        {/* User stick head */}
        <circle cx="105" cy="32" r="5" fill="#3b82f6" />
        <line x1="105" y1="37" x2="105" y2="60" stroke="#52525b" strokeWidth="3" />
      </svg>
    );
  }

  // Cardio Machine: Rowing Machine (Rower)
  if (normalizedId.includes("rower") || normalizedId.includes("rowing")) {
    return (
      <svg viewBox="0 0 200 120" className="w-full h-full" aria-hidden="true">
        <style>{`
          @keyframes seatMove {
            0%, 100% { transform: translateX(35px); }
            50% { transform: translateX(-15px); }
          }
          @keyframes cablePull {
            0%, 100% { x2: 120; y2: 60; }
            50% { x2: 70; y2: 60; }
          }
          .seat-flow { animation: seatMove 2.5s infinite ease-in-out; }
          .cable-flow { animation: cablePull 2.5s infinite ease-in-out; }
        `}</style>
        {/* Rower rail */}
        <line x1="30" y1="85" x2="170" y2="85" stroke="#3f3f46" strokeWidth="3" strokeLinecap="round" />
        <rect x="150" y="55" width="22" height="30" fill="#18181b" stroke="#3f3f46" rx="2" />
        <circle cx="161" cy="70" r="8" fill="none" stroke="#10b981" strokeWidth="2.5" strokeOpacity="0.3" />

        {/* Pulling Cable */}
        <line x1="150" y1="60" x2="120" y2="60" stroke="#10b981" strokeWidth="1.5" className="cable-flow" />

        {/* Stick Figure & Seat */}
        <g className="seat-flow">
          {/* Seat slider wheel */}
          <circle cx="80" cy="83" r="3" fill="#3b82f6" />
          <rect x="70" y="76" width="20" height="4" fill="#3f3f46" rx="1" />
          
          {/* Head */}
          <circle cx="78" cy="42" r="5" fill="#3b82f6" />
          {/* Spine */}
          <line x1="78" y1="47" x2="80" y2="76" stroke="#52525b" strokeWidth="3" strokeLinecap="round" />
          {/* Arm holding cable */}
          <line x1="78" y1="52" x2="45" y2="60" stroke="#a1a1aa" strokeWidth="2" strokeLinecap="round" />
          {/* Leg knee joint */}
          <path d="M 80,76 L 105,65 L 120,83" fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        </g>
      </svg>
    );
  }

  // 1. Squats & Quads & Leg Press
  if (
    normalizedId.includes("squat") || 
    normalizedId.includes("press-leg") || 
    normalizedId === "leg-press" || 
    normalizedId.includes("leg-extension") ||
    normalizedId.includes("extension-leg")
  ) {
    return (
      <svg viewBox="0 0 200 120" className="w-full h-full" aria-hidden="true">
        <style>{`
          @keyframes squatMovement {
            0%, 100% { transform: translateY(12px); }
            50% { transform: translateY(45px); }
          }
          @keyframes quadPulse {
            0%, 100% { fill: rgba(16, 185, 129, 0.15); stroke: rgba(16, 185, 129, 0.35); }
            50% { fill: rgba(16, 185, 129, 0.8); stroke: rgba(16, 185, 129, 1); }
          }
          .barbell-squat { animation: squatMovement 3.2s infinite ease-in-out; }
          .quads-active { animation: quadPulse 3.2s infinite ease-in-out; }
        `}</style>
        <line x1="20" y1="105" x2="180" y2="105" stroke="#27272a" strokeWidth="2" />
        <rect x="50" y="105" width="100" height="4" fill="#3f3f46" rx="1" />
        
        {/* Glowing Active Zones */}
        <path d="M 86,76 Q 93,60 100,56 Q 107,60 114,76 Z" className="quads-active" fill="rgba(16, 185, 129, 0.15)" stroke="rgba(16, 185, 129, 0.3)" strokeWidth="1.5" />
        
        {/* Biomechanical joints system skeleton */}
        <path d="M 100,32 L 100,56 L 86,76 L 100,105 M 100,56 L 114,76 L 100,105" stroke="#52525b" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="100" cy="56" r="3" fill="#3b82f6" />
        <circle cx="86" cy="76" r="3" fill="#3b82f6" />
        <circle cx="114" cy="76" r="3" fill="#3b82f6" />

        {/* Moving Barbell weight loads */}
        <g className="barbell-squat">
          <line x1="42" y1="28" x2="158" y2="28" stroke="#a1a1aa" strokeWidth="3" strokeLinecap="round" />
          <rect x="50" y="13" width="8" height="30" fill="#10b981" rx="2" />
          <rect x="44" y="18" width="5" height="20" fill="#047857" rx="1" />
          <rect x="142" y="13" width="8" height="30" fill="#10b981" rx="2" />
          <rect x="151" y="18" width="5" height="20" fill="#047857" rx="1" />
          <path d="M 100,28 L 100,60" stroke="rgba(16, 185, 129, 0.25)" strokeWidth="1" strokeDasharray="3 3" />
        </g>
      </svg>
    );
  }

  {/* 2. Chest Press / Push-ups / Chest Flyes */}
  if (
    normalizedId.includes("bench-press") || 
    normalizedId.includes("push-up") || 
    normalizedId.includes("fly") || 
    normalizedId.includes("chest")
  ) {
    return (
      <svg viewBox="0 0 200 120" className="w-full h-full" aria-hidden="true">
        <style>{`
          @keyframes pressMovement {
            0%, 100% { transform: translateY(45px); }
            50% { transform: translateY(12px); }
          }
          @keyframes chestPulse {
            0%, 100% { fill: rgba(16, 185, 129, 0.8); stroke: rgba(16, 185, 129, 1); }
            50% { fill: rgba(16, 185, 129, 0.15); stroke: rgba(16, 185, 129, 0.35); }
          }
          .load { animation: pressMovement 3s infinite ease-in-out; }
          .chest-active { animation: chestPulse 3s infinite ease-in-out; }
        `}</style>
        <line x1="20" y1="95" x2="180" y2="95" stroke="#27272a" strokeWidth="2" />
        <rect x="45" y="80" width="110" height="15" fill="#18181b" rx="2" stroke="#27272a" strokeWidth="1" />
        <rect x="75" y="95" width="50" height="10" fill="#3f3f46" />

        {/* Lying flat stick figure */}
        <line x1="60" y1="75" x2="140" y2="75" stroke="#52525b" strokeWidth="4" strokeLinecap="round" />
        <circle cx="50" cy="73" r="6" fill="#52525b" />
        
        {/* glowing active pecs zones */}
        <circle cx="100" cy="68" r="10" className="chest-active" fill="rgba(16, 185, 129, 0.15)" stroke="rgba(16, 185, 129, 0.3)" strokeWidth="1.5" />
        
        {/* arm links joints */}
        <path d="M 100,75 L 85,56 L 100,34" stroke="#52525b" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="85" cy="56" r="2.5" fill="#3b82f6" />

        {/* moving barbell or dumbbells loads */}
        <g className="load">
          <line x1="42" y1="0" x2="158" y2="0" stroke="#a1a1aa" strokeWidth="3" strokeLinecap="round" />
          <rect x="50" y="-15" width="8" height="30" fill="#10b981" rx="2" />
          <rect x="142" y="-15" width="8" height="30" fill="#10b981" rx="2" />
          <line x1="100" y1="0" x2="100" y2="35" stroke="rgba(16, 185, 129, 0.25)" strokeWidth="1" strokeDasharray="3 3" />
        </g>
      </svg>
    );
  }

  {/* 3. Deadlifts & Posterior Hinges */}
  if (
    normalizedId.includes("deadlift") || 
    normalizedId.includes("thrust") || 
    normalizedId.includes("bridge") || 
    normalizedId.includes("hinge") ||
    normalizedId.includes("good-morning")
  ) {
    return (
      <svg viewBox="0 0 200 120" className="w-full h-full" aria-hidden="true">
        <style>{`
          @keyframes hingeMovement {
            0%, 100% { transform: translate(0px, 45px); }
            50% { transform: translate(12px, 0px); }
          }
          @keyframes backPulse {
            0%, 100% { fill: rgba(16, 185, 129, 0.15); stroke: rgba(16, 185, 129, 0.35); }
            50% { fill: rgba(16, 185, 129, 0.8); stroke: rgba(16, 185, 129, 1); }
          }
          .bar { animation: hingeMovement 3.4s infinite ease-in-out; }
          .posterior-active { animation: backPulse 3.4s infinite ease-in-out; }
        `}</style>
        <line x1="20" y1="105" x2="180" y2="105" stroke="#27272a" strokeWidth="2" />

        {/* Highlighted Posterior Chain active zones */}
        <path d="M 65,35 Q 75,55 90,65 Q 85,80 80,105" className="posterior-active" fill="none" stroke="rgba(16, 185, 129, 0.3)" strokeWidth="5" strokeLinecap="round" />
        
        {/* Stick figure bending spine */}
        <path d="M 60,30 L 80,60 L 80,105" stroke="#52525b" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="56" cy="24" r="5" fill="#52525b" />
        
        {/* moving deadlift bar */}
        <g className="bar">
          <circle cx="100" cy="50" r="10" fill="#10b981" />
          <circle cx="100" cy="50" r="6" fill="#047857" />
          <line x1="100" y1="50" x2="60" y2="30" stroke="#a1a1aa" strokeWidth="1.5" strokeDasharray="3 3" />
        </g>
      </svg>
    );
  }

  {/* 4. Overhead Pulls (Pull-Up/Chin-Up/Lat Pulldown) */}
  if (
    normalizedId.includes("pulldown") || 
    normalizedId.includes("pull-up") || 
    normalizedId.includes("chin-up")
  ) {
    return (
      <svg viewBox="0 0 200 120" className="w-full h-full" aria-hidden="true">
        <style>{`
          @keyframes pulldownAnim {
            0%, 100% { transform: translateY(5px); }
            50% { transform: translateY(35px); }
          }
          @keyframes latsHighlight {
            0%, 100% { fill: rgba(16, 185, 129, 0.15); stroke: rgba(16, 185, 129, 0.35); }
            50% { fill: rgba(16, 185, 129, 0.85); stroke: rgba(16, 185, 129, 1); }
          }
          .pulldown-load { animation: pulldownAnim 3.2s infinite ease-in-out; }
          .lats-active { animation: latsHighlight 3.2s infinite ease-in-out; }
        `}</style>
        <line x1="20" y1="105" x2="180" y2="105" stroke="#27272a" strokeWidth="2" />
        
        {/* Seated torso stick figure */}
        <path d="M 100,50 L 100,85 L 85,105 M 100,85 L 115,105" stroke="#52525b" strokeWidth="3" strokeLinecap="round" />
        <circle cx="100" cy="42" r="5.5" fill="#52525b" />
        <path d="M 92,60 Q 100,52 108,60" className="lats-active" fill="none" stroke="rgba(16, 185, 129, 0.3)" strokeWidth="4" strokeLinecap="round" />

        {/* Pulley cable and weights loading */}
        <line x1="100" y1="10" x2="100" y2="15" stroke="#27272a" strokeWidth="3" />
        <circle cx="100" cy="15" r="5" fill="#3f3f46" />
        
        <g className="pulldown-load">
          <line x1="60" y1="15" x2="140" y2="15" stroke="#a1a1aa" strokeWidth="2.5" strokeLinecap="round" />
          <rect x="65" y="10" width="12" height="6" fill="#10b981" rx="1" />
          <rect x="123" y="10" width="12" height="6" fill="#10b981" rx="1" />
          <path d="M 100,50 L 80,30 L 70,15 M 100,50 L 120,30 L 130,15" stroke="#52525b" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        </g>
      </svg>
    );
  }

  {/* 5. Horizontal Rows */}
  if (normalizedId.includes("row")) {
    return (
      <svg viewBox="0 0 200 120" className="w-full h-full" aria-hidden="true">
        <style>{`
          @keyframes rowMovement {
            0%, 100% { transform: translateX(45px); }
            50% { transform: translateX(10px); }
          }
          @keyframes backLatsPulse {
            0%, 100% { fill: rgba(16, 185, 129, 0.15); stroke: rgba(16, 185, 129, 0.35); }
            50% { fill: rgba(16, 185, 129, 0.8); stroke: rgba(16, 185, 129, 1); }
          }
          .handle { animation: rowMovement 2.8s infinite ease-in-out; }
          .lats-active { animation: backLatsPulse 2.8s infinite ease-in-out; }
        `}</style>
        <line x1="20" y1="100" x2="180" y2="100" stroke="#27272a" strokeWidth="2" />
        
        {/* Pulley Machine structure */}
        <line x1="40" y1="20" x2="40" y2="100" stroke="#27272a" strokeWidth="3" />
        <circle cx="40" cy="25" r="6" fill="#3f3f46" />

        {/* Lats zone pulse */}
        <path d="M 120,40 C 110,48 110,62 120,70 Z" className="lats-active" fill="rgba(16, 185, 129, 0.15)" stroke="rgba(16, 185, 129, 0.35)" strokeWidth="1.5" />

        {/* Torso seated figure */}
        <path d="M 130,35 L 130,80 L 110,100" stroke="#52525b" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="130" cy="26" r="6" fill="#52525b" />

        {/* arm reach retract */}
        <g className="handle">
          <line x1="40" y1="25" x2="90" y2="25" stroke="#a1a1aa" strokeWidth="1.5" />
          <rect x="90" y="15" width="4" height="20" fill="#10b981" rx="1" />
          <path d="M 130,45 L 110,38 L 92,25" stroke="#52525b" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        </g>
      </svg>
    );
  }

  {/* 6. Shoulder Press / Overhead Deltoids */}
  if (
    normalizedId.includes("shoulder-press") || 
    normalizedId.includes("overhead-press") || 
    normalizedId.includes("pike-push") || 
    normalizedId.includes("military-press")
  ) {
    return (
      <svg viewBox="0 0 200 120" className="w-full h-full" aria-hidden="true">
        <style>{`
          @keyframes pressShoulder {
            0%, 100% { transform: translateY(50px); }
            50% { transform: translateY(12px); }
          }
          @keyframes shoulderHighlight {
            0%, 100% { fill: rgba(16, 185, 129, 0.15); stroke: rgba(16, 185, 129, 0.35); }
            50% { fill: rgba(16, 185, 129, 0.85); stroke: rgba(16, 185, 129, 1); }
          }
          .barbell-press { animation: pressShoulder 3s infinite ease-in-out; }
          .shoulders-active { animation: shoulderHighlight 3s infinite ease-in-out; }
        `}</style>
        <line x1="20" y1="105" x2="180" y2="105" stroke="#27272a" strokeWidth="2" />
        
        {/* Standing body stick figure */}
        <path d="M 100,50 L 100,105 M 90,75 L 100,50 L 110,75" stroke="#52525b" strokeWidth="3" strokeLinecap="round" />
        <circle cx="100" cy="42" r="5.5" fill="#52525b" />
        
        {/* Shoulders activation zones */}
        <circle cx="92" cy="50" r="5" className="shoulders-active" fill="rgba(16, 185, 129, 0.15)" stroke="rgba(16, 185, 129, 0.3)" strokeWidth="1" />
        <circle cx="108" cy="50" r="5" className="shoulders-active" fill="rgba(16, 185, 129, 0.15)" stroke="rgba(16, 185, 129, 0.3)" strokeWidth="1" />

        <g className="barbell-press">
          <line x1="42" y1="0" x2="158" y2="0" stroke="#a1a1aa" strokeWidth="3" strokeLinecap="round" />
          <rect x="50" y="-15" width="8" height="30" fill="#10b981" rx="2" />
          <rect x="142" y="-15" width="8" height="30" fill="#10b981" rx="2" />
          <path d="M 100,50 L 90,25 L 85,0 M 100,50 L 110,25 L 115,0" stroke="#52525b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </g>
      </svg>
    );
  }

  {/* 7. Arm Curls (Biceps) */}
  if (normalizedId.includes("curl")) {
    return (
      <svg viewBox="0 0 200 120" className="w-full h-full" aria-hidden="true">
        <style>{`
          @keyframes curlRotation {
            0%, 100% { transform: rotate(0deg); }
            50% { transform: rotate(-75deg); }
          }
          @keyframes bicepPulse {
            0%, 100% { fill: rgba(16, 185, 129, 0.15); stroke: rgba(16, 185, 129, 0.35); }
            50% { fill: rgba(16, 185, 129, 0.8); stroke: rgba(16, 185, 129, 1); }
          }
          .forearm-pivot { 
            transform-origin: 100px 70px;
            animation: curlRotation 3s infinite ease-in-out; 
          }
          .biceps-active { animation: bicepPulse 3s infinite ease-in-out; }
        `}</style>
        <line x1="20" y1="100" x2="180" y2="100" stroke="#27272a" strokeWidth="2" />

        {/* Upper arm stick link */}
        <line x1="100" y1="35" x2="100" y2="70" stroke="#52525b" strokeWidth="4.5" strokeLinecap="round" />
        <circle cx="100" cy="26" r="6" fill="#52525b" />
        
        {/* Active Biceps zone */}
        <circle cx="96" cy="50" r="7" className="biceps-active" fill="rgba(16, 185, 129, 0.15)" stroke="rgba(16, 185, 129, 0.35)" strokeWidth="1.5" />

        {/* Pivot Forearm & Weight */}
        <g className="forearm-pivot">
          <line x1="100" y1="70" x2="100" y2="105" stroke="#52525b" strokeWidth="3" strokeLinecap="round" />
          <circle cx="100" cy="105" r="8" fill="#10b981" />
          <circle cx="100" cy="105" r="4" fill="#047857" />
        </g>

        {/* Elbow Joint base */}
        <circle cx="100" cy="70" r="3.5" fill="#3b82f6" />
      </svg>
    );
  }

  {/* 8. Tricep Extension & Pushdowns */}
  if (
    normalizedId.includes("pushdown") || 
    normalizedId.includes("tricep-extension") || 
    normalizedId.includes("skull-crusher") || 
    normalizedId.includes("crusher")
  ) {
    return (
      <svg viewBox="0 0 200 120" className="w-full h-full" aria-hidden="true">
        <style>{`
          @keyframes extendRotation {
            0%, 100% { transform: rotate(0deg); }
            50% { transform: rotate(70deg); }
          }
          @keyframes tricepHighlight {
            0%, 100% { fill: rgba(16, 185, 129, 0.15); stroke: rgba(16, 185, 129, 0.35); }
            50% { fill: rgba(16, 185, 129, 0.85); stroke: rgba(16, 185, 129, 1); }
          }
          .tricep-forearm-pivot { 
            transform-origin: 100px 50px;
            animation: extendRotation 2.8s infinite ease-in-out; 
          }
          .triceps-active { animation: tricepHighlight 2.8s infinite ease-in-out; }
        `}</style>
        <line x1="20" y1="100" x2="180" y2="100" stroke="#27272a" strokeWidth="2" />
        
        {/* High cable support */}
        <line x1="100" y1="10" x2="100" y2="20" stroke="#27272a" strokeWidth="3" />
        
        {/* Upper arm stick link */}
        <line x1="100" y1="25" x2="100" y2="50" stroke="#52525b" strokeWidth="4.5" strokeLinecap="round" />
        <circle cx="102" cy="38" r="6.5" className="triceps-active" fill="rgba(16, 185, 129, 0.15)" stroke="rgba(16, 185, 129, 0.35)" strokeWidth="1.5" />

        <g className="tricep-forearm-pivot">
          {/* Forearm pivoting downward to locked state */}
          <line x1="100" y1="50" x2="100" y2="85" stroke="#52525b" strokeWidth="3" strokeLinecap="round" />
          <circle cx="100" cy="85" r="8" fill="#10b981" />
          {/* Cable shaft */}
          <line x1="100" y1="20" x2="100" y2="85" stroke="#a1a1aa" strokeWidth="1" strokeDasharray="2 2" />
        </g>
        <circle cx="100" cy="50" r="3.5" fill="#3b82f6" />
      </svg>
    );
  }

  {/* 9. Lateral Raises */}
  if (normalizedId.includes("lateral-raise") || normalizedId.includes("raise")) {
    return (
      <svg viewBox="0 0 200 120" className="w-full h-full" aria-hidden="true">
        <style>{`
          @keyframes raiseRotationLeft {
            0%, 100% { transform: rotate(0deg); }
            50% { transform: rotate(75deg); }
          }
          @keyframes raiseRotationRight {
            0%, 100% { transform: rotate(0deg); }
            50% { transform: rotate(-75deg); }
          }
          @keyframes lateralHighlight {
            0%, 100% { fill: rgba(16, 185, 129, 0.15); stroke: rgba(16, 185, 129, 0.35); }
            50% { fill: rgba(16, 185, 129, 0.85); stroke: rgba(16, 185, 129, 1); }
          }
          .left-arm-pivot { 
            transform-origin: 90px 45px;
            animation: raiseRotationLeft 3s infinite ease-in-out; 
          }
          .right-arm-pivot { 
            transform-origin: 110px 45px;
            animation: raiseRotationRight 3s infinite ease-in-out; 
          }
          .deltoid-active { animation: lateralHighlight 3s infinite ease-in-out; }
        `}</style>
        <line x1="20" y1="105" x2="180" y2="105" stroke="#27272a" strokeWidth="2" />
        
        {/* Standing body stick figure */}
        <path d="M 100,45 L 100,105" stroke="#52525b" strokeWidth="4" strokeLinecap="round" />
        <circle cx="100" cy="35" r="6" fill="#52525b" />
        
        {/* Side deltoids zones */}
        <circle cx="88" cy="45" r="5" className="deltoid-active" fill="rgba(16, 185, 129, 0.15)" stroke="rgba(16, 185, 129, 0.3)" strokeWidth="1" />
        <circle cx="112" cy="45" r="5" className="deltoid-active" fill="rgba(16, 185, 129, 0.15)" stroke="rgba(16, 185, 129, 0.3)" strokeWidth="1" />

        {/* Left Arm pivoting out */}
        <g className="left-arm-pivot">
          <line x1="90" y1="45" x2="90" y2="85" stroke="#52525b" strokeWidth="2.5" strokeLinecap="round" />
          <circle cx="90" cy="85" r="6" fill="#10b981" />
        </g>

        {/* Right Arm pivoting out */}
        <g className="right-arm-pivot">
          <line x1="110" y1="45" x2="110" y2="85" stroke="#52525b" strokeWidth="2.5" strokeLinecap="round" />
          <circle cx="110" cy="85" r="6" fill="#10b981" />
        </g>
      </svg>
    );
  }

  {/* 10. Core & Planks */}
  if (
    normalizedId.includes("plank") || 
    normalizedId.includes("core") || 
    normalizedId.includes("leg-raise") || 
    normalizedId.includes("crunch") || 
    normalizedId.includes("sit-up")
  ) {
    return (
      <svg viewBox="0 0 200 120" className="w-full h-full" aria-hidden="true">
        <style>{`
          @keyframes coreCrunch {
            0%, 100% { transform: rotate(0deg); }
            50% { transform: rotate(-25deg); }
          }
          @keyframes absHighlight {
            0%, 100% { fill: rgba(16, 185, 129, 0.15); stroke: rgba(16, 185, 129, 0.35); }
            50% { fill: rgba(16, 185, 129, 0.8); stroke: rgba(16, 185, 129, 1); }
          }
          .torso-pivot { 
            transform-origin: 100px 85px;
            animation: coreCrunch 3s infinite ease-in-out; 
          }
          .abs-active { animation: absHighlight 3s infinite ease-in-out; }
        `}</style>
        <line x1="20" y1="95" x2="180" y2="95" stroke="#27272a" strokeWidth="2" />
        
        {/* Legs flat on floor */}
        <line x1="100" y1="85" x2="160" y2="85" stroke="#52525b" strokeWidth="4.5" strokeLinecap="round" />
        <path d="M 160,85 L 170,75" stroke="#52525b" strokeWidth="3" strokeLinecap="round" />

        {/* Pivoting Torso crunching */}
        <g className="torso-pivot">
          <line x1="100" y1="85" x2="60" y2="55" stroke="#52525b" strokeWidth="4" strokeLinecap="round" />
          <circle cx="52" cy="49" r="6" fill="#52525b" />
          <circle cx="82" cy="70" r="8" className="abs-active" fill="rgba(16, 185, 129, 0.15)" stroke="rgba(16, 185, 129, 0.35)" strokeWidth="1.5" />
        </g>
        <circle cx="100" cy="85" r="3.5" fill="#3b82f6" />
      </svg>
    );
  }

  {/* 11. Lunges & Split Squats */}
  if (normalizedId.includes("lunge") || normalizedId.includes("split-squat")) {
    return (
      <svg viewBox="0 0 200 120" className="w-full h-full" aria-hidden="true">
        <style>{`
          @keyframes lungeStep {
            0%, 100% { transform: translateY(10px); }
            50% { transform: translateY(35px); }
          }
          @keyframes lungeHighlight {
            0%, 100% { fill: rgba(16, 185, 129, 0.15); stroke: rgba(16, 185, 129, 0.35); }
            50% { fill: rgba(16, 185, 129, 0.8); stroke: rgba(16, 185, 129, 1); }
          }
          .lunge-body { animation: lungeStep 3.2s infinite ease-in-out; }
          .lunge-active { animation: lungeHighlight 3.2s infinite ease-in-out; }
        `}</style>
        <line x1="20" y1="105" x2="180" y2="105" stroke="#27272a" strokeWidth="2" />
        
        <g className="lunge-body">
          {/* Torso spine */}
          <line x1="100" y1="35" x2="100" y2="60" stroke="#52525b" strokeWidth="3" strokeLinecap="round" />
          <circle cx="100" cy="27" r="5.5" fill="#52525b" />
          
          {/* Front Leg split loaded stance */}
          <path d="M 100,60 L 115,75 L 105,100" stroke="#52525b" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
          {/* Back Leg stretching */}
          <path d="M 100,60 L 75,70 L 60,95" stroke="#52525b" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          
          {/* Thigh highlighted target */}
          <circle cx="108" cy="68" r="6" className="lunge-active" fill="rgba(16, 185, 129, 0.15)" stroke="rgba(16, 185, 129, 0.35)" strokeWidth="1.2" />

          {/* weights in hands */}
          <line x1="90" y1="55" x2="90" y2="70" stroke="#a1a1aa" strokeWidth="2" />
          <circle cx="90" cy="70" r="3.5" fill="#10b981" />
          <line x1="110" y1="55" x2="110" y2="70" stroke="#a1a1aa" strokeWidth="2" />
          <circle cx="110" cy="70" r="3.5" fill="#10b981" />
        </g>
      </svg>
    );
  }

  // 12. Generic biomechanics placeholder SVG
  return (
    <svg viewBox="0 0 200 120" className="w-full h-full" aria-hidden="true">
      <style>{`
        @keyframes pulseTrack {
          0%, 100% { stroke-dashoffset: 0; }
          50% { stroke-dashoffset: 20; }
        }
        .laser-track {
          animation: pulseTrack 4s infinite linear;
        }
      `}</style>
      <circle cx="100" cy="60" r="45" fill="none" stroke="#27272a" strokeWidth="1.5" />
      <circle cx="100" cy="60" r="30" fill="none" stroke="#10b981" strokeOpacity="0.15" />
      <path d="M 60,60 L 140,60 M 100,20 L 100,100" stroke="#27272a" strokeWidth="1" strokeDasharray="3 3" />
      <path d="M 65,35 Q 100,85 135,35" fill="none" stroke="#10b981" strokeWidth="2.5" className="laser-track" strokeDasharray="5 5" strokeLinecap="round" />
      <circle cx="100" cy="60" r="5" fill="#10b981" />
      <circle cx="100" cy="60" r="2.5" fill="#ffffff" />
    </svg>
  );
}

function getFreeExerciseDbFolderName(name: string): string {
  // Convert standard exercise name to yuhonas/free-exercise-db folder name format.
  const overrides: Record<string, string> = {
    "Conventional Deadlift": "Deadlift",
    "Barbell Back Squat": "Barbell_Squat",
    "Barbell Front Squat": "Front_Squat",
    "Pull-Up": "Pullups",
    "Push-Up": "Pushups",
    "Chin-Up": "Chinups",
    "Parallel Bar Dip": "Dips",
    "Mountain Climber": "Mountain_Climbers",
    "Kettlebell Swing": "Kettlebell_Swings",
    "Burpee": "Burpees",
    "Cable Tricep Pushdown": "Tricep_Pushdowns",
    "Cable Chest Fly": "Cable_Crossover",
    "Leg Extension": "Leg_Extensions",
    "Lying Leg Curl": "Lying_Leg_Curls",
    "Machine Calf Raise": "Standing_Calf_Raises",
    "Overhead Dumbbell Tricep Extension": "Dumbbell_Tricep_Extension",
    "Standing Overhead Press": "Military_Press",
    "Seated Cable Row": "Seated_Cable_Rows",
    "Bodyweight Squat": "Bodyweight_Squats",
    "Bodyweight Lunge": "Dumbbell_Lunges",
    "Dumbbell Lunge": "Dumbbell_Lunges",
    "Plank": "Plank",
    "Pike Push-Up": "Pushups",
    "Inverted Row": "Inverted_Row",
    "Glute Bridge": "Glute_Bridge",
    "Diamond Push-Up": "Pushups",
    "Hanging Leg Raise": "Hanging_Leg_Raises",
  };

  const cleanName = name.trim();
  if (overrides[cleanName]) {
    return overrides[cleanName];
  }

  // Fallback formatting: capitalize first letter of each word and join with underscores
  return cleanName
    .replace(/[^a-zA-Z0-9\s-]/g, "") // remove special chars except spaces/hyphens
    .split(/[\s-]+/)                 // split by spaces or hyphens
    .map(word => {
      if (!word) return "";
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .filter(Boolean)
    .join("_");
}

export function ExerciseDetail({
  exercise,
  onClose,
}: {
  exercise: Exercise;
  onClose: () => void;
}) {
  const [activeTab, setActiveTab] = useState<"guide" | "cues" | "safety">("guide");
  const isCardio = exercise.category === "cardio" || exercise.category === "steady-state";

  // Compile setup and execution arrays into a single chronological timeline of steps
  const combinedSteps = useMemo(() => {
    const setupSteps = (exercise.setup || []).map((text) => ({
      type: "Setup Setup",
      text,
    }));
    const executionSteps = (exercise.execution || []).map((text) => ({
      type: "Drive Phase",
      text,
    }));
    return [...setupSteps, ...executionSteps];
  }, [exercise]);

  const [guideStep, setGuideStep] = useState(0);

  const handleNextStep = () => {
    if (guideStep < combinedSteps.length - 1) {
      setGuideStep((prev) => prev + 1);
    }
  };

  const handlePrevStep = () => {
    if (guideStep > 0) {
      setGuideStep((prev) => prev - 1);
    }
  };

  const [viewMode, setViewMode] = useState<"photo" | "biomechanical">("photo");
  const [activePhotoIndex, setActivePhotoIndex] = useState<0 | 1>(0);
  const [isAnimating, setIsAnimating] = useState(true);
  const [photoError, setPhotoError] = useState(false);

  const folderName = useMemo(() => {
    return getFreeExerciseDbFolderName(exercise.name);
  }, [exercise.name]);

  const imageUrls = useMemo(() => {
    return [
      `https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/${folderName}/0.jpg`,
      `https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/${folderName}/1.jpg`
    ];
  }, [folderName]);

  useEffect(() => {
    if (!isAnimating || viewMode !== "photo" || photoError) return;
    const interval = setInterval(() => {
      setActivePhotoIndex((prev) => (prev === 0 ? 1 : 0));
    }, 1800);
    return () => clearInterval(interval);
  }, [isAnimating, viewMode, photoError]);

  const handleImageError = () => {
    setPhotoError(true);
    setViewMode("biomechanical");
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-4 pt-[max(1rem,env(safe-area-inset-top))] supports-[backdrop-filter]:backdrop-blur-lg">
      <Card className="w-full max-w-lg flex flex-col overflow-hidden max-h-[calc(100dvh-2rem)] shadow-2xl rounded-2xl">
        
        {/* Header container */}
        <div className="flex items-start justify-between gap-3 border-b border-card-border p-4">
          <div>
            <div className="flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-wider text-emerald-450 dark:text-emerald-400">
              <span>{exercise.category}</span>
              <span>•</span>
              <span>{exercise.difficulty}</span>
            </div>
            <h2 className="mt-1 text-xl font-bold text-foreground tracking-tight capitalize">
              {exercise.name}
            </h2>
            <p className="mt-1.5 text-xs text-zinc-500 dark:text-zinc-400 flex flex-wrap items-center gap-1 capitalize font-medium">
              <span>{exercise.equipment.join(", ")}</span>
              <span>•</span>
              <span className="text-zinc-450 dark:text-zinc-500 font-bold">{exercise.muscles.slice(0, 3).join(", ")}</span>
            </p>
          </div>
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8 text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-white rounded-lg hover:bg-zinc-100 dark:hover:bg-white/5"
            onClick={onClose}
            aria-label="Close exercise detail modal"
          >
            <X size={20} />
          </Button>
        </div>

        {/* Dynamic Photo/Illustration Screen */}
        <div className="px-4 pt-4 shrink-0">
          <Surface className="aspect-[21/9] border border-surface-border bg-surface rounded-2xl relative overflow-hidden flex items-center justify-center p-0">
            {/* Holographic analysis scanlines backdrop */}
            {viewMode === "biomechanical" && (
              <div className="absolute inset-0 bg-gradient-to-b from-transparent to-zinc-950/20 pointer-events-none" />
            )}
            
            <div className="w-full h-full flex items-center justify-center relative">
              {viewMode === "photo" && !photoError ? (
                <div className="w-full h-full flex items-center justify-center bg-black/40 relative">
                  {/* Photo viewer with smooth fade transition between start/finish */}
                  <img
                    src={imageUrls[0]}
                    alt={`${exercise.name} starting position`}
                    className={`absolute inset-0 w-full h-full object-contain rounded-2xl p-1 transition-opacity duration-500 ${
                      activePhotoIndex === 0 ? "opacity-100 z-10" : "opacity-0 z-0"
                    }`}
                    referrerPolicy="no-referrer"
                    onError={handleImageError}
                  />
                  <img
                    src={imageUrls[1]}
                    alt={`${exercise.name} finishing position`}
                    className={`absolute inset-0 w-full h-full object-contain rounded-2xl p-1 transition-opacity duration-500 ${
                      activePhotoIndex === 1 ? "opacity-100 z-10" : "opacity-0 z-0"
                    }`}
                    referrerPolicy="no-referrer"
                    onError={handleImageError}
                  />
                  
                  {/* Phase labels overlay */}
                  <div className="absolute top-2 left-2 z-20 flex items-center gap-1.5">
                    <span className={`text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded border transition-all duration-300 backdrop-blur ${
                      activePhotoIndex === 0 
                        ? "bg-emerald-500/20 border-emerald-500/35 text-emerald-300"
                        : "bg-surface border-surface-border text-zinc-500 dark:text-zinc-400"
                    }`}>
                      1. Start
                    </span>
                    <span className={`text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded border transition-all duration-300 backdrop-blur ${
                      activePhotoIndex === 1 
                        ? "bg-emerald-500/20 border-emerald-500/35 text-emerald-300"
                        : "bg-surface border-surface-border text-zinc-500 dark:text-zinc-400"
                    }`}>
                      2. Finish
                    </span>
                  </div>

                  {/* Animation indicator overlay */}
                  <div className="absolute bottom-2 left-2 z-20 flex items-center gap-1.5 bg-black/75 dark:bg-zinc-900/80 border border-zinc-800 dark:border-white/5 px-2 py-0.5 rounded-lg backdrop-blur">
                    <button
                      onClick={() => setIsAnimating(!isAnimating)}
                      className="text-[9px] font-bold text-emerald-400 hover:text-white flex items-center gap-1 transition-colors"
                      title={isAnimating ? "Pause loop animation" : "Play loop animation"}
                    >
                      {isAnimating ? (
                        <>
                          <span className="relative flex h-1.5 w-1.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                          </span>
                          <span className="text-[8px] font-extrabold uppercase tracking-widest font-mono">Loop</span>
                        </>
                      ) : (
                        <>
                          <Play size={8} className="fill-emerald-400" />
                          <span className="text-[8px] font-extrabold uppercase tracking-widest">Paused</span>
                        </>
                      )}
                    </button>
                    <span className="text-zinc-600 dark:text-zinc-500 font-normal">|</span>
                    <button 
                      onClick={() => {
                        setIsAnimating(false);
                        setActivePhotoIndex(activePhotoIndex === 0 ? 1 : 0);
                      }}
                      className="text-[8px] font-bold uppercase tracking-widest text-zinc-400 hover:text-white transition-colors"
                    >
                      Step
                    </button>
                  </div>
                </div>
              ) : (
                <div className="w-full h-full p-2 flex items-center justify-center">
                  <ExerciseSvgIllustration exerciseId={exercise.id} />
                </div>
              )}
            </div>
            
            {/* Top-Right Toggle to switch modes */}
            {!photoError && (
              <div className="absolute top-2 right-2 z-20">
                <button
                  onClick={() => setViewMode(viewMode === "photo" ? "biomechanical" : "photo")}
                  className="flex items-center gap-1 text-[9px] font-extrabold uppercase tracking-wider text-foreground hover:text-emerald-500 bg-surface border border-surface-border px-2 py-1 rounded-xl shadow-lg transition-all hover:bg-zinc-100 dark:hover:bg-zinc-800"
                >
                  {viewMode === "photo" ? (
                    <>
                      <Activity size={10} className="text-emerald-500 dark:text-emerald-400" />
                      <span>Vector Path</span>
                    </>
                  ) : (
                    <>
                      <Image size={10} className="text-emerald-500 dark:text-emerald-400" />
                      <span>Photo Guide</span>
                    </>
                  )}
                </button>
              </div>
            )}
            
            {/* Bottom-Right Overlay Label when in biomechanical mode */}
            {viewMode === "biomechanical" && (
              <div className="absolute bottom-2 left-2 flex items-center gap-1 text-[8px] font-bold uppercase tracking-widest text-emerald-500/60 dark:text-emerald-400/60 bg-emerald-500/5 border border-emerald-500/10 px-1.5 py-0.5 rounded backdrop-blur">
                <Activity size={8} className="animate-pulse" />
                <span>Biomechanical Path</span>
              </div>
            )}
          </Surface>
        </div>

        {/* Advanced Segmented Tabs bar control */}
        <div className="px-4 mt-4 shrink-0">
          <div className="flex rounded-xl bg-surface border border-surface-border p-1">
            {[
              { id: "guide", label: "Guide" },
              { id: "cues", label: "Cues" },
              { id: "safety", label: "Safety" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex-1 rounded-lg py-1.5 text-xs font-bold transition-all duration-300 ${
                  activeTab === tab.id
                    ? "bg-card border border-card-border text-foreground shadow"
                    : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Contents Scrollbox */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
          
          {/* TAB 1: Stepper-based Interactive Step Guide */}
          {activeTab === "guide" && (
            <div className="space-y-4">
              {combinedSteps.length > 0 ? (
                <div className="space-y-3">
                  <div className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 pl-1">
                    Step-by-Step Cues
                  </div>

                  {/* Interactive card view */}
                  <div className="p-4 rounded-2xl bg-surface border border-surface-border min-h-[100px] flex flex-col justify-between transition-all duration-300">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-emerald-550/10 border border-emerald-550/20 text-emerald-500 dark:text-emerald-400 font-mono">
                          Phase {guideStep + 1}
                        </span>
                        <span className="text-[10px] font-bold text-zinc-450 dark:text-zinc-500 uppercase tracking-wider">
                          {combinedSteps[guideStep].type}
                        </span>
                      </div>
                      <p className="mt-2.5 text-sm leading-relaxed text-zinc-700 dark:text-zinc-200 font-medium">
                        {combinedSteps[guideStep].text}
                      </p>
                    </div>

                    {/* Step deck buttons */}
                    <div className="flex items-center justify-between border-t border-surface-border pt-3.5 mt-4 select-none">
                      <span className="text-[10px] font-bold text-zinc-450 dark:text-zinc-500 font-mono">
                        Step {guideStep + 1} of {combinedSteps.length}
                      </span>
                      <div className="flex items-center gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7 text-zinc-500 hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-white disabled:opacity-40"
                          disabled={guideStep === 0}
                          onClick={handlePrevStep}
                          aria-label="Previous step"
                        >
                          <ChevronLeft size={16} />
                        </Button>
                        
                        {/* Dot indicator bullets */}
                        <div className="flex gap-1 px-1">
                          {combinedSteps.map((_, i) => (
                            <span
                              key={i}
                              className={`h-1.5 w-1.5 rounded-full transition-all duration-300 ${
                                i === guideStep ? "bg-emerald-500 dark:bg-emerald-400 w-3" : "bg-zinc-250 dark:bg-zinc-800"
                              }`}
                            />
                          ))}
                        </div>

                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7 text-zinc-500 hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-white disabled:opacity-40"
                          disabled={guideStep === combinedSteps.length - 1}
                          onClick={handleNextStep}
                          aria-label="Next step"
                        >
                          <ChevronRight size={16} />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-zinc-500 text-xs p-4 text-center border border-dashed border-zinc-850 rounded-2xl">
                  No execution guides provided.
                </div>
              )}

              {/* YouTube Video Resources selector card */}
              <div className="pt-2 border-t border-white/5">
                <div className="text-[10px] font-extrabold uppercase tracking-widest text-zinc-500 pl-1 mb-2 flex items-center gap-1.5">
                  <Play size={10} className="text-red-500 fill-red-500 animate-pulse" />
                  <span>YouTube Form Guides</span>
                </div>
                <div className="grid gap-2">
                  {[
                    {
                      title: "Form & Setup Masterclass",
                      desc: "Comprehensive physical execution and setup walkthrough.",
                      query: `${exercise.name} exercise form setup execution guide`,
                      color: "border-emerald-500/10 hover:border-emerald-500/25 bg-emerald-500/[0.02]"
                    },
                    {
                      title: "POSTURE CHECK: Avoid Bad Form",
                      desc: "Common joint injuries and execution mistakes to avoid.",
                      query: `${exercise.name} common mistakes bad form gym tutorial`,
                      color: "border-rose-500/10 hover:border-rose-500/25 bg-rose-500/[0.02]"
                    },
                    {
                      title: "Equipment Substitutes & Variations",
                      desc: "Substitute variations matching other available gym gear.",
                      query: `${exercise.name} equipment alternatives variation exercise`,
                      color: "border-sky-500/10 hover:border-sky-500/25 bg-sky-500/[0.02]"
                    }
                  ].map((video) => (
                    <a
                      key={video.title}
                      href={`https://www.youtube.com/results?search_query=${encodeURIComponent(video.query)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`p-3 rounded-xl border transition-all text-left block group ${video.color}`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-xs font-bold text-white group-hover:text-emerald-300 transition-colors">
                            {video.title}
                          </p>
                          <p className="text-[10px] text-zinc-400 mt-0.5 leading-normal">
                            {video.desc}
                          </p>
                        </div>
                        <Play size={14} className="text-zinc-500 group-hover:text-emerald-400 shrink-0 transition-colors" />
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Breathing & Tempo Cues */}
          {activeTab === "cues" && (
            <div className="space-y-3">
              {/* Cardio Physiology Card */}
              {isCardio && (
                <div className="p-3.5 rounded-2xl bg-violet-500/5 border border-violet-500/10">
                  <div className="flex items-center gap-2 mb-2 border-b border-violet-500/10 pb-2">
                    <div className="p-1.5 rounded-lg bg-violet-500/10 text-violet-400 border border-violet-500/20">
                      <Activity size={14} />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white uppercase tracking-wider leading-none">
                        Cardiovascular Physiology
                      </h4>
                      <p className="text-[10px] text-zinc-500 leading-none mt-1">
                        Aerobic zone & metabolic metrics
                      </p>
                    </div>
                  </div>
                  <div className="space-y-2 text-[11px] text-zinc-400">
                    <div className="flex justify-between items-center bg-white/[0.01] p-1.5 rounded border border-white/5">
                      <span className="font-bold text-zinc-300">Target Intensity Zone</span>
                      <span className="text-violet-300 font-extrabold font-mono">
                        {exercise.name.toLowerCase().includes("hiit") || exercise.name.toLowerCase().includes("sprint") ? "Zone 4 (80-90% HRmax)" : "Zone 2 (60-70% HRmax)"}
                      </span>
                    </div>
                    <div className="flex justify-between items-center bg-white/[0.01] p-1.5 rounded border border-white/5">
                      <span className="font-bold text-zinc-300">Est. Energy Expenditure</span>
                      <span className="text-emerald-400 font-extrabold font-mono">
                        {exercise.name.toLowerCase().includes("hiit") || exercise.name.toLowerCase().includes("sprint") ? "12-16 kcal/min" : "7-10 kcal/min"}
                      </span>
                    </div>
                    <p className="text-[10px] text-zinc-500 leading-relaxed italic mt-1.5">
                      Adaptations: Promotes capillary density, increases left ventricular stroke volume, and enhances fat oxidation thresholds.
                    </p>
                  </div>
                </div>
              )}

              {/* Tempo Cue card */}
              <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/5">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
                    <Clock3 size={15} />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider leading-none">
                      Cadence & Tempo
                    </h4>
                    <p className="text-[10px] text-zinc-500 leading-none mt-1">
                      Biomechanical speed intervals
                    </p>
                  </div>
                </div>
                <p className="mt-2.5 text-xs text-zinc-300 leading-relaxed font-semibold">
                  {exercise.tempo || (isCardio ? "Maintain steady state cadence (e.g. 80-90 RPM / 150-180 SPM)" : "3-0-1-0 (3s Eccentric, 0s Stretch, 1s Concentric, 0s Lock)")}
                </p>
              </div>

              {/* Breathing Cue card */}
              <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/5">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-sky-500/10 text-sky-400 border border-sky-500/20">
                    <Heart size={14} />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider leading-none">
                      Intrathoracic Breathing Cues
                    </h4>
                    <p className="text-[10px] text-zinc-500 leading-none mt-1">
                      Oxygenation and core stabilization brace
                    </p>
                  </div>
                </div>
                <p className="mt-2.5 text-xs text-zinc-300 leading-relaxed font-semibold">
                  {exercise.breathing || (isCardio ? "Deep diaphragmatic breathing. Inhale through nose for 2 strides, exhale through mouth for 2 strides." : "Inhale on eccentric loading phase, brace core, and exhale past sticking midrange.")}
                </p>
              </div>

              {/* Progression Formula guidelines */}
              {exercise.progressionTips && exercise.progressionTips.length > 0 && (
                <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/5">
                  <div className="flex items-center gap-2 mb-2 border-b border-white/5 pb-2">
                    <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      <Flame size={14} />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white uppercase tracking-wider leading-none">
                        Progression Blueprint
                      </h4>
                      <p className="text-[10px] text-zinc-500 leading-none mt-1">
                        How to scale load parameters safely
                      </p>
                    </div>
                  </div>
                  <ul className="space-y-1.5 text-[11px] text-zinc-400">
                    {exercise.progressionTips.map((tip, idx) => (
                      <li key={idx} className="flex gap-2 leading-relaxed">
                        <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-emerald-400" />
                        <span>{tip}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: Common Mistakes & Safety */}
          {activeTab === "safety" && (
            <div className="space-y-3">
              
              {/* Common Mistakes box block */}
              {exercise.commonMistakes && exercise.commonMistakes.length > 0 && (
                <div className="p-3.5 rounded-2xl bg-rose-500/5 border border-rose-500/10">
                  <div className="flex items-center gap-1.5 mb-2 text-rose-300">
                    <AlertTriangle size={14} className="text-rose-400" />
                    <h4 className="text-xs font-extrabold uppercase tracking-wider">
                      Critical Form Pitfalls
                    </h4>
                  </div>
                  <ul className="space-y-1.5 text-[11px] text-zinc-400 font-semibold">
                    {exercise.commonMistakes.map((mistake, idx) => (
                      <li key={idx} className="flex gap-2 items-start leading-relaxed">
                        <span className="mt-1 text-rose-500">•</span>
                        <span>{mistake}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Safety Regulations guide */}
              {exercise.safetyTips && exercise.safetyTips.length > 0 && (
                <div className="p-3.5 rounded-2xl bg-emerald-500/5 border border-emerald-500/10">
                  <div className="flex items-center gap-1.5 mb-2 text-emerald-300">
                    <CheckCircle2 size={14} className="text-emerald-400" />
                    <h4 className="text-xs font-extrabold uppercase tracking-wider">
                      Injury Prevention Protocols
                    </h4>
                  </div>
                  <ul className="space-y-1.5 text-[11px] text-zinc-400 font-semibold">
                    {exercise.safetyTips.map((tip, idx) => (
                      <li key={idx} className="flex gap-2 items-start leading-relaxed">
                        <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-emerald-400" />
                        <span>{tip}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
