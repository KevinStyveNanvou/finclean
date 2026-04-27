// components/Chat.tsx
"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { MessageCircle, X, Minimize2, Maximize2, Bot, User, Wifi, WifiOff } from "lucide-react";
import EntryChat from "@/components/entrychat";

export type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
};

interface ChatProps {
  isOpen: boolean;
  onClose: () => void;
  messages: ChatMessage[];
  onSendMessage: (message: string) => void;
  isLoading?: boolean;
  connected?: boolean;
  title?: string;
  subtitle?: string;
  initialWidth?: number;
  minWidth?: number;
  maxWidth?: number;
}

const Chat: React.FC<ChatProps> = ({ isOpen, onClose, messages, onSendMessage, isLoading = false, connected = true, title = "FinClean AI", subtitle = "Security Assistant", initialWidth = 360, minWidth = 300, maxWidth = 700, }) => {
  const [width, setWidth] = useState(initialWidth);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const startXRef = useRef(0);
  const startWidthRef = useRef(0);

  // Auto-scroll vers le bas
  useEffect(() => {
    if (!isMinimized) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isMinimized]);

  // Resize drag
  const onMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    startXRef.current = e.clientX;
    startWidthRef.current = width;
    setIsResizing(true);
  }, [width]);

  useEffect(() => {
    if (!isResizing) return;

    const onMouseMove = (e: MouseEvent) => {
      const delta = startXRef.current - e.clientX;
      const newWidth = Math.min(Math.max(startWidthRef.current + delta, minWidth), maxWidth);
      setWidth(newWidth);
    };

    const onMouseUp = () => setIsResizing(false);

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, [isResizing, minWidth, maxWidth]);

  if (!isOpen) return null;

  return <div className=" bg-transparent">
    {/* Overlay de resize */}
    {isResizing && (
      <div className="fixed inset-0 z-40 cursor-ew-resize select-none" />
    )}

    <div
      ref={containerRef}
      className="fixed top-16 right-3 h-[93%] z-50 flex flex-col"
      style={{
        width: isMinimized ? "56px" : `${width}px`,
        transition: isMinimized ? "width 0.2s ease" : "none",
      }}>
      {/* Handle de resize — visible uniquement si non minimisé */}
      {!isMinimized && (
        <div
          onMouseDown={onMouseDown}
          className="absolute left-0 top-0 h-full w-1 z-10 cursor-ew-resize group"
        >
          <div className="w-full h-full bg-transparent group-hover:bg-blue-500/40 transition-colors duration-150" />
        </div>
      )}

      {/* Conteneur principal */}
      <div className="flex flex-col h-full bg-[#0f1117]/40 border-l border-white/10 shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-white/10 bg-primary/10 shrink-0">
          <div className="relative shrink-0">
            <div className="w-8 h-8 rounded-lg bg-blue-600/20 border border-blue-500/30 flex items-center justify-center">
              <Bot className="w-4 h-4 text-blue-400" />
            </div>
            <div className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-[#161b27] ${connected ? "bg-emerald-400" : "bg-red-400"}`} />
          </div>

          {!isMinimized && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold leading-none truncate">{title}</p>
              <p className="text-xs mt-0.5 flex items-center gap-1">
                {connected
                  ? <><Wifi className="w-2.5 h-2.5 text-emerald-400" /><span className="text-emerald-400">Connecté</span></>
                  : <><WifiOff className="w-2.5 h-2.5 text-red-400" /><span className="text-red-400">Déconnecté</span></>
                }
                <span className="text-white/20 mx-1">·</span>
                {subtitle}
              </p>
            </div>
          )}

          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={() => setIsMinimized(!isMinimized)}
              className="w-7 h-7 rounded-md flex items-center justify-center hover:text-warning/50 bg-accent/50 transition-colors"
            >
              {isMinimized ? <Maximize2 className="w-3.5 h-3.5" /> : <Minimize2 className="w-3.5 h-3.5" />}
            </button>
            {!isMinimized && (
              <button
                onClick={onClose}
                className="w-7 h-7 rounded-md flex items-center justify-center hover:text-error/50 bg-accent/50 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Corps — masqué si minimisé */}
        {!isMinimized && (
          <>
            {/* Zone messages */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 scrollbar-thin scrollbar-thumb-accent/10 scrollbar-track-transparent">

              {messages.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full text-center py-12 gap-3">
                  <div className="w-14 h-14 rounded-2xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-center">
                    <MessageCircle className="w-6 h-6 text-blue-400/60" />
                  </div>
                  <div>
                    <p className="text-white/60 text-sm font-medium">Posez une question</p>
                    <p className="text-white/30 text-xs mt-1 max-w-[200px]">
                      Scans, vulnérabilités, CVE, exploitation guidée…
                    </p>
                  </div>
                </div>
              )}

              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex gap-2.5 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}
                >
                  {/* Avatar */}
                  <div className={`w-6 h-6 rounded-md shrink-0 flex items-center justify-center mt-0.5 ${msg.role === "user"
                    ? "bg-blue-600/20 border border-blue-500/30"
                    : "bg-emerald-600/20 border border-emerald-500/30"
                    }`}>
                    {msg.role === "user"
                      ? <User className="w-3 h-3 text-blue-400" />
                      : <Bot className="w-3 h-3 text-emerald-400" />
                    }
                  </div>

                  {/* Bulle */}
                  <div className={`flex flex-col gap-1 max-w-[82%] ${msg.role === "user" ? "items-end" : "items-start"}`}>
                    <div className={`rounded-xl px-3 py-2 text-sm leading-relaxed ${msg.role === "user"
                      ? "bg-blue-600 text-white rounded-tr-sm"
                      : "bg-[#1e2433] text-white/85 border border-white/8 rounded-tl-sm"
                      }`}>
                      <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                    </div>
                    <span className="text-[10px] text-white/25 px-1">
                      {msg.timestamp.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                </div>
              ))}

              {/* Indicateur de frappe */}
              {isLoading && (
                <div className="flex gap-2.5 flex-row">
                  <div className="w-6 h-6 rounded-md shrink-0 flex items-center justify-center mt-0.5 bg-emerald-600/20 border border-emerald-500/30">
                    <Bot className="w-3 h-3 text-emerald-400" />
                  </div>
                  <div className="bg-[#1e2433]/40 border border-white/8 rounded-xl rounded-tl-sm px-4 py-3">
                    <div className="flex gap-1 items-center h-4">
                      <span className="w-1.5 h-1.5 rounded-full bg-white/40 animate-bounce" style={{ animationDelay: "0ms" }} />
                      <span className="w-1.5 h-1.5 rounded-full bg-white/40 animate-bounce" style={{ animationDelay: "150ms" }} />
                      <span className="w-1.5 h-1.5 rounded-full bg-white/40 animate-bounce" style={{ animationDelay: "300ms" }} />
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Zone saisie */}
            <div className="px-4 pt-3 pb-4 border-t border-white/8 bg-secondary-content/25 shrink-0">
              <div className="rounded-xl border border-white/10 bg-[#1e2433] overflow-hidden focus-within:border-blue-500/50 transition-colors">
                <EntryChat
                  onSend={onSendMessage}
                  placeholder="Pose ta question…"
                  disabled={isLoading}
                  maxLines={5}
                />
              </div>
              <p className="text-[10px] text-primary-content/75 mt-1.5 text-center">
                Entrée = envoyer · Shift+Entrée = nouvelle ligne
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  </div>;
};
export default Chat;