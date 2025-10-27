"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, HelpCircle } from "lucide-react";

interface FAQItem {
  question: string;
  answer: string;
}

const faqs: FAQItem[] = [
  {
    question: "What exactly is Gavelogy?",
    answer:
      "Gavelogy is a modern law learning platform built to help students and aspirants master legal concepts through case-based learning, in-depth analysis, and data-driven progress tracking. From landmark judgments to CLAT PG-style quizzes — everything you need to understand the law, simplified and structured.",
  },
  {
    question: "How is Gavelogy different from other legal learning platforms?",
    answer:
      "Gavelogy focuses on learning through judgments, not just theory. Every feature — from detailed case summaries to progress analytics — is designed to help you connect principles with real cases. You'll experience structured insights, leaderboard-based motivation, and clear visual analytics that show how you're improving over time.",
  },
  {
    question: "Who can join Gavelogy?",
    answer:
      "Anyone with an interest in law can join! Whether you're a law student, CLAT PG aspirant, or someone passionate about legal developments — there's no age or academic restriction.",
  },
  {
    question: "How can I sign up?",
    answer:
      'Simply click "Join Now" or "Start Learning" on our homepage. You can register using your email ID or Google account, and immediately start exploring available courses and cases.',
  },
  {
    question: "Are the courses and materials available online only?",
    answer:
      "Yes, Gavelogy is completely online. You can access all your enrolled content anytime, from your desktop, tablet, or smartphone — whenever you want to study.",
  },
  {
    question: "Where can I find all my enrolled courses?",
    answer:
      "Once logged in, head to the Courses page. It's designed to be intuitive and easy to navigate — you can continue, review, or explore new courses from the same space.",
  },
  {
    question: "What payment methods are accepted?",
    answer:
      "We accept UPI, debit/credit cards, and net banking through secure payment gateways. International payments are supported via PayPal or Stripe.",
  },
  {
    question: "Do you offer refunds?",
    answer:
      "Sorry, our team works really hard to make every course enriching. We focus on constant improvements and quality updates, but refunds are not offered at this time.",
  },
  {
    question: "Can I access Gavelogy on my phone?",
    answer:
      "Yes! Gavelogy is fully optimized for mobile browsers, so you can study, solve quizzes, and track progress right from your phone.",
  },
  {
    question: "How does gamification work on Gavelogy?",
    answer:
      "As you study and engage, you earn XP points, badges, and leaderboard ranks. Your consistent performance is tracked using advanced statistics, so you can see how you're growing week by week.",
  },
];

export function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section className="bg-gradient-to-b from-white/60 to-blue-50/40 backdrop-blur-sm py-24 relative z-10">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <div className="inline-block mb-4">
            <span className="text-5xl">⚖️</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold mb-4 text-[#2C2C2C]">
            Frequently Asked Questions
          </h2>
          <p className="text-[#6C6C6C] text-lg max-w-2xl mx-auto">
            For all those little doubts on your mind ⚖️
          </p>
        </motion.div>

        <div className="max-w-4xl mx-auto space-y-4">
          {faqs.map((faq, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200 overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300">
                <button
                  onClick={() => toggleFAQ(index)}
                  className="w-full px-6 py-5 text-left flex items-center justify-between hover:bg-blue-50/50 transition-colors duration-200"
                >
                  <div className="flex items-center gap-3 flex-1">
                    <HelpCircle className="h-5 w-5 text-[#6B9BD2] flex-shrink-0" />
                    <span className="text-lg font-semibold text-[#2C2C2C] pr-4">
                      {faq.question}
                    </span>
                  </div>
                  <motion.div
                    animate={{ rotate: openIndex === index ? 180 : 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <ChevronDown className="h-5 w-5 text-[#6B9BD2] flex-shrink-0" />
                  </motion.div>
                </button>

                <AnimatePresence>
                  {openIndex === index && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden"
                    >
                      <div className="px-6 pb-5 pt-0">
                        <p className="text-[#6C6C6C] leading-relaxed pl-8">
                          {faq.answer}
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
