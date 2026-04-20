"use client";

import React from "react";
import { useApp } from "../context/AppContext";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Library, FileText, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export default function RAGSources() {
  const { sources } = useApp();

  if (!sources || sources.length === 0) return null;

  return (
    <Card className="bg-white/[0.02] border-white/5 overflow-hidden animate-in">
      <CardHeader className="p-4 pb-2">
        <CardTitle className="text-[11px] uppercase tracking-widest text-muted-foreground flex items-center gap-2">
          <Library className="w-3.5 h-3.5 text-primary/70" />
          Knowledge Retrieval
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-4 space-y-4">
        {sources.map((s, i) => (
          <div key={i} className="group space-y-2 last:mb-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 max-w-[70%]">
                <FileText className="w-3 h-3 text-muted-foreground/60" />
                <span className="text-[10px] font-bold text-white uppercase tracking-tight truncate">
                  {s.source.replace(".txt", "").replace(/_/g, " ")}
                </span>
              </div>
              <Badge variant="outline" className="text-[8px] h-4 px-1.5 bg-white/5 text-muted-foreground font-mono border-white/5">
                {Math.round(s.relevance * 100)}% Match
              </Badge>
            </div>
            
            <div className="relative w-full h-1 bg-white/5 rounded-full overflow-hidden">
              <div 
                className="absolute top-0 left-0 h-full bg-primary/40 rounded-full transition-all duration-1000 ease-out" 
                style={{ width: `${Math.round(s.relevance * 100)}%` }} 
              />
            </div>

            <div className="p-2 rounded-lg bg-black/20 border border-white/[0.02] group-hover:border-primary/20 transition-colors">
              <p className="text-[9px] leading-relaxed text-muted-foreground line-clamp-2 italic opacity-80">
                &quot;{s.text.substring(0, 130)}…&quot;
              </p>
            </div>
          </div>
        ))}

        <div className="pt-2 flex items-center gap-1.5 text-[8px] text-muted-foreground/40 font-bold uppercase tracking-widest justify-center">
          <CheckCircle2 size={10} /> Verified Knowledge Base Chunks
        </div>
      </CardContent>
    </Card>
  );
}
