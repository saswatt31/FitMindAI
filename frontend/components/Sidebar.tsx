"use client";

import React, { useState } from "react";
import { useApp } from "../context/AppContext";
import { Gender, FitnessGoal, DietPreference, UserProfile } from "../lib/types";
import { calculateBMI, getBMICategory, API_BASE, cn } from "../lib/utils";
import { Sparkles, User, Activity, Target, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import RAGSources from "./RAGSources";
import glassStyles from "./Glass.module.css";

export default function Sidebar() {
  const { 
    profile, setProfile, 
    nlOpen, setNLOpen 
  } = useApp();

  const [nlInput, setNlInput] = useState("");
  const [isParsing, setIsParsing] = useState(false);

  const handleFieldChange = (field: keyof UserProfile, value: string | number) => {
    const newProfile = { 
      ...(profile || {
        age: 25,
        height_cm: 175,
        weight_kg: 70,
        fitness_goal: "maintenance",
        diet_preference: "omnivore",
        workout_days: 3,
        gender: "male"
      }), 
      [field]: value 
    } as UserProfile;
    setProfile(newProfile);
  };

  const handleParseNL = async () => {
    if (!nlInput.trim()) return;
    setIsParsing(true);
    try {
      const res = await fetch(`${API_BASE}/extract-profile`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: nlInput })
      });
      const data = await res.json();
      if (data.extracted) {
        setProfile({
          ...(profile || {}),
          ...data.extracted
        } as UserProfile);
        setNLOpen(false);
        setNlInput("");
      }
    } catch (error) {
      console.error("Failed to parse NL profile", error);
    } finally {
      setIsParsing(false);
    }
  };

  const bmi = profile ? calculateBMI(profile.height_cm, profile.weight_kg) : 0;
  const bmiData = bmi ? getBMICategory(bmi) : null;

  return (
    <div className={cn(glassStyles.glassCard, "p-1 h-full mt-2 flex flex-col min-w-[340px]")}>
      <div className="p-6 pb-2">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shadow-inner border border-primary/20">
            <User size={20} />
          </div>
          <div className="flex flex-col">
            <h1 className="text-lg font-bold tracking-tight text-white leading-none mb-1">Human Profile</h1>
            <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-bold">Bio-data configuration</span>
          </div>
        </div>

        {/* NL Onboarding */}
        <div className="mb-6">
          <Button 
            variant="outline" 
            className={cn(
              "w-full justify-start gap-2 bg-white/5 border-white/10 hover:bg-white/10 text-[10px] uppercase tracking-widest font-bold h-10",
              nlOpen && "bg-primary/10 border-primary/30 text-primary"
            )}
            onClick={() => setNLOpen(!nlOpen)}
          >
            <Sparkles className={cn("w-4 h-4", nlOpen ? "text-primary" : "text-primary/70", nlOpen && "animate-pulse")} />
            {nlOpen ? "Manual Entry Mode" : "AI Sync Transformation"}
          </Button>
          
          {nlOpen && (
            <div className="mt-4 space-y-3 animate-in">
              <textarea
                className="w-full h-28 bg-black/40 border border-white/10 rounded-2xl p-4 text-xs text-white placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/40 resize-none transition-all"
                placeholder="e.g. 28yo male, 180cm, 85kg, goal is muscle gain, vegan, 5 workouts/week..."
                value={nlInput}
                onChange={(e) => setNlInput(e.target.value)}
              />
              <Button 
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-black uppercase tracking-widest text-[10px] h-11 rounded-xl shadow-lg shadow-primary/10" 
                onClick={handleParseNL}
                disabled={isParsing || !nlInput.trim()}
              >
                {isParsing ? "Reconstructing..." : "Execute AI Parse"}
              </Button>
            </div>
          )}
        </div>
      </div>

      <ScrollArea className="flex-1 px-6">
        <div className="space-y-8 pb-8 pt-2">
          {/* Profile Section */}
          <section>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[9px] uppercase tracking-[0.2em] text-muted-foreground font-black ml-1">Age</label>
                <Input
                  type="number"
                  className={cn(glassStyles.input, "h-10 text-sm rounded-xl focus-visible:ring-0")}
                  value={profile?.age || ""}
                  onChange={(e) => handleFieldChange("age", parseInt(e.target.value))}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[9px] uppercase tracking-[0.2em] text-muted-foreground font-black ml-1">Gender</label>
                <select 
                  className={cn(glassStyles.input, "w-full h-10 rounded-xl px-3 text-sm text-white focus:outline-none appearance-none")}
                  value={profile?.gender || "male"}
                  onChange={(e) => handleFieldChange("gender", e.target.value as Gender)}
                >
                  <option value="male" className="bg-[#0e1419]">Male</option>
                  <option value="female" className="bg-[#0e1419]">Female</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[9px] uppercase tracking-[0.2em] text-muted-foreground font-black ml-1">Height (cm)</label>
                <Input
                  type="number"
                  className={cn(glassStyles.input, "h-10 text-sm rounded-xl focus-visible:ring-0")}
                  value={profile?.height_cm || ""}
                  onChange={(e) => handleFieldChange("height_cm", parseFloat(e.target.value))}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[9px] uppercase tracking-[0.2em] text-muted-foreground font-black ml-1">Weight (kg)</label>
                <Input
                  type="number"
                  className={cn(glassStyles.input, "h-10 text-sm rounded-xl focus-visible:ring-0")}
                  value={profile?.weight_kg || ""}
                  onChange={(e) => handleFieldChange("weight_kg", parseFloat(e.target.value))}
                />
              </div>
            </div>

            <div className="mt-6 space-y-5">
              <div className="space-y-2">
                <label className="text-[9px] uppercase tracking-[0.2em] text-muted-foreground font-black ml-1 text-primary">Primary Directive</label>
                <select 
                  className={cn(glassStyles.input, "w-full h-10 rounded-xl px-3 text-sm text-white focus:outline-none appearance-none")}
                  value={profile?.fitness_goal || ""}
                  onChange={(e) => handleFieldChange("fitness_goal", e.target.value as FitnessGoal)}
                >
                  <option value="" className="bg-[#0e1419]">Select target...</option>
                  <option value="fat_loss" className="bg-[#0e1419]">🔥 Shred & Fat Loss</option>
                  <option value="muscle_gain" className="bg-[#0e1419]">💪 Hypertrophy Gain</option>
                  <option value="maintenance" className="bg-[#0e1419]">⚖️ Homeostasis</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[9px] uppercase tracking-[0.2em] text-muted-foreground font-black ml-1">Fuel Protocol</label>
                <select 
                  className={cn(glassStyles.input, "w-full h-10 rounded-xl px-3 text-sm text-white focus:outline-none appearance-none")}
                  value={profile?.diet_preference || ""}
                  onChange={(e) => handleFieldChange("diet_preference", e.target.value as DietPreference)}
                >
                  <option value="" className="bg-[#0e1419]">Select protocol...</option>
                  <option value="omnivore" className="bg-[#0e1419]">🍖 Absolute Omnivore</option>
                  <option value="vegetarian" className="bg-[#0e1419]">🥗 Clean Vegetarian</option>
                  <option value="vegan" className="bg-[#0e1419]">🌱 Pure Plant Based</option>
                </select>
              </div>
            </div>
          </section>

          {/* BMI Analysis */}
          {bmiData && (
            <div className="bg-white/5 rounded-3xl border border-white/5 overflow-hidden p-6 hover:border-white/10 transition-colors group">
              <div className="flex items-center gap-2 mb-4">
                <Activity className="w-3.5 h-3.5 text-primary group-hover:animate-pulse" />
                <h4 className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-black">Metabolic Index</h4>
              </div>
              
              <div className="flex items-end justify-between mb-4">
                <span className="text-3xl font-black text-white tracking-tighter">{bmi.toFixed(1)}</span>
                <Badge 
                  className="mb-1 uppercase text-[10px] font-black px-3 h-6 border-none tracking-widest"
                  style={{ color: bmiData.color, background: `${bmiData.color}15` }}
                >
                  {bmiData.category}
                </Badge>
              </div>
              <div className="relative w-full h-1.5 bg-white/5 rounded-full mb-2">
                <div 
                  className="absolute top-0 bottom-0 rounded-full transition-all duration-1000 ease-out"
                  style={{ 
                    left: "0", 
                    width: `${Math.min(100, Math.max(0, ((bmi - 12) / (40 - 12)) * 100))}%`,
                    background: bmiData.color,
                    boxShadow: `0 0 10px ${bmiData.color}40`
                  }}
                />
              </div>
              <p className="text-[10px] text-muted-foreground leading-relaxed italic opacity-60 font-medium">
                {bmiData.tip}
              </p>
            </div>
          )}

          <RAGSources />
        </div>
      </ScrollArea>

      <div className="p-6 border-t border-white/5 bg-black/40">
        <div className="flex items-center gap-3 opacity-60">
           <ShieldCheck size={14} className="text-primary" />
           <span className="text-[9px] uppercase tracking-widest font-black text-muted-foreground">Data Secured via Local Storage</span>
        </div>
      </div>
    </div>
  );
}
