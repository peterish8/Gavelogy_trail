"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { BarChart3, AlertCircle, Calendar } from "lucide-react";
import PerformanceTab from "./PerformanceTab";
import MistakesTab from "./MistakesTab";
import ConsistencyTab from "./ConsistencyTab";

const TABS = [
  { id: "performance", label: "Performance", icon: BarChart3, color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-100 dark:bg-blue-900/40" },
  { id: "mistakes",    label: "Mistakes",    icon: AlertCircle, color: "text-red-500 dark:text-red-400",  bg: "bg-red-100 dark:bg-red-900/40" },
  { id: "consistency", label: "Consistency", icon: Calendar,   color: "text-green-600 dark:text-green-400", bg: "bg-green-100 dark:bg-green-900/40" },
];

export default function AnalyticsSection() {
  const [activeTab, setActiveTab] = useState("performance");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Analytics</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            Track your progress and optimise your study strategy
          </p>
        </div>
        <span className="text-xs text-gray-400 dark:text-gray-500">
          Updated {new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
        </span>
      </div>

      {/* Tab Navigation — same underline style as dashboard */}
      <div className="border-b border-gray-200 dark:border-gray-800">
        <nav className="flex items-center gap-1">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`relative flex items-center gap-2 px-4 pb-3 pt-1 text-sm font-semibold transition-colors duration-200 ${
                  isActive
                    ? "text-gray-900 dark:text-gray-100"
                    : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                }`}
              >
                <div className={`p-1 rounded-md ${isActive ? tab.bg : ""} transition-colors`}>
                  <Icon className={`h-4 w-4 ${isActive ? tab.color : "text-gray-400"}`} />
                </div>
                {tab.label}
                {isActive && (
                  <motion.span
                    layoutId="analytics-tab-underline"
                    className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full bg-gray-900 dark:bg-gray-100"
                  />
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
      >
        {activeTab === "performance" && <PerformanceTab />}
        {activeTab === "mistakes"    && <MistakesTab />}
        {activeTab === "consistency" && <ConsistencyTab />}
      </motion.div>
    </div>
  );
}
