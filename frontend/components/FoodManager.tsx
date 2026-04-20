"use client";

import React, { useState } from "react";
import { useApp } from "../context/AppContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Utensils, Plus, Trash2 } from "lucide-react";
import { cn } from "../lib/utils";
import glassStyles from "./Glass.module.css";

export default function FoodManager() {
  const { foodLog, addFood, deleteFood, clearFoodLog } = useApp();
  const [foodName, setFoodName] = useState("");
  const [cal, setCal] = useState("");

  const handleAdd = () => {
    if (!foodName) return;
    addFood({ name: foodName, calories: parseInt(cal) || 0 });
    setFoodName("");
    setCal("");
  };

  const totalCal = foodLog.reduce((s, f) => s + (f.calories || 0), 0);

  return (
    <div className={cn(glassStyles.glassCard, "p-6 animate-in flex flex-col h-full")}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center text-orange-400">
            <Utensils className="w-4 h-4" />
          </div>
          <h3 className="text-sm font-bold text-white tracking-tight">Meal Journal</h3>
        </div>
        <button 
          onClick={clearFoodLog} 
          className="text-[9px] text-red-400/40 hover:text-red-400 transition-colors uppercase font-bold tracking-widest px-2 py-1 rounded-md hover:bg-red-400/5"
        >
          Reset Log
        </button>
      </div>

      <div className="flex items-baseline gap-2 mb-8">
        <span className="text-4xl font-black text-white tracking-tighter">
          {totalCal}
        </span>
        <span className="text-[10px] text-muted-foreground font-bold tracking-[0.2em] opacity-60 uppercase">calories consumed today</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 mb-8">
        <div className="md:col-span-12 lg:col-span-6">
          <Input
            placeholder="What did you eat?"
            className={cn(glassStyles.input, "h-11 text-sm rounded-xl focus-visible:ring-0")}
            value={foodName}
            onChange={(e) => setFoodName(e.target.value)}
          />
        </div>
        <div className="md:col-span-12 lg:col-span-4">
          <Input
            type="number"
            placeholder="Calories"
            className={cn(glassStyles.input, "h-11 text-sm rounded-xl focus-visible:ring-0")}
            value={cal}
            onChange={(e) => setCal(e.target.value)}
          />
        </div>
        <div className="md:col-span-12 lg:col-span-2">
          <Button 
            className="h-11 w-full bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl font-bold shadow-[0_0_20px_rgba(198,241,53,0.15)]" 
            onClick={handleAdd}
          >
            <Plus size={20} />
          </Button>
        </div>
      </div>

      <div className="flex-1 space-y-2 overflow-y-auto pr-1 min-h-[200px] max-h-[400px]">
        {foodLog.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 opacity-30 text-center">
            <div className="w-12 h-12 rounded-full border border-dashed border-white/20 flex items-center justify-center mb-3">
              <Utensils size={20} className="text-muted-foreground" />
            </div>
            <p className="text-[11px] uppercase tracking-widest font-bold">Your journal is empty</p>
          </div>
        ) : (
          foodLog.slice().reverse().map((food, idx) => (
            <div key={idx} className="group flex items-center justify-between p-4 rounded-2xl hover:bg-white/5 transition-all border border-white/[0.03] bg-white/[0.01]">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-lg shadow-inner">
                  🥣
                </div>
                <div className="flex flex-col">
                  <span className="text-[13px] font-bold text-white mb-0.5">{food.name}</span>
                  <span className="text-[10px] text-primary/80 font-bold uppercase tracking-wider">{food.calories} kcal</span>
                </div>
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                className="w-9 h-9 text-muted-foreground hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all rounded-xl hover:bg-red-400/5"
                onClick={() => deleteFood(foodLog.length - 1 - idx)}
              >
                <Trash2 size={16} />
              </Button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
