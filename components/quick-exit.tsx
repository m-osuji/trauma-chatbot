"use client"

import { Button } from "@/components/ui/button"
import { X } from "lucide-react"

interface QuickExitProps {
  onExit?: () => void
}

export function QuickExit({ onExit }: QuickExitProps) {
  const handleExit = () => {
    try {
      // Call custom exit handler if provided
      if (onExit) {
        onExit()
      }

      // Force immediate redirect to Google
      if (typeof window !== "undefined") {
        // Try multiple methods to ensure redirect works
        window.location.href = "https://www.google.com/"

        // Fallback with replace method
        setTimeout(() => {
          window.location.replace("https://www.google.com/")
        }, 100)

        // Additional fallback
        setTimeout(() => {
          window.open("https://www.google.com/", "_self")
        }, 200)
      }
    } catch (error) {
      console.error("Quick exit failed:", error)
      // Last resort - try to navigate anyway
      window.location.href = "https://www.google.com/"
    }
  }

  return (
    <Button
      onClick={handleExit}
      variant="outline"
      size="sm"
      className="fixed top-4 left-4 z-50 bg-white/90 backdrop-blur-sm border-slate-300 text-slate-600 hover:bg-red-50 hover:border-red-300 hover:text-red-600 transition-colors"
    >
      <X className="w-4 h-4 mr-2" />
      Quick Exit
    </Button>
  )
}
