"use client"

import { MessageCircle } from "lucide-react"
import type { User } from "@/lib/types"
import { Button } from "./button"
import { Avatar, AvatarFallback, AvatarImage } from "./avatar"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import socket from "@/lib/socket" 

interface UserCardProps {
  user: User
}

export function UserCard({ user }: UserCardProps) {
  const router = useRouter()
  const { toast } = useToast()
  const initials = `${user.firstName[0]}${user.lastName[0]}`.toUpperCase()

  const handleSendMessage = async () => {
    try {
      const checkResponse = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/conversations/existing?userId=${user.id}`,
        {
          credentials: "include",
        }
      )

      if (checkResponse.ok) {
        const { conversationId } = await checkResponse.json()
        if (conversationId) {
          socket.emit("join", user.id)
          router.push(`/messages/${conversationId}`)
          return
        }
      }

      const createResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/conversations`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          receiverId: user.id,
        }),
      })

      if (!createResponse.ok) {
        const errorText = await createResponse.text()
        throw new Error(`Erreur ${createResponse.status}: ${errorText}`)
      }

      const result = await createResponse.json()

      toast({
        title: "Conversation créée",
        description: `Conversation avec ${user.firstName} ${user.lastName}`,
      })

      socket.emit("join", user.id)
      router.push(`/messages/${result.conversationId}`)
    } catch (error) {
      console.error("Erreur lors de la création ou redirection de conversation:", error)
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Une erreur est survenue",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 mb-3">
      <div className="flex items-center">
        <Avatar className="w-12 h-12 mr-3">
          <AvatarImage src={user.avatar || "/placeholder.svg"} />
          <AvatarFallback className="bg-forko-pink text-forko-green-dark font-semibold">{initials}</AvatarFallback>
        </Avatar>

        <div className="flex-1">
          <h3 className="font-semibold text-forko-green-dark">
            {user.firstName} {user.lastName}
          </h3>
          <p className="text-sm text-gray-600">{user.position}</p>
          <p className="text-xs text-gray-500">{user.location}</p>
        </div>

        <Button onClick={handleSendMessage} size="sm" className="bg-forko-green hover:bg-forko-green-dark text-white">
          <MessageCircle className="w-4 h-4" />
        </Button>
      </div>
    </div>
  )
}
