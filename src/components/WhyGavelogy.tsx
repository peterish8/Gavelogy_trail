"use client";

import { motion } from "framer-motion";
import {
  Shield,
  Users,
  BookOpen,
  Award,
  FileText,
  BarChart3,
  Brain,
  Gift,
  Smartphone,
} from "lucide-react";

interface FeaturePoint {
  icon: React.ReactNode;
  text: string;
}

const features: FeaturePoint[] = [
  {
    icon: <Shield className="h-6 w-6 text-[#6B9BD2]" />,
    text: "Trusted by Law Aspirants Across India",
  },
  {
    icon: <Users className="h-6 w-6 text-[#6B9BD2]" />,
    text: "Built by Legal Educators & Researchers",
  },
  {
    icon: <BookOpen className="h-6 w-6 text-[#6B9BD2]" />,
    text: "Case-Based Legal Learning",
  },
  {
    icon: <Award className="h-6 w-6 text-[#6B9BD2]" />,
    text: "Structured for CLAT PG & LL.M Exams",
  },
  {
    icon: <FileText className="h-6 w-6 text-[#6B9BD2]" />,
    text: "Comprehensive Judgment Summaries",
  },
  {
    icon: <BarChart3 className="h-6 w-6 text-[#6B9BD2]" />,
    text: "Advanced Progress Analytics",
  },
  {
    icon: <Brain className="h-6 w-6 text-[#6B9BD2]" />,
    text: "Interactive Quizzes & Leaderboards",
  },
  {
    icon: <Gift className="h-6 w-6 text-[#6B9BD2]" />,
    text: "Reward-Based Learning System",
  },
  {
    icon: <Smartphone className="h-6 w-6 text-[#6B9BD2]" />,
    text: "Access Anytime, Anywhere",
  },
];

export function WhyGavelogy() {
  return (
    <section className="bg-linear-to-b from-blue-50/40 to-white/60 backdrop-blur-sm py-24 relative z-10 overflow-hidden">
      {/* Gradient Sphere Decoration */}
      <div className="absolute top-20 right-10 w-96 h-96 bg-linear-to-br from-yellow-400/30 via-orange-400/30 to-pink-400/30 rounded-full blur-3xl"></div>
      <div className="absolute bottom-20 left-10 w-80 h-80 bg-linear-to-br from-blue-400/20 via-purple-400/20 to-pink-400/20 rounded-full blur-3xl"></div>

      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-4 text-[#2C2C2C]">
            Why Gavelogy?
          </h2>
          <p className="text-[#6C6C6C] text-lg max-w-3xl mx-auto leading-relaxed">
            We understand how law students learn &mdash; that&apos;s why we built Gavelogy
            to make mastering the law simpler, structured, and smarter.
          </p>
        </motion.div>

        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {features.map((feature, index) => {
              const rowIndex = Math.floor(index / 3);
              const isShifted = rowIndex % 2 === 1; // Shift odd rows
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  whileHover={{ scale: 1.05 }}
                  className="group"
                  style={{
                    transform: isShifted ? "translateX(50px)" : "translateX(0)",
                  }}
                >
                  <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-xl transition-all duration-300 flex items-center gap-4 h-full">
                    <div className="shrink-0 p-3 bg-blue-50 rounded-lg group-hover:bg-blue-100 transition-colors duration-300">
                      {feature.icon}
                    </div>
                    <span className="text-base font-medium text-[#2C2C2C]">
                      {feature.text}
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center mt-12"
          >
            <p className="text-[#6C6C6C] italic text-base md:text-lg">
              &ldquo;Because understanding the law should be as clear as the judgment
              itself.&rdquo;
            </p>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
