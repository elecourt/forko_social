"use client"

import { useState, useEffect } from "react"
import { Search, Plus } from "lucide-react"
import { Header } from "@/components/ui/header"
import { MobileLayout } from "@/components/ui/mobile-layout"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { NewMessageDialog } from "@/components/ui/new-message-dialog"
import type { Conversation } from "@/lib/types"
import { getConversations } from "@/lib/api"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"

export default function MessagesPage() {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [showNewMessage, setShowNewMessage] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    loadConversations()
  }, [])

  const loadConversations = async () => {
    try {
      setIsLoading(true)
      const data = await getConversations()
      setConversations(data)
    } catch (error) {
      console.error("Error loading conversations:", error)
      toast({
        title: "Erreur",
        description: "Impossible de charger les conversations",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const filteredConversations = conversations.filter((conv) =>
    conv.participants.some((p) => `${p.firstName} ${p.lastName}`.toLowerCase().includes(searchTerm.toLowerCase())),
  )

  return (
    <MobileLayout>
      <Header title="Messagerie" />

      <div className="p-4 bg-[#187C71] min-h-screen">
        <div className="flex gap-2 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Rechercher une conversation..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button
            onClick={() => setShowNewMessage(true)}
            size="sm"
            className="bg-forko-green-dark hover:bg-forko-green-dark text-white"
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="bg-white rounded-lg p-4 animate-pulse">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-gray-200 rounded-full mr-3"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded mb-1"></div>
                    <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {filteredConversations.map((conversation) => {
              const otherParticipant = conversation.participants[0]
              const initials = `${otherParticipant.firstName[0]}${otherParticipant.lastName[0]}`.toUpperCase()

              return (
                <Link key={conversation.id} href={`/messages/${conversation.id}`} className="block">
                  <div className="bg-white rounded-lg p-4 border border-gray-200 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center">
                      <Avatar className="w-12 h-12 mr-3">
                        <AvatarImage src={otherParticipant.avatar || "/placeholder.svg"} />
                        <AvatarFallback className="bg-forko-pink text-forko-green-dark font-semibold">
                          {initials}
                        </AvatarFallback>
                      </Avatar>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h3 className="font-semibold text-forko-green-dark truncate">
                            {otherParticipant.firstName} {otherParticipant.lastName}
                          </h3>
                          {conversation.unreadCount > 0 && (
                            <span className="bg-forko-pink text-forko-green-dark text-xs font-bold px-2 py-1 rounded-full">
                              {conversation.unreadCount}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 truncate">{conversation.lastMessage.content}</p>
                        <p className="text-xs text-gray-400">
                          {new Date(conversation.lastMessage.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>
                </Link>
              )
            })}

            {filteredConversations.length === 0 && !isLoading && (
              <div className="text-center py-8">
                <p className="text-gray-500">Aucune conversation</p>
                <Button
                  onClick={() => setShowNewMessage(true)}
                  className="mt-4 bg-forko-green hover:bg-forko-green-dark text-white"
                >
                  Démarrer une conversation
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      <NewMessageDialog
        isOpen={showNewMessage}
        onClose={() => setShowNewMessage(false)}
        onConversationCreated={loadConversations}
      />
    </MobileLayout>
  )
}
