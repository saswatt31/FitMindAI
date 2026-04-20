"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode, useMemo } from "react";
import { UserProfile, FoodEntry, WeightEntry, ChatMessage, NutritionTargets, RAGSource, GroceryCategory } from "../lib/types";
import { calculateNutritionTargets } from "../lib/utils";

interface AppContextType {
  profile: UserProfile | null;
  setProfile: (p: UserProfile | null) => void;
  nutrition: NutritionTargets | null;
  
  foodLog: FoodEntry[];
  addFood: (f: FoodEntry) => void;
  deleteFood: (idx: number) => void;
  clearFoodLog: () => void;
  
  weightLog: WeightEntry[];
  addWeight: (w: number) => void;
  
  chatHistory: ChatMessage[];
  addChatMessage: (msg: ChatMessage) => void;
  clearChat: () => void;
  
  sources: RAGSource[];
  setSources: (s: RAGSource[]) => void;

  nlOpen: boolean;
  setNLOpen: (open: boolean) => void;

  activeView: string;
  setActiveView: (view: string) => void;

  groceryList: GroceryCategory[];
  setGroceryList: (list: GroceryCategory[]) => void;
  toggleGroceryItem: (categoryIdx: number, itemIdx: number) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const FOOD_LOG_KEY = "fitmind_food_log_next";
const WEIGHT_LOG_KEY = "fitmind_weight_log_next";
const CHAT_KEY = "fitmind_chat_next";
const GROCERY_KEY = "fitmind_grocery_list_next";

export function AppProvider({ children }: { children: ReactNode }) {
  const [profile, setProfileState] = useState<UserProfile | null>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("fitmind_current_profile");
      try { return saved ? JSON.parse(saved) : null; } catch { return null; }
    }
    return null;
  });

  const [foodLog, setFoodLog] = useState<FoodEntry[]>(() => {
    if (typeof window === "undefined") return [];
    const today = new Date().toDateString();
    const saved = localStorage.getItem(FOOD_LOG_KEY);
    try { 
      if (!saved) return [];
      const parsed = JSON.parse(saved);
      return parsed[today] || [];
    } catch { return []; }
  });

  const [weightLog, setWeightLog] = useState<WeightEntry[]>(() => {
    if (typeof window === "undefined") return [];
    const saved = localStorage.getItem(WEIGHT_LOG_KEY);
    try { return saved ? JSON.parse(saved) : []; } catch { return []; }
  });

  const [chatHistory, setChatHistory] = useState<ChatMessage[]>(() => {
    if (typeof window === "undefined") return [];
    const saved = localStorage.getItem(CHAT_KEY);
    try { return saved ? JSON.parse(saved) : []; } catch { return []; }
  });

  const [sources, setSources] = useState<RAGSource[]>([]);
  const [nlOpen, setNLOpen] = useState(false);
  const [activeView, setActiveView] = useState("planner");
  const [groceryList, setGroceryListState] = useState<GroceryCategory[]>(() => {
    if (typeof window === "undefined") return [];
    const saved = localStorage.getItem(GROCERY_KEY);
    try { 
      const parsed = saved ? JSON.parse(saved) : [];
      // MIGRATION: Ensure all items are objects { name, checked }
      return (parsed || []).map((cat: any) => ({
        ...cat,
        items: (cat.items || []).map((it: any) => 
          typeof it === "string" ? { name: it, checked: false } : it
        )
      }));
    } catch { return []; }
  });

  const nutrition = useMemo(() => {
    return profile ? calculateNutritionTargets(profile) : null;
  }, [profile]);

  // Persist profile changes
  useEffect(() => {
    if (profile) {
      localStorage.setItem("fitmind_current_profile", JSON.stringify(profile));
    } else {
      localStorage.removeItem("fitmind_current_profile");
    }
  }, [profile]);

  const setProfile = (p: UserProfile | null) => {
    setProfileState(p);
  };

  const addFood = (f: FoodEntry) => {
    const newLog = [...foodLog, f];
    setFoodLog(newLog);
    const today = new Date().toDateString();
    const all = JSON.parse(localStorage.getItem(FOOD_LOG_KEY) || "{}");
    all[today] = newLog;
    localStorage.setItem(FOOD_LOG_KEY, JSON.stringify(all));
  };

  const deleteFood = (idx: number) => {
    const newLog = foodLog.filter((_, i) => i !== idx);
    setFoodLog(newLog);
    const today = new Date().toDateString();
    const all = JSON.parse(localStorage.getItem(FOOD_LOG_KEY) || "{}");
    all[today] = newLog;
    localStorage.setItem(FOOD_LOG_KEY, JSON.stringify(all));
  };

  const clearFoodLog = () => {
    setFoodLog([]);
    const today = new Date().toDateString();
    const all = JSON.parse(localStorage.getItem(FOOD_LOG_KEY) || "{}");
    all[today] = [];
    localStorage.setItem(FOOD_LOG_KEY, JSON.stringify(all));
  };

  const addWeight = (w: number) => {
    const today = new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short" });
    const newWeightLog = [...weightLog];
    const idx = newWeightLog.findIndex((e) => e.date === today);
    if (idx >= 0) {
      newWeightLog[idx].weight = w;
    } else {
      newWeightLog.push({ date: today, weight: w });
    }
    if (newWeightLog.length > 30) newWeightLog.shift();
    setWeightLog(newWeightLog);
    localStorage.setItem(WEIGHT_LOG_KEY, JSON.stringify(newWeightLog));
  };

  const addChatMessage = (msg: ChatMessage) => {
    const newChat = [...chatHistory, msg];
    setChatHistory(newChat);
    localStorage.setItem(CHAT_KEY, JSON.stringify(newChat));
  };

  const clearChat = () => {
    setChatHistory([]);
    localStorage.removeItem(CHAT_KEY);
  };
  
  const setGroceryList = (list: GroceryCategory[]) => {
    setGroceryListState(list);
    localStorage.setItem(GROCERY_KEY, JSON.stringify(list));
  };
  
  const toggleGroceryItem = (catIdx: number, itemIdx: number) => {
    const newList = [...groceryList];
    const item = newList[catIdx].items[itemIdx];
    newList[catIdx].items[itemIdx] = { ...item, checked: !item.checked };
    setGroceryList(newList);
  };

  return (
    <AppContext.Provider
      value={{
        profile,
        setProfile,
        nutrition,
        foodLog,
        addFood,
        deleteFood,
        clearFoodLog,
        weightLog,
        addWeight,
        chatHistory,
        addChatMessage,
        clearChat,
        sources,
        setSources,
        nlOpen,
        setNLOpen,
        activeView,
        setActiveView,
        groceryList,
        setGroceryList,
        toggleGroceryItem,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
}
