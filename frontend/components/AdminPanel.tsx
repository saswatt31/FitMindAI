"use client";

import React, { useState, useEffect } from "react";
import { X, RefreshCw, Terminal, CheckCircle2, AlertCircle } from "lucide-react";
import { API_BASE, cn } from "../lib/utils";
import { useApp } from "../context/AppContext";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function AdminPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [stats, setStats] = useState<any>(null);
  const [health, setHealth] = useState<any>(null);
  const { chatHistory } = useApp();

  const refreshStats = async () => {
    try {
      const [hRes, sRes] = await Promise.all([
        fetch(`${API_BASE}/health`),
        fetch(`${API_BASE}/stats`)
      ]);
      setHealth(await hRes.json());
      setStats(await sRes.json());
    } catch (e) {
      console.error("Failed to fetch admin stats", e);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === "D") {
        e.preventDefault();
        setIsOpen(prev => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    if (isOpen) {
      refreshStats();
    }
  }, [isOpen]);


  if (!isOpen) return null;

  return (
    <div className="fixed bottom-6 right-6 z-[1000] w-72 animate-in">
      <Card className="glass border-white/10 shadow-2xl overflow-hidden">
        <CardHeader className="p-4 border-b border-white/5 bg-white/5 flex flex-row items-center justify-between">
          <CardTitle className="text-[10px] uppercase tracking-[0.2em] font-bold text-primary flex items-center gap-2">
            <Terminal size={14} />
            Neural Debugger
          </CardTitle>
          <button onClick={() => setIsOpen(false)} className="text-muted-foreground hover:text-white transition-colors">
            <X size={14} />
          </button>
        </CardHeader>
        
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Engine Status</span>
            <div className="flex items-center gap-1.5 font-bold text-[10px] uppercase">
              {health?.status === "healthy" ? (
                <>
                  <span className="text-green-400">Stable</span>
                  <CheckCircle2 size={10} className="text-green-400" />
                </>
              ) : (
                <>
                  <span className="text-red-400">Offline</span>
                  <AlertCircle size={10} className="text-red-400" />
                </>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Vector Index</span>
            <span className="text-[10px] text-white font-mono">{stats?.total_chunks || "0"} Chunks</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Stack Trace</span>
            <span className="text-[10px] text-white font-mono">{chatHistory.length} Frames</span>
          </div>

          <div className="h-px bg-white/5 my-2" />

          <Button 
            variant="outline" 
            size="sm" 
            onClick={refreshStats}
            className="w-full h-8 bg-white/5 border-white/10 hover:bg-white/10 text-[9px] uppercase font-bold tracking-widest gap-2"
          >
            <RefreshCw size={12} className={cn(health?.status !== "healthy" && "animate-spin")} />
            Sync Hardware
          </Button>
          
          <div className="text-[8px] text-muted-foreground/30 text-center uppercase tracking-widest font-bold">
            Ctrl+Shift+D to dismiss
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
