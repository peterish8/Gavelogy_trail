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

        {/* Floating Background Orbs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <motion.div 
            animate={{ y: [0, -40, 0], x: [0, 30, 0], scale: [1, 1.2, 1] }}
            transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-[15%] left-[10%] w-[400px] h-[400px] bg-purple-300/20 rounded-full blur-[80px]"
          />
          <motion.div 
            animate={{ y: [0, 50, 0], x: [0, -40, 0], scale: [1, 1.3, 1] }}
            transition={{ duration: 15, repeat: Infinity, ease: "easeInOut", delay: 1 }}
            className="absolute bottom-[10%] right-[10%] w-[500px] h-[500px] bg-blue-300/20 rounded-full blur-[100px]"
          />
        </div>

        <div className="container mx-auto px-4 py-24 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="max-w-5xl mx-auto text-center"
          >
            <h2 className="text-5xl md:text-7xl font-bold mb-8 text-[#2C2C2C] tracking-tight">
              <span className="bg-clip-text text-transparent bg-linear-to-r from-[#2C2C2C] to-[#5C5C5C]">Smarter Learning.</span>
              <br />
              <span className="bg-clip-text text-transparent bg-linear-to-r from-[#6B9BD2] via-[#8B83D2] to-[#A793E2]">Effortless Consistency.</span>
            </h2>
            <p className="text-xl md:text-2xl text-[#6C6C6C] mb-16 max-w-3xl mx-auto leading-relaxed font-medium">
              Gavelogy combines intelligent mistake tracking, detailed
              analytics, and gamified practice to turn your preparation into
              progress you can see. From adaptive quizzes to realistic mock
              tests, every feature keeps you focused and consistent.
            </p>

            {/* Feature Icons */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12 mb-16 px-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="flex flex-col items-center"
              >
                <motion.div
                  animate={{ y: [0, -10, 0] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                >
                  <div className="w-24 h-24 md:w-32 md:h-32 rounded-3xl bg-linear-to-br from-[#6B9BD2]/90 to-[#4A7BB2] backdrop-blur-xl border border-white/50 flex items-center justify-center mb-6 shadow-[0_15px_35px_rgba(107,155,210,0.35)] relative overflow-hidden group hover:scale-105 hover:-rotate-6 transition-all duration-300 cursor-pointer">
                    <div className="absolute inset-0 bg-linear-to-tr from-transparent via-white/50 to-transparent -translate-x-[150%] group-hover:translate-x-[150%] transition-transform duration-700 ease-in-out"></div>
                    <Brain className="h-12 w-12 md:h-16 md:w-16 text-white drop-shadow-lg relative z-10 transition-transform duration-300 group-hover:scale-110" />
                  </div>
                </motion.div>
                <p className="text-sm md:text-lg font-bold text-[#2C2C2C]">
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
                  transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut", delay: 0.3 }}
                >
                  <div className="w-24 h-24 md:w-32 md:h-32 rounded-3xl bg-linear-to-br from-[#D4E1A3]/95 to-[#B4C183] backdrop-blur-xl border border-white/50 flex items-center justify-center mb-6 shadow-[0_15px_35px_rgba(212,225,163,0.4)] relative overflow-hidden group hover:scale-105 hover:rotate-6 transition-all duration-300 cursor-pointer">
                    <div className="absolute inset-0 bg-linear-to-tr from-transparent via-white/50 to-transparent -translate-x-[150%] group-hover:translate-x-[150%] transition-transform duration-700 ease-in-out"></div>
                    <BarChart3 className="h-12 w-12 md:h-16 md:w-16 text-[#2C2C2C] drop-shadow-md relative z-10 transition-transform duration-300 group-hover:scale-110" />
                  </div>
                </motion.div>
                <p className="text-sm md:text-lg font-bold text-[#2C2C2C]">
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
                  transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut", delay: 0.6 }}
                >
                  <div className="w-24 h-24 md:w-32 md:h-32 rounded-3xl bg-linear-to-br from-[#F7C6A1]/95 to-[#D7A681] backdrop-blur-xl border border-white/50 flex items-center justify-center mb-6 shadow-[0_15px_35px_rgba(247,198,161,0.4)] relative overflow-hidden group hover:scale-105 hover:-rotate-6 transition-all duration-300 cursor-pointer">
                    <div className="absolute inset-0 bg-linear-to-tr from-transparent via-white/50 to-transparent -translate-x-[150%] group-hover:translate-x-[150%] transition-transform duration-700 ease-in-out"></div>
                    <Zap className="h-12 w-12 md:h-16 md:w-16 text-[#2C2C2C] drop-shadow-md relative z-10 transition-transform duration-300 group-hover:scale-110" />
                  </div>
                </motion.div>
                <p className="text-sm md:text-lg font-bold text-[#2C2C2C]">
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
                  transition={{ duration: 3.8, repeat: Infinity, ease: "easeInOut", delay: 0.9 }}
                >
                  <div className="w-24 h-24 md:w-32 md:h-32 rounded-3xl bg-linear-to-br from-[#F8C9D0]/95 to-[#D8A9B0] backdrop-blur-xl border border-white/50 flex items-center justify-center mb-6 shadow-[0_15px_35px_rgba(248,201,208,0.4)] relative overflow-hidden group hover:scale-105 hover:rotate-6 transition-all duration-300 cursor-pointer">
                    <div className="absolute inset-0 bg-linear-to-tr from-transparent via-white/50 to-transparent -translate-x-[150%] group-hover:translate-x-[150%] transition-transform duration-700 ease-in-out"></div>
                    <Clock className="h-12 w-12 md:h-16 md:w-16 text-[#2C2C2C] drop-shadow-md relative z-10 transition-transform duration-300 group-hover:scale-110" />
                  </div>
                </motion.div>
                <p className="text-sm md:text-lg font-bold text-[#2C2C2C]">
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

        {/* Floating Background Orbs for Slide 3 */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <motion.div 
            animate={{ y: [0, 50, 0], x: [0, -40, 0], scale: [1, 1.2, 1] }}
            transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-[20%] left-[20%] w-[350px] h-[350px] bg-yellow-300/20 rounded-full blur-[80px]"
          />
          <motion.div 
            animate={{ y: [0, -30, 0], x: [0, 50, 0], scale: [1, 1.3, 1] }}
            transition={{ duration: 16, repeat: Infinity, ease: "easeInOut", delay: 1 }}
            className="absolute bottom-[20%] right-[10%] w-[450px] h-[450px] bg-pink-300/20 rounded-full blur-[100px]"
          />
        </div>

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
              <h2 className="text-5xl md:text-7xl font-bold mb-8 text-[#2C2C2C] tracking-tight">
                <span className="bg-clip-text text-transparent bg-linear-to-r from-[#2C2C2C] to-[#5C5C5C]">Stay Current.</span>
                <br />
                <span className="bg-clip-text text-transparent bg-linear-to-r from-yellow-500 via-orange-400 to-pink-400">Grow Together.</span>
              </h2>
              <p className="text-xl md:text-2xl text-[#6C6C6C] mb-8 leading-relaxed font-medium">
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
                    transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
                  >
                    <div className="w-24 h-24 md:w-32 md:h-32 rounded-3xl bg-linear-to-br from-[#F8E38F]/90 to-[#D8C36F] backdrop-blur-xl border border-white/50 flex items-center justify-center mb-6 shadow-[0_15px_35px_rgba(248,227,143,0.4)] relative overflow-hidden group hover:scale-105 hover:-rotate-6 transition-all duration-300 cursor-pointer">
                      <div className="absolute inset-0 bg-linear-to-tr from-transparent via-white/50 to-transparent -translate-x-[150%] group-hover:translate-x-[150%] transition-transform duration-700 ease-in-out"></div>
                      <FileText className="h-12 w-12 md:h-16 md:w-16 text-[#2C2C2C] drop-shadow-md relative z-10 transition-transform duration-300 group-hover:scale-110" />
                    </div>
                  </motion.div>
                  <p className="text-sm md:text-lg font-bold text-[#2C2C2C]">
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
                    transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut", delay: 0.3 }}
                  >
                    <div className="w-24 h-24 md:w-32 md:h-32 rounded-3xl bg-linear-to-br from-[#D8E3ED]/90 to-[#B8C3CD] backdrop-blur-xl border border-white/50 flex items-center justify-center mb-6 shadow-[0_15px_35px_rgba(216,227,237,0.4)] relative overflow-hidden group hover:scale-105 hover:rotate-6 transition-all duration-300 cursor-pointer">
                      <div className="absolute inset-0 bg-linear-to-tr from-transparent via-white/50 to-transparent -translate-x-[150%] group-hover:translate-x-[150%] transition-transform duration-700 ease-in-out"></div>
                      <Users className="h-12 w-12 md:h-16 md:w-16 text-[#2C2C2C] drop-shadow-md relative z-10 transition-transform duration-300 group-hover:scale-110" />
                    </div>
                  </motion.div>
                  <p className="text-sm md:text-lg font-bold text-[#2C2C2C]">
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
                className="bg-white/70 backdrop-blur-xl border border-white/40 rounded-3xl p-8 shadow-2xl relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-400/10 rounded-full blur-3xl"></div>
                
                <h3 className="text-2xl font-bold text-[#2C2C2C] mb-8 text-center relative z-10">
                  Why Gavelogy?
                </h3>
                <div className="grid grid-cols-2 gap-6 mb-8 relative z-10">
                  <div className="flex flex-col items-center group cursor-pointer hover:-translate-y-2 transition-transform duration-300">
                    <div className="w-16 h-16 rounded-2xl bg-blue-50/80 backdrop-blur-sm border border-blue-100 flex items-center justify-center mb-3 group-hover:bg-blue-100 transition-colors duration-300 shadow-sm">
                      <Shield className="h-8 w-8 text-[#6B9BD2] group-hover:scale-110 transition-transform duration-300" />
                    </div>
                    <p className="text-base font-semibold text-[#2C2C2C]">
                      Accuracy
                    </p>
                  </div>
                  <div className="flex flex-col items-center group cursor-pointer hover:-translate-y-2 transition-transform duration-300">
                    <div className="w-16 h-16 rounded-2xl bg-blue-50/80 backdrop-blur-sm border border-blue-100 flex items-center justify-center mb-3 group-hover:bg-blue-100 transition-colors duration-300 shadow-sm">
                      <Target className="h-8 w-8 text-[#6B9BD2] group-hover:scale-110 transition-transform duration-300" />
                    </div>
                    <p className="text-base font-semibold text-[#2C2C2C]">
                      Adaptive
                    </p>
                  </div>
                  <div className="flex flex-col items-center group cursor-pointer hover:-translate-y-2 transition-transform duration-300">
                    <div className="w-16 h-16 rounded-2xl bg-blue-50/80 backdrop-blur-sm border border-blue-100 flex items-center justify-center mb-3 group-hover:bg-blue-100 transition-colors duration-300 shadow-sm">
                      <Users className="h-8 w-8 text-[#6B9BD2] group-hover:scale-110 transition-transform duration-300" />
                    </div>
                    <p className="text-base font-semibold text-[#2C2C2C]">
                      Community
                    </p>
                  </div>
                  <div className="flex flex-col items-center group cursor-pointer hover:-translate-y-2 transition-transform duration-300">
                    <div className="w-16 h-16 rounded-2xl bg-blue-50/80 backdrop-blur-sm border border-blue-100 flex items-center justify-center mb-3 group-hover:bg-blue-100 transition-colors duration-300 shadow-sm">
                      <TrendingUp className="h-8 w-8 text-[#6B9BD2] group-hover:scale-110 transition-transform duration-300" />
                    </div>
                    <p className="text-base font-semibold text-[#2C2C2C]">
                      Analytics
                    </p>
                  </div>
                </div>
                <p className="text-lg font-semibold text-[#6C6C6C] italic text-center relative z-10">
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
