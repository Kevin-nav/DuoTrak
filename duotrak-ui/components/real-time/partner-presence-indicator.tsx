"use client"

import { motion } from "framer-motion"
import { Wifi, WifiOff, Activity, Clock, Zap, RefreshCw } from "lucide-react"
import { useState } from "react"
import { useRealTimePartner } from "@/hooks/use-real-time-partner"

interface PartnerPresenceIndicatorProps {
  partnerId: string
  partnerName: string
  partnerAvatar: string
  className?: string
  showDetails?: boolean
}

export function PartnerPresenceIndicator({
  partnerId,
  partnerName,
  partnerAvatar,
  className = "",
  showDetails = true,
}: PartnerPresenceIndicatorProps) {
  const { presence, connectionStatus, lastHeartbeat, isConnected, syncWithPartner, recentUpdates } = useRealTimePartner(
    {
      partnerId,
      partnerName,
      enableNotifications: true,
      enableMascotInteractions: true,
    },
  )

  const [isSyncing, setIsSyncing] = useState(false)

  const handleSync = async () => {
    setIsSyncing(true)
    try {
      await syncWithPartner()
    } finally {
      setIsSyncing(false)
    }
  }

  const getPresenceColor = () => {
    if (!isConnected) return "bg-destructive"
    if (presence.isOnline) return "bg-green-500"
    return "bg-muted-foreground"
  }

  const getPresenceText = () => {
    if (!isConnected) return "Disconnected"
    if (presence.isOnline) {
      if (presence.currentActivity) {
        return `${presence.currentActivity}`
      }
      return "Online"
    }
    return `Last seen ${formatLastSeen(presence.lastSeen)}`
  }

  const formatLastSeen = (date: Date) => {
    const now = new Date()
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))

    if (diffInMinutes < 1) return "just now"
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`

    const diffInHours = Math.floor(diffInMinutes / 60)
    if (diffInHours < 24) return `${diffInHours}h ago`

    return `${Math.floor(diffInHours / 24)}d ago`
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {/* Avatar with presence indicator */}
      <div className="relative">
        <motion.img
          whileHover={{ scale: 1.05 }}
          src={partnerAvatar}
          alt={partnerName}
          className="w-8 h-8 rounded-full object-cover ring-2 ring-border"
        />

        {/* Presence dot */}
        <motion.div
          animate={presence.isOnline && isConnected ? { scale: [1, 1.2, 1] } : {}}
          transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
          className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-background ${getPresenceColor()}`}
        />

        {/* Connection status indicator */}
        {!isConnected && (
          <motion.div
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.5, repeat: Number.POSITIVE_INFINITY }}
            className="absolute -top-1 -right-1"
          >
            <WifiOff className="w-3 h-3 text-destructive" />
          </motion.div>
        )}
      </div>

      {showDetails && (
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-foreground truncate">{partnerName}</span>

            {/* Connection status icon */}
            {isConnected ? (
              <Wifi className="w-3 h-3 text-green-500 flex-shrink-0" />
            ) : (
              <WifiOff className="w-3 h-3 text-destructive flex-shrink-0" />
            )}

            {/* Sync button */}
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={handleSync}
              disabled={isSyncing}
              className="p-1 hover:bg-muted rounded-full transition-colors flex-shrink-0"
              title="Sync with partner"
            >
              <motion.div
                animate={isSyncing ? { rotate: 360 } : {}}
                transition={{ duration: 1, repeat: isSyncing ? Number.POSITIVE_INFINITY : 0, ease: "linear" }}
              >
                <RefreshCw className="w-3 h-3 text-muted-foreground" />
              </motion.div>
            </motion.button>
          </div>

          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            {presence.currentActivity && presence.isOnline && (
              <>
                <Activity className="w-3 h-3 text-primary flex-shrink-0" />
                <span className="text-primary font-medium">{presence.currentActivity}</span>
              </>
            )}

            {!presence.currentActivity && (
              <>
                <Clock className="w-3 h-3 flex-shrink-0" />
                <span>{getPresenceText()}</span>
              </>
            )}
          </div>

          {/* Recent activity indicator */}
          {recentUpdates.length > 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center gap-1 mt-1"
            >
              <Zap className="w-3 h-3 text-primary" />
              <span className="text-xs text-primary font-medium">
                {recentUpdates.length} recent update{recentUpdates.length !== 1 ? "s" : ""}
              </span>
            </motion.div>
          )}
        </div>
      )}
    </div>
  )
}
