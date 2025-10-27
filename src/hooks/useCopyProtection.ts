"use client";

import { useEffect } from "react";

export function useCopyProtection() {
  useEffect(() => {
    // COMPLETELY DISABLE copy protection for development
    console.log("Current hostname:", window.location.hostname);

    // Always disable for development - be very permissive
    const isDevelopment = true; // Force disable for now

    if (isDevelopment) {
      console.log(
        "Copy protection COMPLETELY DISABLED for development:",
        window.location.hostname
      );
      return;
    }

    // Prevent right-click context menu
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      return false;
    };

    // Prevent text selection
    const handleSelectStart = (e: Event) => {
      e.preventDefault();
      return false;
    };

    // Prevent drag and drop
    const handleDragStart = (e: DragEvent) => {
      e.preventDefault();
      return false;
    };

    // Prevent keyboard shortcuts for copy/paste/cut
    const handleKeyDown = (e: KeyboardEvent) => {
      // Block Ctrl+C, Ctrl+A, Ctrl+V, Ctrl+X, Ctrl+S, Ctrl+P
      if (
        e.ctrlKey &&
        (e.key === "c" ||
          e.key === "C" ||
          e.key === "a" ||
          e.key === "A" ||
          e.key === "v" ||
          e.key === "V" ||
          e.key === "x" ||
          e.key === "X" ||
          e.key === "s" ||
          e.key === "S" ||
          e.key === "p" ||
          e.key === "P")
      ) {
        e.preventDefault();
        return false;
      }

      // Block F12 (Developer Tools) - Only in production
      if (e.key === "F12" && window.location.hostname !== "localhost") {
        e.preventDefault();
        return false;
      }

      // Block Ctrl+Shift+I (Developer Tools) - Only in production
      if (
        e.ctrlKey &&
        e.shiftKey &&
        e.key === "I" &&
        window.location.hostname !== "localhost"
      ) {
        e.preventDefault();
        return false;
      }

      // Block Ctrl+Shift+C (Element Inspector) - Only in production
      if (
        e.ctrlKey &&
        e.shiftKey &&
        e.key === "C" &&
        window.location.hostname !== "localhost"
      ) {
        e.preventDefault();
        return false;
      }

      // Block Ctrl+U (View Source)
      if (e.ctrlKey && e.key === "u") {
        e.preventDefault();
        return false;
      }
    };

    // Add event listeners
    document.addEventListener("contextmenu", handleContextMenu);
    document.addEventListener("selectstart", handleSelectStart);
    document.addEventListener("dragstart", handleDragStart);
    document.addEventListener("keydown", handleKeyDown);

    // Cleanup function
    return () => {
      document.removeEventListener("contextmenu", handleContextMenu);
      document.removeEventListener("selectstart", handleSelectStart);
      document.removeEventListener("dragstart", handleDragStart);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);
}
