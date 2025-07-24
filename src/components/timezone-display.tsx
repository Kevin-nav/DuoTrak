"use client"

import { useState, useEffect } from "react"
import { Globe } from "lucide-react"

interface TimezoneDisplayProps {
  timezone: string
}

const TimezoneDisplay = ({ timezone }: TimezoneDisplayProps) => {
  const [currentTime, setCurrentTime] = useState("")

  useEffect(() => {
    const updateClock = () => {
      try {
        const time = new Intl.DateTimeFormat("en-US", {
          timeZone: timezone,
          hour: "numeric",
          minute: "numeric",
          hour12: true,
        }).format(new Date())
        setCurrentTime(time)
      } catch (error) {
        console.error("Invalid timezone:", timezone)
        setCurrentTime("Invalid Timezone")
      }
    }

    updateClock()
    const timerId = setInterval(updateClock, 60000) // Update every minute

    return () => clearInterval(timerId)
  }, [timezone])

  const getCity = (tz: string) => {
    if (!tz) return ""
    const parts = tz.split("/")
    return parts[parts.length - 1].replace(/_/g, " ")
  }

  const city = getCity(timezone)

  return (
    <div className="flex items-center space-x-3">
      <Globe className="w-5 h-5 text-stone-gray dark:text-gray-400" />
      <div>
        <p className="font-medium text-charcoal dark:text-gray-100">{city}</p>
        <p className="text-sm text-stone-gray dark:text-gray-300">
          {currentTime} <span className="hidden sm:inline">({timezone})</span>
        </p>
      </div>
    </div>
  )
}

export default TimezoneDisplay
