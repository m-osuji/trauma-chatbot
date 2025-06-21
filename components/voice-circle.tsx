"use client"

import { useState, useEffect } from "react"

interface VoiceCircleProps {
  isActive: boolean
  audioLevel?: number // 0-1 representing audio input level
  size?: "sm" | "md" | "lg"
  simulateAudio?: boolean // For testing the animation without real audio
}

export function VoiceCircle({ isActive, audioLevel = 0, size = "md", simulateAudio = false }: VoiceCircleProps) {
  const [pulseIntensity, setPulseIntensity] = useState(0)

  useEffect(() => {
    if (isActive) {
      if (simulateAudio) {
        // Simulate realistic speech patterns for demo
        const interval = setInterval(() => {
          const patterns = [
            0.8, 0.3, 0.9, 0.1, 0.7, 0.4, 0.95, 0.2, 0.6, 0.8, 0.1, 0.85, 0.3, 0.7, 0.5, 0.9, 0.2, 0.4, 0.8, 0.1, 0.6,
            0.9, 0.3, 0.75, 0.4, 0.1, 0.8, 0.5, 0.9, 0.2,
          ]
          const randomIndex = Math.floor(Math.random() * patterns.length)
          setPulseIntensity(patterns[randomIndex])
        }, 120) // Faster updates for more realistic speech simulation
        return () => clearInterval(interval)
      } else if (audioLevel > 0) {
        // Use actual audio level for more realistic animation
        setPulseIntensity(audioLevel)
      } else {
        // Fallback to gentle random animation
        const interval = setInterval(() => {
          setPulseIntensity(Math.random() * 0.4 + 0.1)
        }, 200)
        return () => clearInterval(interval)
      }
    } else {
      setPulseIntensity(0)
    }
  }, [isActive, audioLevel, simulateAudio])

  const sizeClasses = {
    sm: "w-16 h-16",
    md: "w-24 h-24",
    lg: "w-32 h-32",
  }

  // Calculate dynamic scaling based on audio level
  const baseScale = 1
  const audioScale = isActive ? baseScale + pulseIntensity * 0.4 : baseScale
  const glowIntensity = isActive ? 15 + pulseIntensity * 50 : 0
  const glowOpacity = isActive ? 0.2 + pulseIntensity * 0.6 : 0

  return (
    <div className="relative flex items-center justify-center">
      <div
        className={`${sizeClasses[size]} rounded-full bg-gradient-to-br from-blue-400 to-blue-600 shadow-lg transition-all duration-75`}
        style={{
          transform: `scale(${audioScale})`,
          boxShadow: isActive
            ? `0 0 ${glowIntensity}px rgba(59, 130, 246, ${glowOpacity}), 0 0 ${glowIntensity * 0.5}px rgba(59, 130, 246, ${glowOpacity * 0.5})`
            : "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
        }}
      >
        <div className="w-full h-full rounded-full bg-white/20 flex items-center justify-center">
          <div
            className="w-3 h-3 bg-white rounded-full transition-all duration-75"
            style={{
              transform: `scale(${1 + pulseIntensity * 1.2})`,
              opacity: isActive ? 0.8 + pulseIntensity * 0.2 : 0.7,
            }}
          />
        </div>
      </div>

      {isActive && (
        <>
          <div
            className="absolute inset-0 rounded-full border-2 border-blue-300"
            style={{
              animation: `ping 2s cubic-bezier(0, 0, 0.2, 1) infinite`,
              transform: `scale(${1 + pulseIntensity * 0.3})`,
              opacity: pulseIntensity * 0.7,
            }}
          />
          <div
            className="absolute inset-0 rounded-full border border-blue-200"
            style={{
              animation: `pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite`,
              transform: `scale(${1 + pulseIntensity * 0.15})`,
              opacity: pulseIntensity * 0.5,
            }}
          />
          {/* Additional ripple effect for high audio levels */}
          {pulseIntensity > 0.6 && (
            <div
              className="absolute inset-0 rounded-full border border-blue-100"
              style={{
                animation: `ping 1s cubic-bezier(0, 0, 0.2, 1) infinite`,
                transform: `scale(${1 + pulseIntensity * 0.5})`,
                opacity: (pulseIntensity - 0.6) * 0.8,
              }}
            />
          )}
        </>
      )}
    </div>
  )
}
