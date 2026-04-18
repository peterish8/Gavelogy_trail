"use client"

import { useState } from 'react'
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useActivityStats } from '@/hooks/use-activity-stats'
import { Activity } from 'lucide-react'

export function ActivityGraph() {
  const [days, setDays] = useState("7")
  const { data, isLoading, totalAttempts } = useActivityStats(parseInt(days))

  return (
    <div className="glass-card card-interactive rounded-2xl h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 flex items-start justify-between border-b border-white/30 dark:border-white/[0.06] shrink-0">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <div className="w-6 h-6 rounded-md bg-emerald-50 dark:bg-emerald-500/15 flex items-center justify-center">
              <Activity className="h-3.5 w-3.5 text-emerald-500" />
            </div>
            <span className="text-sm font-semibold text-[var(--ink-3)]">Activity</span>
          </div>
          <div className="flex items-baseline gap-1.5 pl-8">
            <span className="text-2xl font-extrabold text-emerald-500 dark:text-emerald-400 leading-none">
              {isLoading ? "–" : totalAttempts}
            </span>
            <span className="text-xs text-[var(--ink-3)] font-medium">quizzes</span>
          </div>
        </div>

        <Select value={days} onValueChange={setDays}>
          <SelectTrigger className="w-[90px] h-7 text-[10px] glass-input rounded-lg border-white/30 dark:border-white/[0.08] px-2">
            <SelectValue placeholder="Range" />
          </SelectTrigger>
          <SelectContent align="end">
            <SelectItem value="7">7 Days</SelectItem>
            <SelectItem value="14">14 Days</SelectItem>
            <SelectItem value="21">21 Days</SelectItem>
            <SelectItem value="30">30 Days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Chart */}
      <div className="flex-1 min-h-[120px] relative p-0">
        <div className="absolute inset-0 pt-4 pb-0 [&_.recharts-surface]:outline-none">
          {/* Faded grid texture */}
          <div className="absolute inset-0 pointer-events-none opacity-30 dark:opacity-40">
            <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <pattern id="grid-pattern" width="20" height="20" patternUnits="userSpaceOnUse">
                  <path d="M 20 0 L 0 0 0 20" fill="none" stroke="currentColor" strokeWidth="0.8" className="text-emerald-500" />
                </pattern>
                <mask id="fade-mask">
                  <radialGradient id="fade-grad" cx="50%" cy="50%" r="60%">
                    <stop offset="0%" stopColor="white" stopOpacity="1" />
                    <stop offset="100%" stopColor="white" stopOpacity="0" />
                  </radialGradient>
                  <rect width="100%" height="100%" fill="url(#fade-grad)" />
                </mask>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid-pattern)" mask="url(#fade-mask)" />
            </svg>
          </div>

          <ResponsiveContainer width="100%" height="100%" className="[&_.recharts-surface]:outline-none">
            <AreaChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorActivity" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.28} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <Tooltip
                cursor={{ stroke: '#10b981', strokeWidth: 1, strokeDasharray: '4 4' }}
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="rounded-xl border border-white/30 dark:border-white/[0.08] bg-white/90 dark:bg-[#1a1230]/90 backdrop-blur-xl px-3 py-2 shadow-lg text-xs">
                        <div className="font-semibold mb-1 text-[var(--ink)]">{payload[0].payload.label}</div>
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                          <span className="text-[var(--ink-3)]">Quizzes:</span>
                          <span className="font-mono font-bold text-emerald-500 dark:text-emerald-400">{payload[0].value}</span>
                        </div>
                      </div>
                    )
                  }
                  return null
                }}
              />
              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 10, fill: 'var(--ink-3, #857FA0)' }}
                tickMargin={10}
                minTickGap={30}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 10, fill: 'var(--ink-3, #857FA0)' }}
                tickFormatter={(value) => Math.floor(value).toString()}
                allowDecimals={false}
              />
              <Area
                type="monotone"
                dataKey="count"
                stroke="#10b981"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorActivity)"
                animationDuration={1600}
                animationBegin={400}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
