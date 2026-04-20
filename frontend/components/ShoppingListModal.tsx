"use client";

import React, { useState, useEffect } from "react";
import { useApp } from "../context/AppContext";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ShoppingCart, Copy, Check, ListChecks } from "lucide-react";
import { API_BASE } from "../lib/utils";
import { Badge } from "@/components/ui/badge";

interface ShoppingListModalProps {
  isOpen: boolean;
  onClose: () => void;
  mealPlanText: string;
}

interface Category {
  category: string;
  items: { name: string; checked: boolean }[];
}

export default function ShoppingListModal({ isOpen, onClose, mealPlanText }: ShoppingListModalProps) {
  const { setGroceryList, setActiveView } = useApp();
  const [list, setList] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isOpen && mealPlanText) {
      generateList();
    }
  }, [isOpen, mealPlanText]);

  const generateList = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/shopping-list`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ meal_plan: mealPlanText })
      });
      const data = await res.json();
      if (data.categories) {
        const formatted = data.categories.map((cat: any) => ({
          ...cat,
          items: cat.items.map((name: string) => ({ name, checked: false }))
        }));
        setList(formatted);
      }
    } catch (err) {
      console.error("Failed to generate shopping list", err);
    } finally {
      setIsLoading(false);
    }
  };

  const copyAsText = () => {
    const text = list.map(c => `[${c.category}]\n${c.items.map(i => `- ${i.name}`).join("\n")}`).join("\n\n");
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  
  const saveToList = () => {
    setGroceryList(list);
    setActiveView("grocery");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl bg-[#0e1419] border-white/10 text-white p-0 overflow-hidden shadow-2xl">
        <div className="absolute top-[-10%] right-[-10%] w-40 h-40 bg-primary/20 rounded-full blur-[80px] pointer-events-none" />
        
        <DialogHeader className="p-8 pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20 shadow-[0_0_20px_rgba(198,241,53,0.1)]">
                <ShoppingCart size={20} />
              </div>
              <div>
                <DialogTitle className="text-xl font-bold tracking-tight">Shopping List</DialogTitle>
                <p className="text-xs text-muted-foreground mt-1">Smart categorization from your meal plan</p>
              </div>
            </div>
            {list.length > 0 && (
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={saveToList}
                  className="bg-primary/20 border-primary/30 hover:bg-primary/30 gap-2 h-8 text-[10px] uppercase font-bold text-primary"
                >
                  <ListChecks size={12} />
                  Save to List
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={copyAsText}
                  className="bg-white/5 border-white/10 hover:bg-white/10 gap-2 h-8 text-[10px] uppercase font-bold"
                >
                  {copied ? <Check size={12} className="text-primary" /> : <Copy size={12} />}
                  {copied ? "Copied" : "Copy List"}
                </Button>
              </div>
            )}
          </div>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] px-8 pb-8">
          {isLoading ? (
            <div className="py-20 flex flex-col items-center justify-center space-y-4">
              <div className="w-8 h-8 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
              <p className="text-xs text-muted-foreground uppercase tracking-widest font-bold">Neural Categorization...</p>
            </div>
          ) : list.length === 0 ? (
            <div className="py-20 text-center space-y-4">
              <ListChecks size={40} className="mx-auto text-muted-foreground/20" />
              <p className="text-sm text-muted-foreground">Unable to generate list. Please try again.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
              {list.map((cat, i) => (
                <div key={i} className="animate-in" style={{ animationDelay: `${i * 100}ms` }}>
                  <div className="flex items-center gap-2 mb-3">
                    <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 text-[9px] uppercase font-bold px-2">
                      {cat.category}
                    </Badge>
                  </div>
                  <ul className="space-y-2">
                    {cat.items.map((item, j) => (
                      <li key={j} className="flex items-start gap-2 group cursor-pointer">
                        <div className="w-4 h-4 rounded border border-white/40 mt-0.5 group-hover:border-primary/50 transition-colors shrink-0" />
                        <span className="text-xs text-white/90 group-hover:text-white transition-colors leading-tight">{item.name}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
        
        <div className="p-4 bg-white/[0.02] border-t border-white/5 text-center text-[10px] text-muted-foreground/40 italic">
          Tip: Check off items as you shop in-store
        </div>
      </DialogContent>
    </Dialog>
  );
}
