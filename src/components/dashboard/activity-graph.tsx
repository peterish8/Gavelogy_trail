"use client"

import { useState } from 'react'
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useActivityStats } from '@/hooks/use-activity-stats'
import { Activity } from 'lucide-react'

export function ActivityGraph() {
  const [days, setDays] = useState("7")
  const { data, isLoading, totalAttempts } = useActivityStats(parseInt(days))

  return (
    <Card className="h-full flex flex-col shadow-sm border dark:from-green-950/20 dark:to-emerald-950/10 dark:border-white/5">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-4 pt-4">
        <div className="flex flex-col gap-1">
             <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Activity className="h-4 w-4 text-emerald-500" />
                <span className="text-muted-foreground">Activity</span>
             </CardTitle>
             <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                    {isLoading ? "-" : totalAttempts}
                </span>
                <span className="text-xs text-muted-foreground font-medium">
                    quizzes
                </span>
             </div>
        </div>
        <Select value={days} onValueChange={setDays}>
          <SelectTrigger className="w-[90px] h-7 text-[10px] bg-background/50 border-input/50 backdrop-blur-sm px-2">
            <SelectValue placeholder="Range" />
          </SelectTrigger>
          <SelectContent align="end">
            <SelectItem value="7">7 Days</SelectItem>
            <SelectItem value="14">14 Days</SelectItem>
            <SelectItem value="21">21 Days</SelectItem>
            <SelectItem value="30">30 Days</SelectItem>
          </SelectContent>
        </Select>
      </CardHeader>
      
      <CardContent className="p-0 flex-1 min-h-[120px] relative">
        <div className="absolute inset-0 pt-4 pb-0 [&_.recharts-surface]:outline-none">
          {/* Subtle Grid Background - SVG Implementation (Indestructible) */}
          <div className="absolute inset-0 pointer-events-none opacity-40 dark:opacity-60">
            <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <pattern id="grid-pattern" width="20" height="20" patternUnits="userSpaceOnUse">
                  <path d="M 20 0 L 0 0 0 20" fill="none" stroke="currentColor" strokeWidth="1" className="text-emerald-500" />
                </pattern>
                <mask id="fade-mask">
                  <radialGradient id="fade-grad" cx="50%" cy="50%" r="60%" fx="50%" fy="50%">
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
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <Tooltip 
                 cursor={{ stroke: '#10b981', strokeWidth: 1, strokeDasharray: '4 4' }}
                 content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                    return (
                        <div className="rounded-lg border bg-background/95 backdrop-blur px-3 py-2 shadow-lg text-xs animate-in fade-in zoom-in-95 duration-200">
                           <div className="font-semibold mb-1 text-foreground">{payload[0].payload.label}</div>
                           <div className="flex items-center gap-2">
                             <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"/>
                             <span className="text-muted-foreground">Quizzes:</span>
                             <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                                {payload[0].value}
                             </span>
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
                tick={{ fontSize: 10, fill: '#6b7280' }} 
                tickMargin={10} 
                minTickGap={30}
              />
              <YAxis 
                tickLine={false} 
                axisLine={false} 
                tick={{ fontSize: 10, fill: '#6b7280' }} 
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
                animationDuration={2000}
                animationBegin={600} // Start immediately after loader fades (500ms + buffer)
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
