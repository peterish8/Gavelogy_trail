"use client";

import { useEffect, Suspense } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/stores/auth";
import { Header } from "@/components/header";
import { DottedBackground } from "@/components/DottedBackground";
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
import { ArrowRight } from "lucide-react";
import { motion, useScroll, useTransform } from "framer-motion";

// Dynamically import larger components
const ImmersiveFeatures = dynamic(() => import('@/components/ImmersiveFeatures').then(mod => mod.ImmersiveFeatures), {
  loading: () => <p>Loading features...</p>,
});
const FAQSection = dynamic(() => import('@/components/FAQSection').then(mod => mod.FAQSection), {
  loading: () => <p>Loading FAQs...</p>,
});
const WhyGavelogy = dynamic(() => import('@/components/WhyGavelogy').then(mod => mod.WhyGavelogy), {
  loading: () => <p>Loading details...</p>,
});


export default function Home() {
  const router = useRouter();
  const { user, isLoading } = useAuthStore();
  const { scrollYProgress } = useScroll();
  const opacity = useTransform(scrollYProgress, [0, 0.3], [1, 0]);

  const handleAuthAction = (path: string) => {
    if (user) {
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
      window.location.href = "/courses";
    }
  };

  return (
    <div className="min-h-screen relative">
      {/* Background */}
      <div className="fixed inset-0 bg-gradient-to-br from-purple-200 via-blue-100 to-blue-50 -z-10">
        {/* Cloud decorations */}
        <div className="absolute top-10 left-0 w-[600px] h-[400px] bg-purple-200/60 rounded-full blur-2xl"></div>
        <div className="absolute top-20 right-10 w-[550px] h-[350px] bg-blue-300/50 rounded-full blur-2xl"></div>
        <div className="absolute top-40 left-1/3 w-[500px] h-[450px] bg-white/85 rounded-full blur-2xl"></div>
        <div className="absolute bottom-40 left-10 w-[600px] h-[400px] bg-purple-300/50 rounded-full blur-2xl"></div>
      </div>

      <DottedBackground />
      <Header />

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 md:py-32 relative z-10">
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
            className="inline-block px-6 py-3 bg-gradient-to-r from-sky-200/80 via-blue-200/80 to-cyan-200/80 backdrop-blur-sm rounded-full border border-blue-300/30 mb-6 shadow-lg relative overflow-hidden group"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
            <span className="text-sm font-medium text-gray-800 relative z-10">
              ✨ Launch Week: New Features Available
            </span>
          </motion.div>

          <h1 className="text-5xl md:text-7xl font-bold mb-6 text-[#2C2C2C] leading-tight">
            <span className="block md:inline">Master</span>{" "}
            <span className="block md:inline text-[#6B9BD2]">CLAT PG</span>{" "}
            <span className="block md:inline">with</span>
            <br className="hidden md:block" />
            <span className="block md:inline">Intelligent Learning</span>
          </h1>

          <p className="text-xl text-[#6C6C6C] mb-10 max-w-2xl mx-auto leading-relaxed">
            The only platform that tracks your mistakes, builds your confidence,
            and helps you achieve 75%+ accuracy through systematic practice.
          </p>

          <div className="flex justify-center">
            <StarBorder as="button" onClick={scrollToCourses} color="#6B9BD2" speed="4s" className="text-lg">
              Explore our Courses
            </StarBorder>
          </div>

          <p className="text-sm text-gray-500 mt-4">
            Free version available. No credit card required.
          </p>

          <motion.div
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="mt-16"
          >
            <ArrowRight className="h-6 w-6 text-gray-400 rotate-90 mx-auto" />
          </motion.div>
        </motion.div>
      </section>

      {/* Dynamically Loaded Sections */}
      <Suspense fallback={<div>Loading...</div>}>
        <ImmersiveFeatures />
        <FAQSection />
        <WhyGavelogy />
      </Suspense>

      {/* Courses Section */}
      <section id="pricing" className="bg-white/60 backdrop-blur-sm py-24 relative z-10">
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
              <Card className="relative border-0 shadow-xl bg-gradient-to-br from-white to-blue-50/50 overflow-hidden group hover:shadow-2xl transition-all duration-300">
                <CardHeader>
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
                <CardContent>
                  <ul className="space-y-2 text-sm text-[#6C6C6C] mb-6">
                    <li>• Constitutional Law, Criminal Law, Contract Law</li>
                    <li>• Torts, Administrative Law, Jurisprudence</li>
                    <li>• Environmental Law, Property Law, Family Law</li>
                  </ul>
                  <Link href="/courses" className="block">
                    <Button className="w-full bg-[#6B9BD2] hover:bg-[#5A8FC7] text-white shadow-lg hover:shadow-xl transition-all">
                      Buy Now
                    </Button>
                  </Link>
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
              <Card className="relative border-0 shadow-xl bg-gradient-to-br from-white to-pink-50/50 overflow-hidden group hover:shadow-2xl transition-all duration-300">
                <CardHeader>
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
                <CardContent>
                  <ul className="space-y-2 text-sm text-[#6C6C6C] mb-6">
                    <li>• 50 Landmark Cases from 2023</li>
                    <li>• 50 Landmark Cases from 2024</li>
                    <li>• 50 Recent Cases from 2025</li>
                  </ul>
                  <Link href="/courses" className="block">
                    <Button className="w-full bg-[#F8C9D0] hover:bg-[#F5B8C3] text-[#2C2C2C] shadow-lg hover:shadow-xl transition-all">
                      Buy Now
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mt-16"
          >
            <Card className="inline-block border-0 shadow-xl bg-gradient-to-br from-[#F8E38F]/30 to-[#F7C6A1]/30 backdrop-blur-sm">
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
                <Link href="/courses">
                  <Button
                    size="lg"
                    className="bg-[#6B9BD2] hover:bg-[#5A8FC7] text-white shadow-lg hover:shadow-xl transition-all"
                  >
                    Buy Bundle
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </section>

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
                className="text-lg px-10 py-6 border-2 border-gray-300 bg-white/80 backdrop-blur-sm hover:bg-white"
              >
                View Contemporary Cases
              </Button>
            </Link>
          </div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer
        id="about"
        className="border-t border-gray-200 py-12 relative z-10 bg-white/60 backdrop-blur-sm"
      >
        <div className="container mx-auto px-4 text-center text-[#6C6C6C]">
          <p>&copy; 2025 Gavelogy. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
