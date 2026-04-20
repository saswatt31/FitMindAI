"use client";

import React, { useState } from "react";
import { useApp } from "../context/AppContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TrendingUp, Plus, Calendar } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import glassStyles from "./Glass.module.css";

export default function WeightTracker() {
  const { weightLog, addWeight } = useApp();
  const [newWeight, setNewWeight] = useState("");

  const handleAdd = () => {
    if (!newWeight || isNaN(parseFloat(newWeight))) return;
    addWeight(parseFloat(newWeight));
    setNewWeight("");
  };

  const latestWeight = weightLog.length > 0 ? weightLog[weightLog.length - 1].weight : null;
  const prevWeight = weightLog.length > 1 ? weightLog[weightLog.length - 2].weight : null;
  const diff = latestWeight !== null && prevWeight !== null ? (latestWeight - prevWeight).toFixed(1) : null;

  return (
    <div className={cn(glassStyles.glassCard, "p-6 animate-in flex flex-col h-full")}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-cyan-500/10 flex items-center justify-center text-cyan-400">
            <TrendingUp className="w-4 h-4" />
          </div>
          <h3 className="text-sm font-bold text-white tracking-tight">Weight Tracker</h3>
        </div>
        {diff !== null && (
          <Badge 
            variant="outline" 
            className={cn(
              "text-[9px] font-black px-2 h-5 border-none uppercase tracking-widest",
              parseFloat(diff) > 0 ? "text-orange-400 bg-orange-400/10" : "text-primary bg-primary/10"
            )}
          >
            {parseFloat(diff) > 0 ? "+" : ""}{diff} KG
          </Badge>
        )}
      </div>

      <div className="flex items-baseline gap-2 mb-8">
        <span className="text-4xl font-black text-white tracking-tighter">
          {latestWeight || "--"}
        </span>
        <span className="text-[10px] text-muted-foreground font-bold tracking-[0.2em] opacity-60 uppercase">current weight (kg)</span>
      </div>

      <div className="flex gap-2 mb-8">
        <Input
          type="number"
          placeholder="Enter current weight..."
          className={cn(glassStyles.input, "h-11 text-sm rounded-xl focus-visible:ring-0")}
          value={newWeight}
          onChange={(e) => setNewWeight(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAdd()}
        />
        <Button 
          className="h-11 w-11 bg-cyan-500 text-white hover:bg-cyan-600 rounded-xl font-bold shadow-[0_0_20px_rgba(6,182,212,0.15)] shrink-0" 
          onClick={handleAdd}
        >
          <Plus size={20} />
        </Button>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto pr-1 min-h-[140px]">
        {weightLog.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 opacity-30 text-center">
             <Calendar size={24} className="text-muted-foreground mb-2" />
             <p className="text-[10px] uppercase tracking-widest font-bold">No history yet</p>
          </div>
        ) : (
          weightLog.slice().reverse().map((entry, idx) => (
            <div key={idx} className="flex items-center justify-between p-3 rounded-xl border border-white/[0.03] bg-white/[0.01] hover:bg-white/5 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-xs text-muted-foreground">
                  <Calendar size={14} />
                </div>
                <span className="text-[11px] text-muted-foreground font-semibold">{entry.date}</span>
              </div>
              <span className="text-[13px] font-black text-white">{entry.weight} <span className="text-[10px] font-normal text-muted-foreground">kg</span></span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
