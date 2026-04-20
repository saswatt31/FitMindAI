"use client";

import React, { useState } from "react";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Maximize2, X } from "lucide-react";
import Image from "next/image";

interface FoodImageProps {
  keyword: string;
  size?: "sm" | "md" | "lg";
}

export function FoodImage({ keyword, size = "sm" }: FoodImageProps) {
  const [isOpen, setIsOpen] = useState(false);
  
  // Clean up keyword (remove quantities, special chars)
  const cleanKeyword = keyword
    .split(",")[0]
    .split("(")[0]
    .replace(/[0-9]|g|oz|ml|cup|tsp|tbsp/gi, "")
    .trim();

  // LoremFlickr URL for relevant food images
  const imageUrl = `https://loremflickr.com/800/600/food,${encodeURIComponent(cleanKeyword)}`;
  const thumbUrl = `https://loremflickr.com/200/200/food,${encodeURIComponent(cleanKeyword)}`;

  const sizeClasses = {
    sm: "w-8 h-8",
    md: "w-12 h-12",
    lg: "w-20 h-20"
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <button className="group relative flex-shrink-0 cursor-zoom-in outline-none">
          <div className={`${sizeClasses[size]} rounded-lg overflow-hidden border border-white/10 glass shadow-lg transition-transform group-hover:scale-105 active:scale-95`}>
            <img 
              src={thumbUrl} 
              alt={keyword} 
              className="w-full h-full object-cover"
              onError={(e) => {
                // Fallback to a generic food icon if image fails
                (e.target as HTMLImageElement).src = "https://loremflickr.com/200/200/healthy,meal";
              }}
            />
            <div className="absolute inset-0 bg-primary/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <Maximize2 className="w-3 h-3 text-white" />
            </div>
          </div>
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl p-0 overflow-hidden bg-black/90 border-white/10 animate-zoom shadow-[0_0_50px_rgba(0,0,0,0.5)]">
        <div className="relative aspect-video w-full">
          <img 
            src={imageUrl} 
            alt={keyword} 
            className="w-full h-full object-contain"
          />
          <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent">
            <h3 className="text-xl font-bold text-white capitalize">{cleanKeyword}</h3>
            <p className="text-sm text-white/60">AI Suggested Meal Visualization</p>
          </div>
          <button 
            onClick={() => setIsOpen(false)}
            className="absolute top-4 right-4 w-10 h-10 rounded-full glass border border-white/20 flex items-center justify-center text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
