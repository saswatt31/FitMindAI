"use client";

import React from "react";
import { useApp } from "../context/AppContext";
import { 
  LayoutDashboard, 
  MessageSquare, 
  Eye, 
  ShoppingCart, 
  Settings, 
  LogOut,
  BrainCircuit
} from "lucide-react";
import styles from "./Glass.module.css";
import { cn } from "../lib/utils";

const NAV_ITEMS = [
  { id: "planner", label: "AI Planner", icon: MessageSquare },
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "tracker", label: "Vision Tracker", icon: Eye },
  { id: "grocery", label: "Grocery List", icon: ShoppingCart },
];

export default function NavSidebar() {
  const { activeView, setActiveView } = useApp();

  return (
    <aside className={cn(styles.glass, "w-64 h-full flex flex-col border-r border-white/5 relative z-30 mt-20")}>
      <div className="p-8">
        <div className="flex items-center gap-3 mb-10 group cursor-pointer">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-primary-foreground shadow-[0_0_20px_rgba(198,241,53,0.3)] transition-transform group-hover:scale-110">
            <BrainCircuit size={22} />
          </div>
          <div className="flex flex-col">
            <h1 className="text-xl font-bold tracking-tight text-white leading-none">FitMind</h1>
            <span className="text-[10px] uppercase tracking-[0.2em] text-primary font-bold mt-1">AI</span>
          </div>
        </div>

        <nav className="space-y-2">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveView(item.id)}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all",
                activeView === item.id 
                  ? "bg-primary/10 text-primary border border-primary/20 shadow-[0_0_15px_rgba(198,241,53,0.05)]" 
                  : "text-muted-foreground hover:bg-white/5 hover:text-white border border-transparent"
              )}
            >
              <item.icon size={18} className={cn(activeView === item.id ? "text-primary" : "opacity-70")} />
              {item.label}
              {activeView === item.id && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              )}
            </button>
          ))}
        </nav>
      </div>

      <div className="mt-auto p-6 space-y-4">
        <div className={cn(styles.glassCard, "p-4 border border-white/5 rounded-2xl")}>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-full bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Settings size={14} />
            </div>
            <span className="text-xs font-semibold text-white">System Status</span>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-[10px]">
              <span className="text-muted-foreground">Neural Load</span>
              <span className="text-cyan-400">12%</span>
            </div>
            <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
              <div className="h-full w-[12%] bg-cyan-400 rounded-full" />
            </div>
          </div>
        </div>

        <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-muted-foreground hover:text-red-400 hover:bg-red-400/5 transition-all">
          <LogOut size={18} className="opacity-70" />
          Logout
        </button>
      </div>
    </aside>
  );
}
