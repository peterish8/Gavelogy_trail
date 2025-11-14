"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import {
  Brain,
  BarChart3,
  Zap,
  Clock,
  FileText,
  Users,
  Shield,
  Target,
  TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import React from "react";

// --- Data Definitions ---

const smarterLearningFeatures = [
  {
    icon: Brain,
    label: "Intelligent Tracking",
    color: "bg-[#6B9BD2]",
    textColor: "text-white",
    delay: 0.1,
  },
  {
    icon: BarChart3,
    label: "Smart Analytics",
    color: "bg-[#D4E1A3]",
    textColor: "text-[#2C2C2C]",
    delay: 0.2,
  },
  {
    icon: Zap,
    label: "Gamified Learning",
    color: "bg-[#F7C6A1]",
    textColor: "text-[#2C2C2C]",
    delay: 0.3,
  },
  {
    icon: Clock,
    label: "Mock Tests",
    color: "bg-[#F8C9D0]",
    textColor: "text-[#2C2C2C]",
    delay: 0.4,
  },
];

const preparationSteps = [
  {
    emoji: "📘",
    color: "bg-[#F8C9D0]",
    title: "Build Conceptual Clarity",
    desc: "CLAT PG tests understanding, not memory. Gavelogy simplifies core law concepts with AI-assisted notes and flashcards.",
  },
  {
    emoji: "⚖️",
    color: "bg-[#A793E2]",
    title: "Master Landmark Judgments",
    desc: "200+ Supreme Court judgments (2023–2025), each with summaries and 10 CLAT PG-style questions to apply knowledge.",
  },
  {
    emoji: "📚",
    color: "bg-[#F7C6A1]",
    title: "Understand PYQs",
    desc: "Analyze PYQs topic-wise, see trends, and revise weak areas using our smart revision tools.",
  },
  {
    emoji: "💡",
    color: "bg-[#D4E1A3]",
    title: "Practice CLAT PG Way",
    desc: "Solve passage-based questions modeled after real CLAT PG papers with instant feedback.",
  },
  {
    emoji: "📈",
    color: "bg-[#F8E38F]",
    title: "Track & Revise",
    desc: "AI analytics show topic accuracy and weak areas. Automatic revision scheduling keeps you sharp.",
  },
  {
    emoji: "🧩",
    color: "bg-[#D8E3ED]",
    title: "Mock Tests & Consistency",
    desc: "Take full-length timed mocks with rank analysis, topic breakdown, and improvement insights.",
  },
];

const communityFeatures = [
    { icon: FileText, label: "Contemporary Cases", color: "bg-[#F8E38F]", delay: 0.1 },
    { icon: Users, label: "Community", color: "bg-[#D8E3ED]", delay: 0.2 },
];

const whyGavelogyFeatures = [
    { icon: Shield, label: "Accuracy" },
    { icon: Target, label: "Adaptive" },
    { icon: Users, label: "Community" },
    { icon: TrendingUp, label: "Analytics" },
];


// --- Sub-components ---

const FeatureIcon = ({ icon: Icon, label, color, textColor, delay }) => (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay }}
      className="flex flex-col items-center"
    >
      <motion.div
        animate={{ y: [0, -10, 0] }}
        transition={{ duration: 2, repeat: Infinity, delay: delay * 3 }}
        className={`w-28 h-28 rounded-3xl ${color} flex items-center justify-center mb-6 shadow-xl`}
      >
        <Icon className={`h-14 w-14 ${textColor}`} />
      </motion.div>
      <p className="text-base font-semibold text-[#2C2C2C]">{label}</p>
    </motion.div>
);

const TimelineStep = ({ step, index }) => (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, delay: index * 0.1 }}
      className="relative flex items-center gap-6"
    >
      <div className={`w-16 h-16 ${step.color} rounded-full shadow-xl flex items-center justify-center text-[#2C2C2C] font-bold text-xl flex-shrink-0 relative z-10`}>
        {index + 1}
      </div>
      <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg p-6 flex-1">
        <div className="text-4xl mb-3">{step.emoji}</div>
        <h3 className="text-lg font-bold text-[#2C2C2C] mb-2">{step.title}</h3>
        <p className="text-sm text-[#6C6C6C]">{step.desc}</p>
      </div>
    </motion.div>
);

const SlideContainer = ({ children, y, gradient }) => (
    <div className="min-h-screen flex items-center justify-center relative snap-start">
        <motion.div style={{ y }} className={`absolute inset-0 ${gradient}`} />
        <div
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage: "radial-gradient(circle, rgba(107, 155, 210, 0.4) 1px, transparent 1px)",
            backgroundSize: "32px 32px",
          }}
        />
        <div className="container mx-auto px-4 py-24 relative z-10">
            {children}
        </div>
    </div>
);

// --- Slide Components ---

const SmarterLearningSlide = ({ y }) => (
    <SlideContainer y={y} gradient="bg-gradient-to-br from-[#A793E2]/20 via-[#D4E1A3]/20 to-transparent">
        <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="max-w-5xl mx-auto text-center"
        >
            <h2 className="text-5xl md:text-7xl font-bold mb-8 text-[#2C2C2C]">
                Smarter Learning.
                <br />
                Effortless Consistency.
            </h2>
            <p className="text-2xl text-[#6C6C6C] mb-16 max-w-4xl mx-auto leading-relaxed">
                Gavelogy combines intelligent mistake tracking, detailed analytics, and gamified practice to turn your preparation into progress you can see.
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-12 mb-16">
                {smarterLearningFeatures.map((feature) => (
                    <FeatureIcon key={feature.label} {...feature} />
                ))}
            </div>
            <motion.p
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.5 }}
              className="text-xl font-semibold text-[#6B9BD2] italic"
            >
              "Every question you solve makes you smarter. Every day you stay consistent brings you closer."
            </motion.p>
        </motion.div>
    </SlideContainer>
);

const PreparationSlide = ({ y }) => (
    <SlideContainer y={y} gradient="bg-gradient-to-br from-[#A793E2]/20 via-[#6B9BD2]/20 to-transparent">
        <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="max-w-6xl mx-auto"
        >
            <h2 className="text-4xl md:text-6xl font-bold mb-12 text-center text-[#2C2C2C]">
                How to Prepare for CLAT PG —<br />
                and How Gavelogy Helps You Excel
            </h2>
            <div className="relative mb-16 max-w-4xl mx-auto">
                <div className="absolute left-8 top-8 w-1 bg-gradient-to-b from-[#6B9BD2] to-[#F8C9D0]" style={{height: 'calc(100% + 4rem)'}}></div>
                <div className="space-y-12 relative">
                    {preparationSteps.map((step, index) => (
                        <TimelineStep key={step.title} step={step} index={index} />
                    ))}
                    <motion.div
                      initial={{ opacity: 0, scale: 0 }}
                      whileInView={{ opacity: 1, scale: 1 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.5, delay: 0.8 }}
                      className="relative flex items-center gap-6 mt-12"
                    >
                      <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full shadow-xl flex items-center justify-center text-[#2C2C2C] font-bold text-xl flex-shrink-0 relative z-10">🏆</div>
                      <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg p-6 flex-1">
                        <div className="text-4xl mb-3">🎯</div>
                        <h3 className="text-lg font-bold text-[#2C2C2C] mb-2">CLAT PG Success!</h3>
                        <p className="text-sm text-[#6C6C6C]">You've mastered all steps and are ready to excel in CLAT PG.</p>
                      </div>
                    </motion.div>
                </div>
            </div>
            <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: 0.6 }}
                className="text-center"
            >
                <p className="text-xl font-semibold text-[#6B9BD2] mb-6">
                    Everything You Need for CLAT PG — in One Intelligent Platform.
                </p>
                <Link href="/subjects">
                    <Button size="lg" className="text-lg px-12 py-7 bg-[#6B9BD2] hover:bg-[#5A8FC7] text-white shadow-lg hover:shadow-xl transition-all">
                        Explore Courses
                    </Button>
                </Link>
            </motion.div>
        </motion.div>
    </SlideContainer>
);

const CommunitySlide = ({ y }) => (
    <SlideContainer y={y} gradient="bg-gradient-to-br from-[#F8E38F]/20 via-[#F8C9D0]/20 to-transparent">
        <div className="grid md:grid-cols-2 gap-12 items-center">
            <motion.div
                initial={{ opacity: 0, x: -50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8 }}
                className="text-left"
            >
                <h2 className="text-5xl md:text-7xl font-bold mb-8 text-[#2C2C2C]">
                    Stay Current.
                    <br />
                    Grow Together.
                </h2>
                <p className="text-2xl text-[#6C6C6C] mb-8 leading-relaxed">
                    Access the most recent Supreme Court judgments from 2023–2025. Join a thriving community of aspirants who learn, compete, and celebrate milestones together.
                </p>
            </motion.div>
            <motion.div
                initial={{ opacity: 0, x: 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8 }}
                className="space-y-8"
            >
                <div className="grid grid-cols-2 gap-8">
                    {communityFeatures.map(feature => (
                        <FeatureIcon key={feature.label} {...feature} icon={feature.icon} textColor="text-[#2C2C2C]" />
                    ))}
                </div>
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8, delay: 0.3 }}
                    className="bg-white/60 backdrop-blur-sm rounded-3xl p-8 shadow-xl"
                >
                    <h3 className="text-2xl font-bold text-[#2C2C2C] mb-6 text-center">Why Gavelogy?</h3>
                    <div className="grid grid-cols-2 gap-6 mb-6">
                        {whyGavelogyFeatures.map(({ icon: Icon, label }) => (
                            <div key={label} className="flex flex-col items-center">
                                <Icon className="h-10 w-10 text-[#6B9BD2] mb-3" />
                                <p className="text-base font-semibold text-[#2C2C2C]">{label}</p>
                            </div>
                        ))}
                    </div>
                    <p className="text-lg font-semibold text-[#6C6C6C] italic text-center">
                        "Built by law graduates, powered by AI, and trusted by thousands of CLAT-PG aspirants."
                    </p>
                </motion.div>
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8, delay: 0.5 }}
                    className="flex justify-center"
                >
                    <Link href="/subjects">
                        <Button size="lg" className="text-lg px-12 py-7 bg-[#6B9BD2] hover:bg-[#5A8FC7] text-white shadow-lg hover:shadow-xl transition-all">
                            Explore our Courses
                        </Button>
                    </Link>
                </motion.div>
            </motion.div>
        </div>
    </SlideContainer>
);

// --- Main Component ---

export function ImmersiveFeatures() {
  const { scrollYProgress } = useScroll();
  const y = useTransform(scrollYProgress, [0, 1], [0, -100]);

  return (
    <section className="relative overflow-hidden py-0">
      <SmarterLearningSlide y={y} />
      <PreparationSlide y={y} />
      <CommunitySlide y={y} />
    </section>
  );
}
