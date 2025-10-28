"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { DottedBackground } from "@/components/DottedBackground";

export default function AuthCallback() {
  useEffect(() => {
    window.location.href = "/dashboard";
  }, []);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <DottedBackground />
      <LoadingSpinner text="Processing authentication..." />
    </div>
  );
}
