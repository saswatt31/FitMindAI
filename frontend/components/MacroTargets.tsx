"use client";

import React from "react";
import { Doughnut } from "react-chartjs-2";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend
} from "chart.js";
import { useApp } from "../context/AppContext";
import { Target } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "../lib/utils";
import glassStyles from "./Glass.module.css";

ChartJS.register(ArcElement, Tooltip, Legend);

export default function MacroTargets() {
  const { nutrition } = useApp();

  if (!nutrition) return null;

  const data = {
    labels: ["Protein", "Carbs", "Fat"],
    datasets: [
      {
        data: [nutrition.protein, nutrition.carbs, nutrition.fat],
        backgroundColor: ["#c6f135", "#18d9c4", "#f97316"],
        borderWidth: 0,
        hoverOffset: 12,
        borderRadius: 8,
        spacing: 6
      }
    ]
  };

  const options = {
    cutout: "80%",
    animation: { animateRotate: true, duration: 1000, easing: "easeOutQuart" as any },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: "rgba(15, 23, 42, 0.9)",
        borderColor: "rgba(255, 255, 255, 0.1)",
        borderWidth: 1,
        titleFont: { size: 10, weight: "bold" as any },
        bodyFont: { size: 12 },
        padding: 12,
        cornerRadius: 12,
        displayColors: true,
        boxPadding: 6
      }
    }
  };

  return (
    <div className={cn(glassStyles.glassCard, "p-6 animate-in")}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Target className="w-4 h-4 text-primary" />
          </div>
          <h3 className="text-sm font-bold text-white tracking-tight">Macro Goals</h3>
        </div>
        <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 text-[9px] px-2 h-5 font-bold">DAILY TARGET</Badge>
      </div>

      <div className="flex flex-col md:flex-row items-center gap-8">
        <div className="relative w-40 h-40 flex-shrink-0">
          <Doughnut data={data} options={options} />
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-3xl font-black text-white tracking-tighter leading-none">{nutrition.calories}</span>
            <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-[0.2em] opacity-60 mt-1">kcal</span>
          </div>
        </div>

        <div className="flex-1 w-full space-y-4">
          {[
            { label: "Protein", value: nutrition.protein, color: "bg-primary", shadow: "shadow-[0_0_12px_rgba(198,241,53,0.3)]" },
            { label: "Carbs", value: nutrition.carbs, color: "bg-[#18d9c4]", shadow: "shadow-[0_0_12px_rgba(24,217,196,0.3)]" },
            { label: "Fats", value: nutrition.fat, color: "bg-[#f97316]", shadow: "shadow-[0_0_12px_rgba(249,115,22,0.3)]" }
          ].map((macro) => (
            <div key={macro.label} className="group">
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <div className={cn("w-2 h-2 rounded-full", macro.color, macro.shadow)} />
                  <span className="text-xs text-muted-foreground group-hover:text-white transition-colors">{macro.label}</span>
                </div>
                <span className="text-sm font-bold text-white">{macro.value}g</span>
              </div>
              <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                <div 
                  className={cn("h-full rounded-full transition-all duration-1000 ease-out", macro.color)} 
                  style={{ width: `${Math.min(100, (macro.value / (macro.label === "Protein" ? 200 : macro.label === "Carbs" ? 300 : 100)) * 100)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mt-8">
        {[
          { label: "BMR", value: nutrition.bmr, sub: "Basal Metabolic Rate" },
          { label: "TDEE", value: nutrition.tdee, sub: "Total Daily Expenditure" }
        ].map((item) => (
          <div key={item.label} className="bg-black/20 rounded-2xl p-4 border border-white/5 hover:border-white/10 transition-colors group">
            <div className="text-[9px] uppercase tracking-widest text-muted-foreground mb-1 font-bold group-hover:text-primary transition-colors">{item.label}</div>
            <div className="text-xl font-bold text-white tracking-tight">{item.value} <span className="text-[10px] text-muted-foreground font-normal">kcal</span></div>
          </div>
        ))}
      </div>
    </div>
  );
}
