"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function SubjectsPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/courses");
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <p>Redirecting to courses...</p>
    </div>
  );
}
