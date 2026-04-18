"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth-context";

export default function SimpleLogin() {
  const { signIn, signUp } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const result = await signIn(email, password);
      if (result.success) {
        window.location.href = "/dashboard";
        return;
      }
      if (result.error?.toLowerCase().includes("invalid") || result.error?.toLowerCase().includes("not found")) {
        const username = email.split("@")[0].replace(/[^a-zA-Z0-9_]/g, "_");
        const signUpResult = await signUp(email, password, username, "");
        if (signUpResult.success) {
          window.location.href = "/dashboard";
          return;
        }
      }
      alert(result.error || "Authentication failed");
    } catch (error) {
      alert("Error: " + (error instanceof Error ? error.message : String(error)));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-md mx-auto">
      <h1 className="text-2xl mb-4">Simple Login</h1>
      <form onSubmit={handleAuth} className="space-y-4">
        <input type="email" placeholder="Email" value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full p-2 border rounded" required />
        <input type="password" placeholder="Password" value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full p-2 border rounded" required />
        <button type="submit" disabled={loading}
          className="w-full bg-blue-500 text-white p-2 rounded">
          {loading ? "Loading..." : "Login/Signup"}
        </button>
      </form>
    </div>
  );
}
