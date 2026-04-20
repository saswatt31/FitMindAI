"use client";

import React, { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import { Mic, Camera, Send, User, Trash2, Copy, ShoppingCart, Download, Sparkles, Loader2, FileText } from "lucide-react";
import { useApp } from "../context/AppContext";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { API_BASE, cn } from "../lib/utils";
import { StreamEvent } from "../lib/types";
import ShoppingListModal from "./ShoppingListModal";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";
import remarkGfm from "remark-gfm";
import { FoodImage } from "./FoodImage";
import glassStyles from "./Glass.module.css";

const MarkdownComponents: any = {
  table: ({ children }: any) => (
    <div className="my-6 w-full overflow-hidden rounded-xl border border-white/10 bg-white/[0.02]">
      <table className="w-full border-collapse text-sm">{children}</table>
    </div>
  ),
  thead: ({ children }: any) => (
    <thead className="bg-white/[0.05] border-b border-white/10">{children}</thead>
  ),
  th: ({ children }: any) => (
    <th className="px-4 py-3 text-left text-[10px] uppercase font-bold tracking-widest text-primary/80">
      {children}
    </th>
  ),
  td: ({ children }: any) => {
    return (
      <td className="px-4 py-3 border-b border-white/5 align-middle">
        <span>{children}</span>
      </td>
    );
  },
};

export default function ChatArea() {
  const { chatHistory, addChatMessage, profile, setSources, clearChat } = useApp();
  const [userInput, setUserInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [streamingText, setStreamingText] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [isAnalyzingImage, setIsAnalyzingImage] = useState(false);
  const [shoppingModal, setShoppingModal] = useState({ isOpen: false, text: "" });
  const [isExporting, setIsExporting] = useState(false);
  
  const isProfileComplete = profile && 
    profile.age > 10 && 
    profile.height_cm > 100 && 
    profile.weight_kg > 30 && 
    profile.fitness_goal !== "" && 
    profile.diet_preference !== "";
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const streamingRef = useRef("");
  const throttleTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatHistory, isTyping, streamingText]);

  const handleSendMessage = async () => {
    if (!userInput.trim() || !profile) return;

    const message = userInput.trim();
    setUserInput("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";
    
    addChatMessage({ role: "user", content: message });
    setIsTyping(true);
    setStreamingText("");

    let fullAiResponse = "";
    
    try {
      const response = await fetch(`${API_BASE}/plan/stream`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...profile,
          question: message,
          chat_history: chatHistory.slice(-6)
        })
      });

      if (!response.ok) throw new Error("Stream request failed");

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              try {
                const data: StreamEvent = JSON.parse(line.slice(6));
                if (data.type === "chunk") {
                  streamingRef.current += data.content;
                  
                  // Throttle state updates to 60fps max
                  if (!throttleTimeoutRef.current) {
                    throttleTimeoutRef.current = setTimeout(() => {
                      setStreamingText(streamingRef.current);
                      throttleTimeoutRef.current = null;
                    }, 16);
                  }
                } else if (data.type === "meta") {
                  setSources(data.sources);
                } else if (data.type === "done") {
                  if (throttleTimeoutRef.current) {
                    clearTimeout(throttleTimeoutRef.current);
                    throttleTimeoutRef.current = null;
                  }
                  addChatMessage({ role: "assistant", content: streamingRef.current });
                  setStreamingText("");
                  streamingRef.current = "";
                }
              } catch (e) {
                console.error("Failed to parse SSE line", e);
              }
            }
          }
        }
      }
    } catch (error) {
      console.error("Chat error:", error);
      addChatMessage({ role: "assistant", content: "❌ Connection error. Please check if the backend is running." });
    } finally {
      setIsTyping(false);
      setStreamingText("");
      streamingRef.current = "";
    }
  };

  const handleMealImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !profile) return;

    setIsAnalyzingImage(true);
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64 = (reader.result as string).split(",")[1];
      try {
        const res = await fetch(`${API_BASE}/analyze-meal`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ image_base64: base64, media_type: file.type })
        });
        const data = await res.json();
        if (data.success && data.analysis) {
          const a = data.analysis;
          const content = `📸 **Meal Analysis**\n\n**Foods:** ${a.foods_detected.join(", ")}\n\n| Calories | Protein | Carbs | Fat |\n| --- | --- | --- | --- |\n| ${a.calories} | ${a.protein_g}g | ${a.carbs_g}g | ${a.fat_g}g |\n\n${a.notes ? `💡 ${a.notes}` : ""}`;
          addChatMessage({ role: "assistant", content });
        }
      } catch (err) {
        console.error("Vision AI failed", err);
      } finally {
        setIsAnalyzingImage(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const toggleVoice = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Voice recognition not supported in this browser.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.onstart = () => setIsListening(true);
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setUserInput(transcript);
    };
    recognition.onend = () => setIsListening(false);
    recognition.start();
  };

  const exportPDF = async (text: string) => {
    setIsExporting(true);
    try {
      const exportContainer = document.createElement("div");
      exportContainer.style.position = "absolute";
      exportContainer.style.left = "-9999px";
      exportContainer.style.width = "800px";
      exportContainer.style.padding = "40px";
      exportContainer.style.background = "white";
      exportContainer.style.color = "black";
      exportContainer.style.fontFamily = "sans-serif";
      
      exportContainer.innerHTML = `
        <div style="border-bottom: 2px solid #c6f135; padding-bottom: 20px; margin-bottom: 30px; display: flex; align-items: center; justify-content: space-between;">
          <h1 style="margin: 0; font-size: 24px; color: #000;">🧬 FitMind AI</h1>
          <span style="font-size: 10px; text-transform: uppercase; letter-spacing: 0.1em; color: #666;">Generated on ${new Date().toLocaleDateString()}</span>
        </div>
        <div style="margin-bottom: 20px;">
          <h2 style="font-size: 18px; color: #333; margin-bottom: 10px;">Personalized Nutrition Protocol</h2>
          <div style="font-size: 12px; color: #666;">
            Goal: ${profile?.fitness_goal?.replace("_", " ")} | Protocol: ${profile?.diet_preference}
          </div>
        </div>
        <div id="pdf-content" style="font-size: 14px; line-height: 1.6;"></div>
        <div style="margin-top: 40px; pt-20; border-top: 1px solid #eee; padding-top: 10px; font-size: 10px; color: #999; text-align: center;">
          FitMind AI — Personalized Science-Based Performance Protocol. Verify all advice with a professional.
        </div>
      `;
      
      document.body.appendChild(exportContainer);
      
      // We use a separate render for the markdown to ensure it uses PDF-specific styling
      const contentArea = exportContainer.querySelector("#pdf-content");
      if (contentArea) {
        // Simple markdown to HTML conversion for the PDF
        // We'll use a hidden div to render the ReactMarkdown then grab its HTML
        const tempRender = document.createElement("div");
        tempRender.className = "markdown-prose-pdf";
        // Apply direct styles for tables to ensure they look "table-wise"
        const style = document.createElement("style");
        style.innerHTML = `
          .markdown-prose-pdf table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          .markdown-prose-pdf th { background: #f8f9fa; border: 1px solid #dee2e6; padding: 12px; text-align: left; font-weight: bold; font-size: 12px; }
          .markdown-prose-pdf td { border: 1px solid #dee2e6; padding: 12px; font-size: 12px; }
          .markdown-prose-pdf h1, .markdown-prose-pdf h2, .markdown-prose-pdf h3 { color: #000; margin-top: 20px; }
          .markdown-prose-pdf p { margin-bottom: 10px; }
        `;
        document.head.appendChild(style);
        
        // This is a bit of a trick: we want the markdown as HTML.
        // Since we are in React, we'll just use the content directly.
        // For a more robust solution, we'd use a server-side parser, 
        // but for now, we'll format the text slightly better.
        contentArea.innerHTML = text
          .split("\n")
          .map(line => {
            if (line.startsWith("|")) return line; // Let tables be handled by a better parser or logic
            if (line.startsWith("#")) return `<h3 style="margin-top:20px">${line.replace(/#/g, "")}</h3>`;
            return `<p>${line}</p>`;
          })
          .join("");
          
        // Re-handle tables if present
        if (text.includes("|")) {
          const lines = text.split("\n");
          let inTable = false;
          let tableHtml = "<table>";
          const newContent = [];
          
          for (let line of lines) {
            if (line.trim().startsWith("|")) {
              if (!inTable) { inTable = true; tableHtml = "<table>"; }
              const cells = line.split("|").filter(c => c.trim() !== "");
              if (line.includes("---")) continue;
              tableHtml += "<tr>" + cells.map(c => `<td>${c.trim()}</td>`).join("") + "</tr>";
            } else {
              if (inTable) { inTable = false; tableHtml += "</table>"; newContent.push(tableHtml); }
              newContent.push(line);
            }
          }
          if (inTable) { tableHtml += "</table>"; newContent.push(tableHtml); }
          
          contentArea.innerHTML = newContent.map(n => n.startsWith("<table") ? n : `<p>${n}</p>`).join("");
        }
      }

      const canvas = await html2canvas(exportContainer, { scale: 2 });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
      pdf.save(`FitMind-Plan-${new Date().toISOString().slice(0,10)}.pdf`);
      
      document.body.removeChild(exportContainer);
    } catch (error) {
      console.error("PDF Export failed", error);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <main className=" h-full min-h-0 flex flex-col relative z-10 bg-[#080c10]">
      {/* Header */}
      <header className={cn(glassStyles.glass, "h-20 border-b border-white/5 flex items-center justify-between px-8 bg-black/40")}>
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold text-white tracking-tight">AI Command Center</h2>
            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 text-[9px] uppercase px-1.5 tracking-wider h-4">Beta v2.1</Badge>
          </div>
          <p className="text-xs text-muted-foreground opacity-70">Llama 3.3 70B · Local RAG · Vision Enabled</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/5">
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse shadow-[0_0_8px_rgba(198,241,53,0.5)]" />
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">Neural Engine Online</span>
          </div>
        </div>
      </header>

      {/* Message List */}
      <ScrollArea className="flex-1 px-8">
        <div className="max-w-4xl mx-auto space-y-8">
          {chatHistory.length === 0 ? (
            <div className="h-[60vh] flex flex-col items-center justify-center text-center animate-in">
              <div className="w-20 h-20 rounded-3xl bg-primary/10 flex items-center justify-center text-3xl mb-6 shadow-[0_0_40px_rgba(198,241,53,0.1)] border border-primary/20">🧬</div>
              <h3 className="text-2xl font-bold text-white mb-2">Initialize Your Journey</h3>
              <p className="text-xs text-muted-foreground max-w-sm text-sm opacity-80 leading-relaxed mb-8">
                Connect with the world&apos;s most advanced AI fitness mind. Describe your goals, analyze your meals, or build a custom routine.
              </p>
              <div className="flex flex-wrap justify-center gap-3">
                {["Build a meal plan", "Muscle gain routine", "Low carb options"].map(suggest => (
                  <Button 
                    key={suggest} 
                    variant="outline" 
                    className="rounded-full bg-white/5 border-white/10 hover:bg-white/10 text-xs text-muted-foreground hover:text-primary transition-all px-6"
                    onClick={() => setUserInput(suggest)}
                  >
                    {suggest}
                  </Button>
                ))}
              </div>
            </div>
          ) : (
            chatHistory.map((msg, i) => (
              <div key={i} className={cn("flex gap-4 animate-in", msg.role === "user" ? "flex-row-reverse" : "flex-row")}>
                <div className={cn(
                  "w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0 border",
                  msg.role === "user" ? "bg-white/5 border-white/10 text-white" : "bg-primary border-primary shadow-[0_0_15px_rgba(198,241,53,0.2)] text-primary-foreground"
                )}>
                  {msg.role === "user" ? <User size={16} /> : "🧬"}
                </div>
                <div className={cn("flex flex-col space-y-2 max-w-[85%]", msg.role === "user" ? "items-end" : "items-start")}>
                  <div className={cn(
                    "p-5 rounded-3xl text-sm leading-relaxed",
                    msg.role === "user" 
                      ? "bg-white/5 text-white rounded-tr-sm border border-white/10" 
                      : cn(glassStyles.glassCard, "text-[#dde8f0] rounded-tl-sm")
                  )}>
                    <div className="markdown-prose">
                      <ReactMarkdown 
                        remarkPlugins={[remarkGfm]}
                        components={MarkdownComponents}
                      >
                        {msg.content}
                      </ReactMarkdown>
                    </div>
                  </div>
                  {msg.role === "assistant" && (
                    <div className="flex gap-1.5 opacity-40 hover:opacity-100 transition-opacity translate-x-1">
                      <Button variant="ghost" size="icon" className="w-7 h-7 hover:bg-white/5 text-muted-foreground hover:text-white" onClick={() => navigator.clipboard.writeText(msg.content)}><Copy size={12} /></Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="w-7 h-7 hover:bg-white/5 text-muted-foreground hover:text-white" 
                        onClick={() => exportPDF(msg.content)}
                        disabled={isExporting}
                      >
                        {isExporting ? <Loader2 size={12} className="animate-spin" /> : <Download size={12} />}
                      </Button>
                      <Button variant="ghost" size="icon" className="w-7 h-7 hover:bg-white/5 text-muted-foreground hover:text-white" onClick={() => setShoppingModal({ isOpen: true, text: msg.content })}><ShoppingCart size={12} /></Button>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
          
          {(isTyping || streamingText) && (
            <div className="flex gap-4 animate-in">
              <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center text-sm font-bold border border-primary shadow-[0_0_15px_rgba(198,241,53,0.2)] text-primary-foreground transition-transform hover:scale-110">🧬</div>
              <div className="flex flex-col space-y-2 max-w-[85%]">
                <div className={cn(glassStyles.glassCard, "p-5 rounded-3xl rounded-tl-sm text-[#dde8f0] border border-white/10 text-sm leading-relaxed")}>
                  {streamingText ? (
                    <div className="markdown-prose">
                      <ReactMarkdown 
                        remarkPlugins={[remarkGfm]}
                        components={MarkdownComponents}
                      >
                        {streamingText}
                      </ReactMarkdown>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 py-1">
                      <span className="w-1.5 h-1.5 bg-primary/50 rounded-full animate-bounce [animation-delay:-0.3s]" />
                      <span className="w-1.5 h-1.5 bg-primary/50 rounded-full animate-bounce [animation-delay:-0.15s]" />
                      <span className="w-1.5 h-1.5 bg-primary/50 rounded-full animate-bounce" />
                    </div>
                  )}
                  {streamingText && <span className="inline-block w-2 h-4 bg-primary/80 ml-1 translate-y-1 animate-pulse" />}
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} className="h-4" />
        </div>
      </ScrollArea>

      {/* Input Area */}
      <div className="px-6 bg-transparent relative">
        <div className="max-w-4xl mx-auto">
          <input type="file" ref={fileInputRef} style={{ display: "none" }} accept="image/*" onChange={handleMealImage} />
          
          {!isProfileComplete && (
            <div className="absolute inset-x-0 bottom-full mb-4 animate-in slide-in-from-bottom-2">
              <div className={cn(glassStyles.glass, "p-4 rounded-2xl border-primary/20 bg-primary/5 flex items-center gap-4")}>
                <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center text-primary shrink-0">
                  <Badge size={16} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white leading-tight">Bio-data Missing</h4>
                  <p className="text-[11px] text-muted-foreground">The AI requires your profile configuration to generate accurate plans. Please complete your profile on the right.</p>
                </div>
              </div>
            </div>
          )}

          <div className={cn(
            glassStyles.glass, 
            "rounded-3xl border-white/10 shadow-2xl relative overflow-hidden p-2 pr-4 transition-all duration-500",
            !isProfileComplete && "opacity-50 grayscale pointer-events-none"
          )}>
            <div className="flex items-end min-h-[56px]">
              <div className="flex pb-2 px-1">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className={cn("w-10 h-10 text-muted-foreground hover:text-primary transition-colors", isListening && "text-primary animate-pulse")} 
                  onClick={toggleVoice}
                >
                  <Mic size={18} />
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className={cn("w-10 h-10 text-muted-foreground hover:text-primary transition-colors", isAnalyzingImage && "animate-spin text-primary")} 
                  onClick={() => fileInputRef.current?.click()}
                >
                  {isAnalyzingImage ? <Loader2 size={18} /> : <Camera size={18} />}
                </Button>
              </div>
              
              <textarea
                ref={textareaRef}
                className="flex-1 bg-transparent border-none focus:ring-0 text-gray-200 text-sm py-4 resize-none max-h-40 placeholder:text-muted-foreground/50 transition-all font-sans px-5"
                placeholder={isProfileComplete ? "Ask about nutrition, workout, or plate analysis..." : "Configure your profile to unlock the AI..."}
                rows={1}
                value={userInput}
                onChange={(e) => { 
                  setUserInput(e.target.value); 
                  if (textareaRef.current) {
                    textareaRef.current.style.height = "auto";
                    textareaRef.current.style.height = textareaRef.current.scrollHeight + "px";
                  }
                }}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSendMessage(); } }}
                disabled={!isProfileComplete}
              />
              
              <div className="pb-2 pl-3">
                <Button 
                  size="icon" 
                  className={cn(
                    "w-10 h-10 rounded-xl transition-all",
                    userInput.trim() ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20 scale-100" : "bg-white/5 text-muted-foreground scale-95 opacity-50"
                  )} 
                  onClick={handleSendMessage}
                  disabled={!userInput.trim() || !profile || isTyping}
                >
                  <Send size={18} />
                </Button>
              </div>
            </div>
          </div>
          
          <div className="flex items-center justify-between px-2 text-[10px] uppercase tracking-widest text-muted-foreground/40 font-semibold">
            <div className="flex gap-4">
              <span>Enter to send</span>
              <span className="flex items-center gap-1"><Sparkles size={10} /> Shift+Enter for new line</span>
            </div>
            <button onClick={clearChat} className="flex items-center gap-1 hover:text-red-400 transition-colors">
              <Trash2 size={10} /> Clear History
            </button>
          </div>
        </div>
      </div>

      <ShoppingListModal 
        isOpen={shoppingModal.isOpen} 
        onClose={() => setShoppingModal({ ...shoppingModal, isOpen: false })} 
        mealPlanText={shoppingModal.text} 
      />
    </main>
  );
}
