"use client";

import { useState, useRef, useEffect, KeyboardEvent } from "react";

interface EntryChatProps {
  onSend: (message: string) => void; // fonction pour envoyer le message
  placeholder?: string; // placeholder optionnel
  maxLines?: number; // lignes max, par défaut 5
  minLines?: number; // lignes min, par défaut 1
}

export default function EntryChat({
  onSend,
  placeholder = "Type your message...",
  maxLines = 5,
  minLines = 1,
}: EntryChatProps) {
  const [chatInput, setChatInput] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  // resize automatique en fonction du texte
  const resizeTextarea = () => {
    const el = textareaRef.current;
    if (!el) return;

    const lineHeight = 24; // ajuster selon ton CSS
    const maxHeight = lineHeight * maxLines;
    const minHeight = lineHeight * minLines;

    el.style.height = "auto"; // reset
    el.style.height = `${Math.min(Math.max(el.scrollHeight, minHeight), maxHeight)}px`;
  };

  // resize à chaque changement de texte
  useEffect(() => {
    resizeTextarea();
  }, [chatInput]);

  // handle send
  const handleSend = () => {
    const trimmed = chatInput.trim();
    if (!trimmed) return;

    onSend(trimmed);
    setChatInput(""); // reset textarea
  };

  // gestion des touches
  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault(); // empêche saut de ligne
      handleSend();
    }
    // Ctrl+A, Ctrl+X, Ctrl+C : resize après action
    if (
      (e.ctrlKey || e.metaKey) &&
      ["a", "x", "c"].includes(e.key.toLowerCase())
    ) {
      setTimeout(resizeTextarea, 0); // resize après action
    }
  };

  return (
    <textarea
      ref={textareaRef}
      placeholder={placeholder}
      value={chatInput}
      
className="w-full px-3 py-2.5 bg-transparent text-white/85 text-sm placeholder:text-white/25 resize-none overflow-hidden focus:outline-none"
      rows={minLines}
      onChange={(e) => setChatInput(e.target.value)}
      onKeyDown={handleKeyDown}
    />
  );
}