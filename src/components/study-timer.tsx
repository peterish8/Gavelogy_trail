'use client';

import { useState, useEffect, useRef, useCallback } from "react";
import { Play, Pause, RotateCcw, Timer, GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";

interface StudyTimerProps {
  floating?: boolean;
}

export function StudyTimer({ floating = false }: StudyTimerProps) {
  const [time, setTime] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  
  // Drag Physics State
  const [dragY, setDragY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const startYRef = useRef(0);
  const hasResetRef = useRef(false);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRunning) {
      interval = setInterval(() => {
        setTime((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRunning]);

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const toggleTimer = () => setIsRunning(!isRunning);
  
  const resetTimer = useCallback(() => {
    setIsRunning(false);
    setTime(0);
    // Haptic feedback?
    if (navigator.vibrate) navigator.vibrate(10);
  }, []);

  // Pointer Events for Plunger
  const handlePointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Capture pointer to track movement even if mouse leaves the element
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    
    setIsDragging(true);
    startYRef.current = e.clientY - dragY;
    hasResetRef.current = false;
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    
    e.preventDefault();
    const newY = e.clientY - startYRef.current;
    
    // Clamp movement: 0px (top) to 5px (bottom)
    const clampedY = Math.max(0, Math.min(newY, 5));
    setDragY(clampedY);

    // Trigger reset if pushed deep enough
    if (clampedY > 3.5 && !hasResetRef.current) {
        resetTimer();
        hasResetRef.current = true;
        if (navigator.vibrate) navigator.vibrate(20); // Stronger click feel
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    setIsDragging(false);
    setDragY(0); // Spring back
    (e.target as HTMLElement).releasePointerCapture(e.pointerId);
  };

  if (floating) {
      // Keep floating logic separate/simple for now (or adopt same style?)
      // For now, keeping legacy simple timer for floating to avoid complexity there.
      return (
        <div className={cn(
          "flex items-center gap-2 bg-slate-100 rounded-lg p-1.5 px-3 border border-slate-200",
          floating && "shadow-lg bg-white/95 backdrop-blur-sm"
        )}>
          <Timer className="w-4 h-4 text-slate-500" />
          <span className="font-mono font-medium text-slate-700 min-w-[5ch] text-center">
            {formatTime(time)}
          </span>
          <div className="h-4 w-px bg-slate-300 mx-1" />
          <button onClick={toggleTimer} className={cn("p-1 rounded-md transition-colors hover:bg-white", isRunning ? "text-amber-600" : "text-emerald-600")}>
            {isRunning ? <Pause className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current" />}
          </button>
          <button onClick={() => { setIsRunning(false); setTime(0); }} className="p-1 rounded-md text-slate-500 hover:bg-white">
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      );
  }

  // Mechanical Design
  return (
    <div className="flex flex-col items-center gap-1 mx-2 select-none"> {/* Removed negative margin to avoid touching toolbar top */}
      
      {/* The Mechanical Assembly */}
      <div className="relative flex flex-col items-center">
        
        {/* 1. Plunger (The Button) */}
        {/* We use z-10 to stay above neck */}
        <div 
          className={cn(
            "relative z-10 cursor-grab active:cursor-grabbing group",
            !isDragging && "transition-transform duration-300 cubic-bezier(0.34, 1.56, 0.64, 1)" // Spring physics on release
          )}
          style={{ transform: `translateY(${dragY}px)` }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
        >
             {/* Cap (The T top) */}
             <div className="w-3 h-1 bg-gray-400 rounded-sm shadow-sm border border-gray-500 bg-linear-to-b from-gray-300 to-gray-400" />
             {/* Stem */}
             <div className="w-1 h-2 mx-auto bg-gray-300 border-x border-gray-400" />
        </div>

        {/* 3. Body (Clock Face) */}
        {/* Clicking this toggles play/pause */}
        <button 
            onClick={toggleTimer}
            className={cn(
                "relative flex items-center justify-center w-6 h-6 rounded-full shadow-sm border-2 z-20 outline-none transition-all active:scale-95",
                isRunning 
                    ? "bg-amber-50 border-amber-300 text-amber-600 shadow-amber-100" 
                    : "bg-white border-gray-300 text-gray-400 hover:border-blue-400 hover:text-blue-500"
            )}
            title={isRunning ? "Click Face to Pause" : "Click Face to Start"}
        >
            {/* The outer rim highlight */}
            <div className="absolute inset-0.5 rounded-full border border-black/5 pointer-events-none" />
            
            {isRunning ? (
                <Pause className="w-2.5 h-2.5 fill-current" />
            ) : (
                <Play className="w-2.5 h-2.5 fill-current ml-0.5" />
            )}
        </button>

      </div>

      {/* Time Display */}
      <span className={cn(
          "text-[10px] font-mono leading-none tabular-nums mt-0.5",
          isRunning ? "text-amber-600 font-medium" : "text-gray-400"
      )}>
        {formatTime(time)}
      </span>
    </div>
  );
}

/**
 * Floating draggable timer that appears when scrolled past the main timer
 * Only on desktop (hidden on mobile)
 */
interface FloatingTimerProps {
  timerContainerId: string;
}

export function FloatingTimer({ timerContainerId }: FloatingTimerProps) {
  const [visible, setVisible] = useState(false);
  const [position, setPosition] = useState({ x: 20, y: 100 });
  const [isDragging, setIsDragging] = useState(false);
  const [time, setTime] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const dragStart = useRef({ x: 0, y: 0, posX: 0, posY: 0 });

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRunning) {
      interval = setInterval(() => {
        setTime((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRunning]);

  // Check if timer is scrolled out of view
  useEffect(() => {
    const checkVisibility = () => {
      const timerEl = document.getElementById(timerContainerId);
      if (!timerEl) {
        setVisible(false);
        return;
      }
      const rect = timerEl.getBoundingClientRect();
      // Show floating timer when the original is above the viewport
      setVisible(rect.bottom < 0);
    };

    // Listen to window scroll
    window.addEventListener('scroll', checkVisibility);
    
    // Also listen to the content card's scroll (it has overflow-y-auto)
    const contentCard = document.getElementById('content-card');
    if (contentCard) {
      contentCard.addEventListener('scroll', checkVisibility);
    }
    
    // And listen with capture for any nested scrollables
    document.addEventListener('scroll', checkVisibility, true);
    
    // Initial check
    checkVisibility();
    
    return () => {
      window.removeEventListener('scroll', checkVisibility);
      if (contentCard) {
        contentCard.removeEventListener('scroll', checkVisibility);
      }
      document.removeEventListener('scroll', checkVisibility, true);
    };
  }, [timerContainerId]);

  // Dragging logic
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    setIsDragging(true);
    dragStart.current = {
      x: e.clientX,
      y: e.clientY,
      posX: position.x,
      posY: position.y,
    };
  }, [position]);

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - dragStart.current.x;
      const deltaY = e.clientY - dragStart.current.y;
      setPosition({
        x: dragStart.current.posX + deltaX,
        y: dragStart.current.posY + deltaY,
      });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hrs > 0) {
      return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const toggleTimer = () => setIsRunning(!isRunning);
  const resetTimer = () => {
    setIsRunning(false);
    setTime(0);
  };

  if (!visible) return null;

  return (
    <div
      className="fixed z-50 hidden md:flex items-center gap-2 bg-white/95 backdrop-blur-sm rounded-xl shadow-lg border border-slate-200 p-2 px-3 cursor-move select-none"
      style={{
        left: position.x,
        top: position.y,
      }}
      onMouseDown={handleMouseDown}
    >
      <GripVertical className="w-4 h-4 text-slate-400" />
      <Timer className="w-4 h-4 text-slate-500" />
      <span className="font-mono font-semibold text-slate-700 min-w-[5ch] text-center text-sm">
        {formatTime(time)}
      </span>
      <div className="h-4 w-px bg-slate-300" />
      <button 
        onClick={(e) => { e.stopPropagation(); toggleTimer(); }}
        onMouseDown={(e) => e.stopPropagation()}
        className={cn(
           "p-1.5 rounded-md transition-colors hover:bg-slate-100 focus:outline-none",
           isRunning ? "text-amber-600" : "text-emerald-600"
        )}
        title={isRunning ? "Pause" : "Start"}
      >
        {isRunning ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
      </button>
      <button 
        onClick={(e) => { e.stopPropagation(); resetTimer(); }}
        onMouseDown={(e) => e.stopPropagation()}
        className="p-1.5 rounded-md text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-colors focus:outline-none"
        title="Reset"
      >
        <RotateCcw className="w-4 h-4" />
      </button>
    </div>
  );
}
