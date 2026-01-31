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

export function ImmersiveFeatures() {
  const { scrollYProgress } = useScroll();
  const y = useTransform(scrollYProgress, [0, 1], [0, -100]);

  return (
    <section className="relative overflow-hidden py-0">
      {/* Slide 1 - Smarter Learning, Effortless Consistency */}
      <div className="min-h-screen flex items-center justify-center relative snap-start">
        {/* Background gradient */}
        <motion.div
          style={{ y }}
          className="absolute inset-0 bg-linear-to-br from-[#A793E2]/20 via-[#D4E1A3]/20 to-transparent"
        />

        {/* Dotted pattern */}
        <div
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage:
              "radial-gradient(circle, rgba(107, 155, 210, 0.4) 1px, transparent 1px)",
            backgroundSize: "32px 32px",
          }}
        />

        <div className="container mx-auto px-4 py-24 relative z-10">
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
              Gavelogy combines intelligent mistake tracking, detailed
              analytics, and gamified practice to turn your preparation into
              progress you can see. From adaptive quizzes to realistic mock
              tests, every feature keeps you focused and consistent.
            </p>

            {/* Feature Icons */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-12 mb-16">
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="flex flex-col items-center"
              >
                <motion.div
                  animate={{ y: [0, -10, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="w-28 h-28 rounded-3xl bg-[#6B9BD2] flex items-center justify-center mb-6 shadow-xl"
                >
                  <Brain className="h-14 w-14 text-white" />
                </motion.div>
                <p className="text-base font-semibold text-[#2C2C2C]">
                  Intelligent Tracking
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="flex flex-col items-center"
              >
                <motion.div
                  animate={{ y: [0, -10, 0] }}
                  transition={{ duration: 2, repeat: Infinity, delay: 0.3 }}
                  className="w-28 h-28 rounded-3xl bg-[#D4E1A3] flex items-center justify-center mb-6 shadow-xl"
                >
                  <BarChart3 className="h-14 w-14 text-[#2C2C2C]" />
                </motion.div>
                <p className="text-base font-semibold text-[#2C2C2C]">
                  Smart Analytics
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="flex flex-col items-center"
              >
                <motion.div
                  animate={{ y: [0, -10, 0] }}
                  transition={{ duration: 2, repeat: Infinity, delay: 0.6 }}
                  className="w-28 h-28 rounded-3xl bg-[#F7C6A1] flex items-center justify-center mb-6 shadow-xl"
                >
                  <Zap className="h-14 w-14 text-[#2C2C2C]" />
                </motion.div>
                <p className="text-base font-semibold text-[#2C2C2C]">
                  Gamified Learning
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.4 }}
                className="flex flex-col items-center"
              >
                <motion.div
                  animate={{ y: [0, -10, 0] }}
                  transition={{ duration: 2, repeat: Infinity, delay: 0.9 }}
                  className="w-28 h-28 rounded-3xl bg-[#F8C9D0] flex items-center justify-center mb-6 shadow-xl"
                >
                  <Clock className="h-14 w-14 text-[#2C2C2C]" />
                </motion.div>
                <p className="text-base font-semibold text-[#2C2C2C]">
                  Mock Tests
                </p>
              </motion.div>
            </div>

            {/* Tagline */}
            <motion.p
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.5 }}
              className="text-xl font-semibold text-[#6B9BD2] italic"
            >
              &quot;Every question you solve makes you smarter. Every day you stay
              consistent brings you closer.&quot;
            </motion.p>
          </motion.div>
        </div>
      </div>

      {/* Slide 2 - How to Prepare for CLAT PG */}
      <div className="min-h-screen flex items-center justify-center relative snap-start">
        {/* Background gradient */}
        <motion.div
          style={{ y }}
          className="absolute inset-0 bg-linear-to-br from-[#A793E2]/20 via-[#6B9BD2]/20 to-transparent"
        />

        {/* Dotted pattern */}
        <div
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage:
              "radial-gradient(circle, rgba(107, 155, 210, 0.4) 1px, transparent 1px)",
            backgroundSize: "32px 32px",
          }}
        />

        <div className="container mx-auto px-4 py-24 relative z-10">
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

            {/* Simple Vertical Timeline */}
            <div className="relative mb-16">
              <div className="relative max-w-4xl mx-auto">
                {/* Timeline Steps */}
                <div className="space-y-12 relative">
                  {/* Simple vertical line */}
                  <div className="absolute left-8 top-8 w-1 bg-linear-to-b from-[#6B9BD2] to-[#F8C9D0]" style={{height: 'calc(100% + 4rem)'}}></div>
                  {[
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
                  ].map((step, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 30 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.6, delay: index * 0.1 }}
                      className="relative flex items-center gap-6"
                    >
                      {/* Circle with number */}
                      <div className={`w-16 h-16 ${step.color} rounded-full shadow-xl flex items-center justify-center text-[#2C2C2C] font-bold text-xl shrink-0 relative z-10`}>
                        {index + 1}
                      </div>
                      
                      {/* Content */}
                      <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg p-6 flex-1">
                        <div className="text-4xl mb-3">{step.emoji}</div>
                        <h3 className="text-lg font-bold text-[#2C2C2C] mb-2">{step.title}</h3>
                        <p className="text-sm text-[#6C6C6C]">{step.desc}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
                
                  {/* Trophy at the end */}
                  <motion.div
                    initial={{ opacity: 0, scale: 0 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: 0.8 }}
                    className="relative flex items-center gap-6 mt-12"
                  >
                    {/* Final circle */}
                    <div className="w-16 h-16 bg-linear-to-br from-yellow-400 to-yellow-600 rounded-full shadow-xl flex items-center justify-center text-[#2C2C2C] font-bold text-xl shrink-0 relative z-10">
                      🏆
                    </div>
                    
                    {/* Content */}
                    <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg p-6 flex-1">
                      <div className="text-4xl mb-3">🎯</div>
                      <h3 className="text-lg font-bold text-[#2C2C2C] mb-2">CLAT PG Success!</h3>
                      <p className="text-sm text-[#6C6C6C]">You&apos;ve mastered all steps and are ready to excel in CLAT PG.</p>
                    </div>
                  </motion.div>
              </div>
            </div>

            {/* CTA */}
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
                <Button
                  size="lg"
                  className="text-lg px-12 py-7 bg-[#6B9BD2] hover:bg-[#5A8FC7] text-white shadow-lg hover:shadow-xl transition-all"
                >
                  Explore Courses
                </Button>
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* Slide 3 - Stay Current. Grow Together. */}
      <div className="min-h-screen flex items-center justify-center relative snap-start">
        {/* Background gradient */}
        <motion.div
          style={{ y }}
          className="absolute inset-0 bg-linear-to-br from-[#F8E38F]/20 via-[#F8C9D0]/20 to-transparent"
        />

        {/* Dotted pattern */}
        <div
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage:
              "radial-gradient(circle, rgba(248, 201, 208, 0.4) 1px, transparent 1px)",
            backgroundSize: "32px 32px",
          }}
        />

        <div className="container mx-auto px-4 py-24 relative z-10">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Left side - Text content */}
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
                Access the most recent Supreme Court judgments from 2023–2025 —
                summarized and paired with CLAT-PG-style questions. Join a
                thriving community of aspirants who learn, compete, and
                celebrate milestones together. Gavelogy isn&apos;t just an app — it&apos;s
                your smart legal companion.
              </p>
            </motion.div>

            {/* Right side - Icons and Why Gavelogy */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="space-y-8"
            >
              {/* Feature Icons */}
              <div className="grid grid-cols-2 gap-8">
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: 0.1 }}
                  className="flex flex-col items-center"
                >
                  <motion.div
                    animate={{ y: [0, -10, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="w-28 h-28 rounded-3xl bg-[#F8E38F] flex items-center justify-center mb-6 shadow-xl"
                  >
                    <FileText className="h-14 w-14 text-[#2C2C2C]" />
                  </motion.div>
                  <p className="text-base font-semibold text-[#2C2C2C]">
                    Contemporary Cases
                  </p>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                  className="flex flex-col items-center"
                >
                  <motion.div
                    animate={{ y: [0, -10, 0] }}
                    transition={{ duration: 2, repeat: Infinity, delay: 0.3 }}
                    className="w-28 h-28 rounded-3xl bg-[#D8E3ED] flex items-center justify-center mb-6 shadow-xl"
                  >
                    <Users className="h-14 w-14 text-[#2C2C2C]" />
                  </motion.div>
                  <p className="text-base font-semibold text-[#2C2C2C]">
                    Community
                  </p>
                </motion.div>
              </div>

              {/* Why Gavelogy Section */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: 0.3 }}
                className="bg-white/60 backdrop-blur-sm rounded-3xl p-8 shadow-xl"
              >
                <h3 className="text-2xl font-bold text-[#2C2C2C] mb-6 text-center">
                  Why Gavelogy?
                </h3>
                <div className="grid grid-cols-2 gap-6 mb-6">
                  <div className="flex flex-col items-center">
                    <Shield className="h-10 w-10 text-[#6B9BD2] mb-3" />
                    <p className="text-base font-semibold text-[#2C2C2C]">
                      Accuracy
                    </p>
                  </div>
                  <div className="flex flex-col items-center">
                    <Target className="h-10 w-10 text-[#6B9BD2] mb-3" />
                    <p className="text-base font-semibold text-[#2C2C2C]">
                      Adaptive
                    </p>
                  </div>
                  <div className="flex flex-col items-center">
                    <Users className="h-10 w-10 text-[#6B9BD2] mb-3" />
                    <p className="text-base font-semibold text-[#2C2C2C]">
                      Community
                    </p>
                  </div>
                  <div className="flex flex-col items-center">
                    <TrendingUp className="h-10 w-10 text-[#6B9BD2] mb-3" />
                    <p className="text-base font-semibold text-[#2C2C2C]">
                      Analytics
                    </p>
                  </div>
                </div>
                <p className="text-lg font-semibold text-[#6C6C6C] italic text-center">
                  &quot;Built by law graduates, powered by AI, and trusted by
                  thousands of CLAT-PG aspirants.&quot;
                </p>
              </motion.div>

              {/* CTA Button */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: 0.5 }}
                className="flex justify-center"
              >
                <Link href="/subjects">
                  <Button
                    size="lg"
                    className="text-lg px-12 py-7 bg-[#6B9BD2] hover:bg-[#5A8FC7] text-white shadow-lg hover:shadow-xl transition-all"
                  >
                    Explore our Courses
                  </Button>
                </Link>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
