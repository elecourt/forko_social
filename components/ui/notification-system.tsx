"use client"

import { useEffect, useState } from "react"
import { Bell, Heart, MessageCircle } from "lucide-react"
import { Button } from "./button"
import { Avatar, AvatarFallback, AvatarImage } from "./avatar"
import { useToast } from "@/hooks/use-toast"

interface Notification {
  id: string
  type: "like" | "comment" | "message"
  message: string
  user: {
    firstName: string
    lastName: string
    avatar?: string
  }
  createdAt: string
  isRead: boolean
}

export function NotificationSystem() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [showNotifications, setShowNotifications] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const { toast } = useToast()

  useEffect(() => {
    // Simuler des notifications pour la démo
    const demoNotifications: Notification[] = [
      {
        id: "1",
        type: "like",
        message: "a aimé votre publication",
        user: { firstName: "Emeline", lastName: "Lecourt" },
        createdAt: new Date().toISOString(),
        isRead: false,
      },
      {
        id: "2",
        type: "comment",
        message: "a commenté votre publication",
        user: { firstName: "Julien", lastName: "Martin" },
        createdAt: new Date(Date.now() - 300000).toISOString(),
        isRead: false,
      },
      {
        id: "3",
        type: "message",
        message: "vous a envoyé un message",
        user: { firstName: "Sophie", lastName: "Dubois" },
        createdAt: new Date(Date.now() - 600000).toISOString(),
        isRead: true,
      },
    ]

    setNotifications(demoNotifications)
    setUnreadCount(demoNotifications.filter((n) => !n.isRead).length)

    // Simuler une nouvelle notification après 5 secondes
    const timer = setTimeout(() => {
      const newNotification: Notification = {
        id: "4",
        type: "like",
        message: "a aimé votre publication",
        user: { firstName: "Marie", lastName: "Durand" },
        createdAt: new Date().toISOString(),
        isRead: false,
      }

      setNotifications((prev) => [newNotification, ...prev])
      setUnreadCount((prev) => prev + 1)

      toast({
        title: "Nouvelle notification",
        description: `${newNotification.user.firstName} ${newNotification.user.lastName} ${newNotification.message}`,
      })
    }, 5000)

    return () => clearTimeout(timer)
  }, [toast])

  const markAsRead = (notificationId: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === notificationId ? { ...n, isRead: true } : n)))
    setUnreadCount((prev) => Math.max(0, prev - 1))
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "like":
        return <Heart className="w-4 h-4 text-red-500" />
      case "comment":
        return <MessageCircle className="w-4 h-4 text-blue-500" />
      case "message":
        return <MessageCircle className="w-4 h-4 text-forko-green" />
      default:
        return <Bell className="w-4 h-4" />
    }
  }

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setShowNotifications(!showNotifications)}
        className="text-white relative"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
            {unreadCount}
          </span>
        )}
      </Button>

      {showNotifications && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
          <div className="p-4 border-b">
            <h3 className="font-semibold text-forko-green-dark">Notifications</h3>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-4 text-center text-gray-500">Aucune notification</div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer ${
                    !notification.isRead ? "bg-blue-50" : ""
                  }`}
                  onClick={() => markAsRead(notification.id)}
                >
                  <div className="flex items-start">
                    <Avatar className="w-10 h-10 mr-3">
                      <AvatarImage src={notification.user.avatar || "/placeholder.svg"} />
                      <AvatarFallback className="bg-forko-pink text-forko-green-dark font-semibold">
                        {`${notification.user.firstName[0]}${notification.user.lastName[0]}`.toUpperCase()}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        {getNotificationIcon(notification.type)}
                        <p className="text-sm">
                          <span className="font-semibold">
                            {notification.user.firstName} {notification.user.lastName}
                          </span>{" "}
                          {notification.message}
                        </p>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">{new Date(notification.createdAt).toLocaleString()}</p>
                    </div>

                    {!notification.isRead && <div className="w-2 h-2 bg-blue-500 rounded-full"></div>}
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="p-4 border-t">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })))
                setUnreadCount(0)
              }}
              className="w-full text-forko-green"
            >
              Marquer tout comme lu
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
