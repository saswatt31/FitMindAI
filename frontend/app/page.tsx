  "use client";

import React from "react";
import NavSidebar from "../components/NavSidebar";
import ChatArea from "../components/ChatArea";
import MacroTargets from "../components/MacroTargets";
import WeightTracker from "../components/WeightTracker";
import FoodManager from "../components/FoodManager";
import Sidebar from "../components/Sidebar"; // This is actually the Profile panel
import { useApp } from "../context/AppContext";
import { cn } from "../lib/utils";
import { AnimatePresence, motion } from "framer-motion";
import { ShoppingCart, Trash2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import glassStyles from "../components/Glass.module.css";

export default function Home() {
  const { activeView, setActiveView, groceryList, setGroceryList, toggleGroceryItem } = useApp();

  const renderView = () => {
    switch (activeView) {
      case "dashboard":
        return (
          <div className="flex-1 min-h-0 overflow-y-auto ">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in p-8 w-full max-w-7xl mx-auto">
              <div className="lg:col-span-8 space-y-8">
                <div className="flex flex-col gap-2">
                  <h2 className="text-3xl font-bold text-white tracking-tight">Overview</h2>
                  <p className="text-muted-foreground">Welcome back. Here's your nutritional progress for today.</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <MacroTargets />
                  <WeightTracker />
                </div>
                <FoodManager />
              </div>
              <div className="lg:col-span-4 h-fit sticky top-0">
                <Sidebar />
              </div>
            </div>
          </div>
        );
      case "planner":
        return (
          <div className="flex-1 h-full min-h-0 flex flex-col lg:flex-row pt-20 overflow-hidden">
            <div className="min-h-0">
               <ChatArea />
            </div>
            <div className="w-full lg:w-[380px] h-full p-4 lg:p-0 lg:pr-8 lg:pb-8 flex flex-col animate-in">
               <Sidebar />
            </div>
          </div>
        );
      case "tracker":
        return (
          <div className="flex-1 min-h-0 overflow-y-auto mt-20">
            <div className="max-w-7xl mx-auto p-8 animate-in">
              <div className="flex flex-col gap-2 mb-8">
                <h2 className="text-3xl font-bold text-white tracking-tight">Vision Tracker</h2>
                <p className="text-muted-foreground">Monitor your physical transformation and daily intake history.</p>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                <div className="lg:col-span-7">
                   <FoodManager />
                </div>
                <div className="lg:col-span-5">
                   <WeightTracker />
                </div>
              </div>
            </div>
          </div>
        );
      case "grocery":
        if (groceryList.length > 0) {
          return (
            <div className="flex-1 min-h-0 overflow-y-auto pt-20">
              <div className="max-w-7xl mx-auto p-8 animate-in">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex flex-col gap-2">
                    <h2 className="text-3xl font-bold text-white tracking-tight">Saved Grocery List</h2>
                    <p className="text-muted-foreground">Your active mission-critical inventory.</p>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setGroceryList([])}
                    className="bg-red-400/10 border-red-400/20 text-red-400 hover:bg-red-400/20 gap-2 h-9"
                  >
                    <Trash2 size={14} />
                    Clear List
                  </Button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {groceryList.map((cat, i) => (
                    <div key={i} className={cn(glassStyles.glassCard, "p-6 border border-white/5 space-y-4")}>
                      <div className="flex items-center gap-2">
                         <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 text-[10px] font-bold py-0.5">
                            {cat.category}
                         </Badge>
                      </div>
                      <ul className="space-y-2.5">
                        {cat.items.map((item, j) => (
                          <li 
                            key={j} 
                            onClick={() => toggleGroceryItem(i, j)}
                            className="flex items-start gap-2.5 group cursor-pointer"
                          >
                            <div className={cn(
                              "w-5 h-5 rounded border mt-0.5 transition-all shrink-0 flex items-center justify-center",
                              item.checked ? "bg-primary border-primary" : "border-white/40 group-hover:border-primary/50"
                            )}>
                               <Check size={12} className={cn("text-primary-foreground transition-all scale-0", item.checked && "scale-100")} />
                            </div>
                            <span className={cn(
                              "text-xs transition-all leading-relaxed",
                              item.checked ? "text-muted-foreground/40 line-through" : "text-white/90 group-hover:text-white"
                            )}>
                              {item.name || (typeof item === "string" ? item : "Unnamed Item")}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        }
        return (
          <div className="flex-1 h-full flex flex-col items-center justify-center p-8 text-center animate-in">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-6">
              <ShoppingCart size={32} />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Inventory Control</h2>
            <p className="text-muted-foreground max-w-md">
              The Grocery List view is currently integrated with the **AI Planner**. 
              Ask the to generate a list based on your meal plan!
            </p>
            <button 
              onClick={() => setActiveView("planner")}
              className="mt-6 px-6 py-2 rounded-xl bg-white/5 border border-white/10 text-xs font-bold text-white hover:bg-white/10 transition-all uppercase tracking-widest"
            >
              Go to AI Planner
            </button>
          </div>
        );
      default:
        return <ChatArea />;
    }
  };

  return (
    <div className="flex h-screen w-full relative overflow-hidden bg-[#080c10] font-sans selection:bg-primary/30 selection:text-primary">
      {/* Background Blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[30%] h-[30%] bg-cyan-500/5 rounded-full blur-[100px] pointer-events-none" />
      
      <NavSidebar />
      <main className="flex-1 relative flex flex-col h-full overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeView}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="flex-1 h-full overflow-hidden flex flex-col"
          >
            {renderView()}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}
