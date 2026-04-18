"use client";

import { useEffect, Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useConvexAuth } from "convex/react";
import { useAuthStore } from "@/lib/stores/auth";
import { Header } from "@/components/header";
import { DottedBackground } from "@/components/DottedBackground";
import { ImmersiveFeatures } from "@/components/ImmersiveFeatures";
import { FAQSection } from "@/components/FAQSection";
import { WhyGavelogy } from "@/components/WhyGavelogy";
import { LoadingSpinner } from "@/components/LoadingSpinner";

import { Button } from "@/components/ui/button";
import StarBorder from "@/components/ui/StarBorder";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Link from "next/link";
import {
  ArrowRight,
  Check,
} from "lucide-react";
import { motion, useScroll } from "framer-motion";

function StatCounter({ end, label, prefix = "", suffix = "" }: { end: number, label: string, prefix?: string, suffix?: string }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTime: number;
    const duration = 2000; // 2 seconds

    const updateCounter = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      
      const easeOut = 1 - Math.pow(1 - progress, 4);
      setCount(Math.floor(easeOut * end));

      if (progress < 1) {
        requestAnimationFrame(updateCounter);
      }
    };

    requestAnimationFrame(updateCounter);
  }, [end]);

  return (
    <div className="flex flex-col items-center p-2 md:p-4">
      <div className="text-3xl md:text-4xl font-bold text-[#2C2C2C] mb-1">
        {prefix}{count}{suffix}
      </div>
      <div className="text-xs md:text-sm text-[#6C6C6C] font-medium uppercase tracking-wider text-center">
        {label}
      </div>
    </div>
  );
}

function HomeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated: convexAuthenticated, isLoading: convexLoading } = useConvexAuth();
  const { user } = useAuthStore();
  useScroll();
  const allowLanding = searchParams.get("view") === "landing";

  useEffect(() => {
    if (convexLoading || allowLanding) return;
    if (convexAuthenticated) {
      router.replace("/dashboard");
    }
  }, [convexAuthenticated, convexLoading, allowLanding, router]);

  if (convexLoading || (!allowLanding && convexAuthenticated)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" text="Loading..." />
      </div>
    );
  }

  // Handle login/signup button clicks for authenticated users
  const handleAuthAction = (path: string) => {
    if (convexAuthenticated) {
      router.push("/dashboard");
    } else {
      router.push(path);
    }
  };

  const scrollToCourses = (e: React.MouseEvent) => {
    e.preventDefault();
    const element = document.getElementById("pricing");
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    } else {
      // Fallback: if section doesn't exist, navigate to courses page
      window.location.href = "/courses";
    }
  };

  const scrollToFeatures = () => {
    const element = document.getElementById("features");
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <div className="min-h-screen relative">
      {/* Sky-like gradient background with enhanced clouds */}
      <div className="fixed inset-0 bg-linear-to-br from-purple-200 via-blue-100 to-blue-50 -z-10">
        {/* Large cloud decorations - MUCH more visible */}
        <div className="absolute top-10 left-0 w-[600px] h-[400px] bg-purple-200/60 rounded-full blur-2xl"></div>
        <div className="absolute top-20 right-10 w-[550px] h-[350px] bg-blue-300/50 rounded-full blur-2xl"></div>
        <div className="absolute top-40 left-1/3 w-[500px] h-[450px] bg-white/85 rounded-full blur-2xl"></div>
        <div className="absolute bottom-40 left-10 w-[600px] h-[400px] bg-purple-300/50 rounded-full blur-2xl"></div>
        <div className="absolute top-1/2 right-1/4 w-[450px] h-[300px] bg-white/70 rounded-full blur-xl"></div>
        <div className="absolute bottom-20 right-1/3 w-[550px] h-[400px] bg-blue-300/45 rounded-full blur-2xl"></div>
        <div className="absolute top-32 left-1/2 w-[500px] h-[350px] bg-white/75 rounded-full blur-2xl"></div>
        <div className="absolute bottom-60 right-0 w-[600px] h-[450px] bg-blue-200/55 rounded-full blur-2xl"></div>
        {/* Additional smaller clouds for depth */}
        <div className="absolute top-60 left-20 w-[400px] h-[250px] bg-white/60 rounded-full blur-xl"></div>
        <div className="absolute top-80 right-20 w-[380px] h-[280px] bg-blue-200/50 rounded-full blur-xl"></div>
        <div className="absolute bottom-60 left-1/4 w-[420px] h-[300px] bg-purple-200/55 rounded-full blur-xl"></div>
        {/* Even more clouds for ultra dreamy effect */}
        <div className="absolute top-20 left-1/4 w-[450px] h-[300px] bg-white/70 rounded-full blur-xl"></div>
        <div className="absolute bottom-80 right-1/4 w-[400px] h-[320px] bg-blue-300/40 rounded-full blur-xl"></div>
        <div className="absolute top-60 right-1/3 w-[380px] h-[280px] bg-white/60 rounded-full blur-xl"></div>

        {/* Cloud-like shapes using multiple circles */}
        <div className="absolute top-32 left-1/2 -translate-x-1/2">
          <div className="w-[200px] h-[100px] bg-white/75 rounded-full blur-xl"></div>
          <div className="w-[150px] h-[80px] bg-white/75 rounded-full blur-xl -mt-16 ml-8"></div>
          <div className="w-[180px] h-[90px] bg-white/75 rounded-full blur-xl -mt-12 -ml-12"></div>
        </div>

        <div className="absolute bottom-40 right-1/3">
          <div className="w-[180px] h-[90px] bg-blue-300/50 rounded-full blur-xl"></div>
          <div className="w-[140px] h-[70px] bg-blue-300/50 rounded-full blur-xl -mt-14 ml-6"></div>
          <div className="w-[160px] h-[80px] bg-blue-300/50 rounded-full blur-xl -mt-10 -ml-10"></div>
        </div>
      </div>

      {/* Dotted background with scroll-reactive motion */}
      <DottedBackground />

      <Header />

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 md:py-32 relative z-10">
        {/* Floating particles */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <motion.div 
            animate={{ 
              y: [0, -30, 0],
              x: [0, 20, 0],
              rotate: [0, 10, -10, 0],
            }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-[20%] left-[15%] w-12 h-12 bg-linear-to-br from-blue-300/40 to-purple-300/40 rounded-full blur-md"
          />
          <motion.div 
            animate={{ 
              y: [0, 40, 0],
              x: [0, -20, 0],
              rotate: [0, -15, 10, 0],
            }}
            transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
            className="absolute top-[60%] right-[10%] w-16 h-16 bg-linear-to-br from-pink-300/40 to-orange-300/40 rounded-full blur-md"
          />
          <motion.div 
            animate={{ 
              y: [0, -20, 0],
              x: [0, -30, 0],
              scale: [1, 1.2, 1],
            }}
            transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 2 }}
            className="absolute bottom-[20%] left-[25%] w-8 h-8 bg-linear-to-br from-cyan-300/50 to-blue-300/50 rounded-full blur-sm"
          />
        </div>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center max-w-4xl mx-auto"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="inline-block px-6 py-3 bg-linear-to-r from-sky-200/80 via-blue-200/80 to-cyan-200/80 backdrop-blur-sm rounded-full border border-blue-300/30 mb-6 shadow-lg overflow-hidden group relative"
          >
            {/* Shimmer effect - continuous animation instead of hover */}
            <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/40 to-transparent animate-shimmer"></div>

            {/* Gradient spheres */}
            <div className="absolute -top-2 -right-2 w-12 h-12 bg-linear-to-br from-sky-300/60 to-blue-300/60 rounded-full blur-xl"></div>
            <div className="absolute -bottom-2 -left-2 w-10 h-10 bg-linear-to-br from-blue-300/60 to-cyan-300/60 rounded-full blur-lg"></div>

            <span className="text-sm font-medium text-gray-800 relative z-10">
              ✨ Launch Week: New Features Available
            </span>
          </motion.div>

          <h1 className="text-5xl md:text-7xl font-bold mb-6 text-[#2C2C2C] leading-tight">
            <span className="block md:inline">Master</span>{" "}
            <span className="block md:inline animate-gradient-text bg-linear-to-r from-[#6B9BD2] via-[#A793E2] to-[#F8C9D0] bg-clip-text text-transparent drop-shadow-sm pb-2">CLAT PG</span>{" "}
            <span className="block md:inline">with</span>
            <br className="hidden md:block" />
            <span className="block md:inline drop-[0_2px_2px_rgba(0,0,0,0.05)]">Intelligent Learning</span>
          </h1>

          <p className="text-xl text-[#6C6C6C] mb-8 max-w-2xl mx-auto leading-relaxed">
            The only platform that tracks your mistakes, builds your confidence,
            and helps you achieve 75%+ accuracy through systematic practice.
          </p>

          {/* Social Proof Stats */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="grid grid-cols-3 gap-2 md:gap-8 max-w-3xl mx-auto my-10 py-6 md:py-8 bg-white/40 backdrop-blur-md rounded-2xl border border-white/50 shadow-xl"
          >
            <StatCounter end={500} suffix="+" label="Students Enrolled" />
            <StatCounter end={10} suffix="k+" label="Questions Solved" />
            <StatCounter end={75} suffix="%+" label="Avg. Accuracy" />
          </motion.div>

          <div className="flex justify-center">
            <StarBorder
              as="button"
              onClick={scrollToCourses}
              color="#6B9BD2"
              speed="4s"
              className="text-lg"
            >
              Explore our Courses
            </StarBorder>
          </div>

          <p className="text-sm text-gray-500 mt-4">
            Free version available. No credit card required.
          </p>

          {/* Scroll indicator */}
          <motion.div
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="mt-16 cursor-pointer"
            onClick={scrollToFeatures}
          >
            <ArrowRight className="h-6 w-6 text-gray-400 rotate-90 mx-auto hover:text-[#6B9BD2] transition-colors" />
          </motion.div>
        </motion.div>
        

      </section>

      {/* Features Section - Immersive 2-Slide */}
      <div id="features">
        <ImmersiveFeatures />
      </div>

      {/* Courses Section */}
      <section
        id="pricing"
        className="bg-white/60 backdrop-blur-sm py-24 relative z-10"

      >
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center mb-20"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-4 text-[#2C2C2C]">
              Choose Your Course
            </h2>
            <p className="text-[#6C6C6C] text-lg max-w-2xl mx-auto">
              Two comprehensive courses designed to cover all aspects of CLAT PG
              preparation.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {/* Static Subjects Course */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              whileHover={{ y: -8 }}
            >
              <Card className="relative border border-white/40 shadow-xl bg-white/70 backdrop-blur-xl overflow-hidden group hover:shadow-2xl transition-all duration-300">
                <div className="absolute top-4 right-4 z-20">
                  <span className="bg-linear-to-r from-blue-500 to-indigo-500 text-white text-[10px] md:text-xs font-bold px-3 py-1 rounded-full shadow-[0_0_15px_rgba(59,130,246,0.5)] animate-pulse">
                    MOST POPULAR
                  </span>
                </div>
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#6B9BD2]/10 rounded-full blur-3xl"></div>
                <CardHeader className="relative z-10">
                  <CardTitle className="text-2xl text-[#2C2C2C] mb-2">
                    Static Subjects Course
                  </CardTitle>
                  <CardDescription className="text-[#6C6C6C] text-base">
                    13 Law Subjects • 650 Questions • 20 Mock Tests
                  </CardDescription>
                  <div className="text-4xl font-bold text-[#6B9BD2] mt-4">
                    ₹1,999
                  </div>
                </CardHeader>
                <CardContent className="relative z-10">
                  <ul className="space-y-3 text-sm text-[#6C6C6C] mb-8 font-medium">
                    <li className="flex items-start gap-2"><Check className="h-4 w-4 text-green-500 mt-0.5 shrink-0" /> <span className="flex-1">Constitutional Law, Criminal Law, Contract Law</span></li>
                    <li className="flex items-start gap-2"><Check className="h-4 w-4 text-green-500 mt-0.5 shrink-0" /> <span className="flex-1">Torts, Administrative Law, Jurisprudence</span></li>
                    <li className="flex items-start gap-2"><Check className="h-4 w-4 text-green-500 mt-0.5 shrink-0" /> <span className="flex-1">Environmental Law, Property Law, Family Law</span></li>
                    <li className="flex items-start gap-2"><Check className="h-4 w-4 text-green-500 mt-0.5 shrink-0" /> <span className="flex-1">Labour Law, Tax Law, Corporate Law, IPR</span></li>
                    <li className="flex items-start gap-2"><Check className="h-4 w-4 text-green-500 mt-0.5 shrink-0" /> <span className="flex-1">20 Full-length Mock Tests</span></li>
                    <li className="flex items-start gap-2"><Check className="h-4 w-4 text-green-500 mt-0.5 shrink-0" /> <span className="flex-1">Intelligent Mistake Tracking</span></li>
                  </ul>
                  <Button 
                    className="w-full bg-[#6B9BD2] hover:bg-[#5A8FC7] text-white shadow-lg hover:shadow-xl transition-all relative overflow-hidden group/btn"
                    onClick={() => handleAuthAction("/signup")}
                  >
                    <div className="absolute inset-0 -translate-x-full group-hover/btn:animate-shine-sweep bg-linear-to-r from-transparent via-white/30 to-transparent"></div>
                    Buy Now
                  </Button>
                </CardContent>
              </Card>
            </motion.div>

            {/* Contemporary Cases Course */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              whileHover={{ y: -8 }}
            >
              <Card className="relative border border-white/40 shadow-xl bg-white/70 backdrop-blur-xl overflow-hidden group hover:shadow-2xl transition-all duration-300">
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#F8C9D0]/20 rounded-full blur-3xl"></div>
                <CardHeader className="relative z-10">
                  <CardTitle className="text-2xl text-[#2C2C2C] mb-2">
                    Contemporary Cases Course
                  </CardTitle>
                  <CardDescription className="text-[#6C6C6C] text-base">
                    150 Legal Cases • 2023-2025 • Month Quizzes
                  </CardDescription>
                  <div className="text-4xl font-bold text-[#F8C9D0] mt-4">
                    ₹1,499
                  </div>
                </CardHeader>
                <CardContent className="relative z-10">
                  <ul className="space-y-3 text-sm text-[#6C6C6C] mb-8 font-medium">
                    <li className="flex items-start gap-2"><Check className="h-4 w-4 text-green-500 mt-0.5 shrink-0" /> <span className="flex-1">50 Landmark Cases from 2023</span></li>
                    <li className="flex items-start gap-2"><Check className="h-4 w-4 text-green-500 mt-0.5 shrink-0" /> <span className="flex-1">50 Landmark Cases from 2024</span></li>
                    <li className="flex items-start gap-2"><Check className="h-4 w-4 text-green-500 mt-0.5 shrink-0" /> <span className="flex-1">50 Recent Cases from 2025</span></li>
                    <li className="flex items-start gap-2"><Check className="h-4 w-4 text-green-500 mt-0.5 shrink-0" /> <span className="flex-1">Organized by Month</span></li>
                    <li className="flex items-start gap-2"><Check className="h-4 w-4 text-green-500 mt-0.5 shrink-0" /> <span className="flex-1">Month-wise Combined Quizzes</span></li>
                    <li className="flex items-start gap-2"><Check className="h-4 w-4 text-green-500 mt-0.5 shrink-0" /> <span className="flex-1">Regular Updates</span></li>
                  </ul>
                  <Button 
                    className="w-full bg-[#F8C9D0] hover:bg-[#F5B8C3] text-[#2C2C2C] shadow-lg hover:shadow-xl transition-all relative overflow-hidden group/btn"
                    onClick={() => handleAuthAction("/signup")}
                  >
                    <div className="absolute inset-0 -translate-x-full group-hover/btn:animate-shine-sweep bg-linear-to-r from-transparent via-white/50 to-transparent"></div>
                    Buy Now
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Bundle Offer */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mt-16"
          >
            <Card className="inline-block border-0 shadow-xl bg-linear-to-br from-[#F8E38F]/30 to-[#F7C6A1]/30 backdrop-blur-sm">
              <CardContent className="p-8">
                <div className="text-2xl font-bold text-[#2C2C2C] mb-2">
                  Bundle Offer (Save ₹500)
                </div>
                <div className="text-4xl font-bold text-[#6B9BD2] mb-4">
                  ₹2,999{" "}
                  <span className="text-[#6C6C6C] line-through text-2xl">
                    ₹3,498
                  </span>
                </div>
                <Button
                    size="lg"
                    className="bg-[#6B9BD2] hover:bg-[#5A8FC7] text-white shadow-lg hover:shadow-xl transition-all"
                    onClick={() => handleAuthAction("/signup")}
                  >
                    Buy Bundle
                  </Button>
              </CardContent>
            </Card>
          </motion.div>
        </div>
        

      </section>

      {/* FAQ Section */}
      <FAQSection />

      {/* Why Gavelogy Section */}
      <WhyGavelogy />

      {/* Final CTA Section */}
      <section className="container mx-auto px-4 py-24 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center max-w-3xl mx-auto"
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-6 text-[#2C2C2C]">
            Start Your Smarter Law Prep Journey
          </h2>
          <p className="text-xl text-[#6C6C6C] mb-10 leading-relaxed">
            Join thousands of aspirants transforming the way they study. Explore
            summaries, attempt quizzes, and see your confidence grow.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <StarBorder
              as="button"
              onClick={() => handleAuthAction("/signup")}
              color="#6B9BD2"
              speed="5s"
              className="text-lg"
            >
              Start Free Trial
            </StarBorder>
            <Link href="/subjects">
              <Button
                variant="outline"
                size="lg"
                className="text-lg px-10 py-6 border-2 border-gray-300 bg-white/80 backdrop-blur-sm hover:bg-linear-to-r hover:from-blue-500 hover:via-purple-500 hover:to-pink-500 hover:border-transparent hover:text-white transition-all duration-500 relative overflow-hidden group"
              >
                {/* Animated gradient spheres on hover */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                  <div className="absolute -top-4 -left-4 w-24 h-24 bg-linear-to-br from-blue-400/60 to-purple-400/60 rounded-full blur-2xl animate-pulse"></div>
                  <div className="absolute -bottom-4 -right-4 w-20 h-20 bg-linear-to-br from-pink-400/60 to-rose-400/60 rounded-full blur-2xl animate-pulse delay-150"></div>
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 bg-linear-to-br from-purple-400/50 to-blue-400/50 rounded-full blur-xl animate-pulse delay-300"></div>
                </div>
                <span className="relative z-10">View Contemporary Cases</span>
              </Button>
            </Link>
          </div>
        </motion.div>
        

      </section>

      {/* Footer */}
      <footer
        id="about"
        className="border-t border-gray-200/60 py-16 relative z-10 bg-linear-to-b from-transparent to-slate-50/80 backdrop-blur-sm"
      >
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 md:gap-8 mb-12">
            <div className="md:col-span-2 space-y-4">
              <Link href="/?view=landing" className="flex items-center space-x-2">
                <div className="h-8 w-8 rounded-lg bg-[#2C2C2C] flex items-center justify-center">
                  <span className="text-white font-bold text-lg">G</span>
                </div>
                <span className="text-xl font-bold text-[#2C2C2C]">Gavelogy</span>
              </Link>
              <p className="text-[#6C6C6C] text-sm max-w-sm leading-relaxed">
                Empowering law students and aspirants with intelligent mistake tracking, comprehensive case summaries, and adaptive learning for CLAT PG and beyond.
              </p>
            </div>
            
            <div className="space-y-4">
              <h4 className="font-semibold text-[#2C2C2C]">Quick Links</h4>
              <ul className="space-y-2 text-sm text-[#6C6C6C]">
                <li><a href="#features" onClick={(e) => { e.preventDefault(); scrollToFeatures(); }} className="hover:text-[#6B9BD2] transition-colors">Features</a></li>
                <li><a href="#pricing" onClick={scrollToCourses} className="hover:text-[#6B9BD2] transition-colors">Pricing</a></li>
                <li><Link href="/subjects" className="hover:text-[#6B9BD2] transition-colors">Courses</Link></li>
                <li><button onClick={() => handleAuthAction("/login")} className="hover:text-[#6B9BD2] transition-colors">Sign In</button></li>
              </ul>
            </div>

            <div className="space-y-4">
              <h4 className="font-semibold text-[#2C2C2C]">Legal</h4>
              <ul className="space-y-2 text-sm text-[#6C6C6C]">
                <li><a href="#" className="hover:text-[#6B9BD2] transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-[#6B9BD2] transition-colors">Terms of Service</a></li>
                <li><a href="#" className="hover:text-[#6B9BD2] transition-colors">Refund Policy</a></li>
                <li><a href="mailto:support@gavelogy.com" className="hover:text-[#6B9BD2] transition-colors">Contact Us</a></li>
              </ul>
            </div>
          </div>
          
          <div className="pt-8 border-t border-gray-200/60 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-[#6C6C6C]">&copy; 2025 Gavelogy. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner text="Loading..." />
      </div>
    }>
      <HomeContent />
    </Suspense>
  );
}
