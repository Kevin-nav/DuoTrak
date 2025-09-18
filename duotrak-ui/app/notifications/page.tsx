"use client"

import NotificationCenter from "@/components/notification-center"

export default function NotificationsPage() {
  const handleMarkAsRead = (notificationId: string) => {
    console.log("Mark as read:", notificationId)
    // Handle mark as read logic
  }

  const handleMarkAllAsRead = () => {
    console.log("Mark all as read")
    // Handle mark all as read logic
  }

  const handleArchive = (notificationId: string) => {
    console.log("Archive notification:", notificationId)
    // Handle archive logic
  }

  const handleSnooze = (notificationId: string, duration: string) => {
    console.log("Snooze notification:", notificationId, duration)
    // Handle snooze logic
  }

  const handleNotificationAction = (notificationId: string, action: string) => {
    console.log("Notification action:", notificationId, action)
    // Handle notification action logic
  }

  const handleBulkAction = (notificationIds: string[], action: string) => {
    console.log("Bulk action:", action, notificationIds)
    // Handle bulk action logic
  }

  return (
    <NotificationCenter
      onMarkAsRead={handleMarkAsRead}
      onMarkAllAsRead={handleMarkAllAsRead}
      onArchive={handleArchive}
      onSnooze={handleSnooze}
      onNotificationAction={handleNotificationAction}
      onBulkAction={handleBulkAction}
    />
  )
}
