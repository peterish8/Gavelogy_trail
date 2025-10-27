"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PerformanceTab from "./PerformanceTab";
import MistakesTab from "./MistakesTab";
import ConsistencyTab from "./ConsistencyTab";

export default function AnalyticsSection() {
  const [activeTab, setActiveTab] = useState("performance");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Analytics</h1>
          <p className="text-muted-foreground">
            Track your progress and optimize your study strategy
          </p>
        </div>
        <div className="text-sm text-muted-foreground">
          Last updated: {new Date().toLocaleDateString()}
        </div>
      </div>

      {/* Analytics Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-6"
      >
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="performance" className="flex items-center gap-2">
            📈 Performance
          </TabsTrigger>
          <TabsTrigger value="mistakes" className="flex items-center gap-2">
            🧠 Mistakes
          </TabsTrigger>
          <TabsTrigger value="consistency" className="flex items-center gap-2">
            📅 Consistency
          </TabsTrigger>
        </TabsList>

        <TabsContent value="performance" className="space-y-6">
          <PerformanceTab />
        </TabsContent>

        <TabsContent value="mistakes" className="space-y-6">
          <MistakesTab />
        </TabsContent>

        <TabsContent value="consistency" className="space-y-6">
          <ConsistencyTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
