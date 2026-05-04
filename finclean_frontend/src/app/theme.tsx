"use client"

import { useState, useEffect } from "react"
import { Moon, Sun } from "lucide-react"

export default function ThemeToggle() {
  const [isDark, setIsDark] = useState<boolean | null>(null)

  // Initialisation propre
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme")

    if (savedTheme === "dark") {
      setIsDark(true)
      document.documentElement.setAttribute("data-theme",dark)
    } else {
      setIsDark(false)
      document.documentElement.setAttribute("data-theme", light)
    }
  }, [])

  // Mise à jour lors du changement

  const light = "caramellatte";
  const dark = "dark";
  useEffect(() => {
    if (isDark === null) return

    if (isDark) {
      document.documentElement.setAttribute("data-theme", dark)
      localStorage.setItem("theme", "dark")
    } else {
      document.documentElement.setAttribute("data-theme", light)
      localStorage.setItem("theme", "light")
    }
  }, [isDark])

  // Évite le rendu avant initialisation (supprime le flash)
  if (isDark === null) return null

  return (
    <button
      onClick={() => setIsDark(prev => !prev)}
      className="absolute top-3/2 right-3/4 z-30 border-2 border-secondaryss rounded-3xl p-1"
    >
      {!isDark ? (
        <Moon className="w-5 h-5 text-primary" />
      ) : (
        <Sun className="w-5 h-5 text-warning" />
      )}
    </button>
  )
}
