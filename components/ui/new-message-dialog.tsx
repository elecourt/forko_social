"use client"

import { useState, useEffect } from "react"
import { X, Search, Send } from "lucide-react"
import { Input } from "./input"
import { Button } from "./button"
import { Avatar, AvatarFallback, AvatarImage } from "./avatar"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"
import type { User } from "@/lib/types"
import { sendMessage } from "@/lib/api"

interface NewMessageDialogProps {
  isOpen: boolean
  onClose: () => void
  onConversationCreated?: () => void
}

export function NewMessageDialog({ isOpen, onClose, onConversationCreated }: NewMessageDialogProps) {
  const [users, setUsers] = useState<User[]>([])
  const [filteredUsers, setFilteredUsers] = useState<User[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [message, setMessage] = useState("")
  const [isSending, setIsSending] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  useEffect(() => {
    if (isOpen) {
      loadUsers()
    }
  }, [isOpen])

  useEffect(() => {
    if (searchTerm) {
      const filtered = users.filter(
        (user) =>
          `${user.firstName} ${user.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.position.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.location.toLowerCase().includes(searchTerm.toLowerCase()),
      )
      setFilteredUsers(filtered)
    } else {
      setFilteredUsers(users)
    }
  }, [searchTerm, users])

  const loadUsers = async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/users`, {
        credentials: "include",
      })

      if (!response.ok) {
        throw new Error("Erreur lors du chargement des utilisateurs")
      }

      const data = await response.json()
      setUsers(data)
      setFilteredUsers(data)
    } catch (error) {
      console.error("Error loading users:", error)
      toast({
        title: "Erreur",
        description: "Impossible de charger les utilisateurs",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleUserSelect = (user: User) => {
    setSelectedUser(user)
    setMessage(`Bonjour ${user.firstName} !`)
  }

  const handleSendMessage = async () => {
    if (!selectedUser || !message.trim() || isSending) return

    try {
      setIsSending(true)
      console.log("Sending message to:", selectedUser.id, message)

      const result = await sendMessage(selectedUser.id, message.trim())
      console.log("Message sent, result:", result)

      toast({
        title: "Message envoyé",
        description: `Message envoyé à ${selectedUser.firstName} ${selectedUser.lastName}`,
      })

      if (onConversationCreated) {
        onConversationCreated()
      }

      onClose()
      router.push(`/messages/${result.conversationId}`)
    } catch (error) {
      console.error("Error sending message:", error)
      toast({
        title: "Erreur",
        description: "Impossible d'envoyer le message",
        variant: "destructive",
      })
    } finally {
      setIsSending(false)
    }
  }

  const resetDialog = () => {
    setSearchTerm("")
    setSelectedUser(null)
    setMessage("")
  }

  const handleClose = () => {
    resetDialog()
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg w-full max-w-md max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b bg-forko-green text-white rounded-t-lg">
          <h2 className="text-lg font-anton">Nouveau message</h2>
          <Button variant="ghost" size="sm" onClick={handleClose} className="text-white hover:bg-forko-green-dark">
            <X className="w-5 h-5" />
          </Button>
        </div>

        {!selectedUser ? (
          <>
            <div className="p-4 border-b">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Rechercher un utilisateur..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              {isLoading ? (
                <div className="space-y-2">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="flex items-center p-2 animate-pulse">
                      <div className="w-10 h-10 bg-gray-200 rounded-full mr-3"></div>
                      <div className="flex-1">
                        <div className="h-4 bg-gray-200 rounded mb-1"></div>
                        <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : filteredUsers.length > 0 ? (
                <div className="space-y-1">
                  {filteredUsers.map((user) => (
                    <div
                      key={user.id}
                      className="flex items-center p-3 hover:bg-gray-100 rounded-lg cursor-pointer transition-colors"
                      onClick={() => handleUserSelect(user)}
                    >
                      <Avatar className="w-10 h-10 mr-3">
                        <AvatarImage
                          src={user.avatar || "/placeholder.png"}
                          alt={`${user.firstName[0]}${user.lastName[0]}`.toUpperCase()}
                        />
                        <AvatarFallback className="bg-forko-pink text-forko-green-dark font-semibold">
                          {`${user.firstName[0]}${user.lastName[0]}`.toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h4 className="font-semibold text-forko-green-dark">
                          {user.firstName} {user.lastName}
                        </h4>
                        <p className="text-xs text-gray-500">{user.position}</p>
                        <p className="text-xs text-gray-400">{user.location}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-gray-500 py-8">Aucun utilisateur trouvé</p>
              )}
            </div>
          </>
        ) : (
          <>
            <div className="flex items-center p-4 border-b">
              <Button
                variant="ghost"
                size="sm"
                className="mr-2 text-forko-green hover:bg-gray-100"
                onClick={() => setSelectedUser(null)}
              >
                ← Retour
              </Button>
              <Avatar className="w-10 h-10 mr-3">
                <AvatarImage
                  src={selectedUser.avatar || "/placeholder.png"}
                  alt={`${selectedUser.firstName[0]}${selectedUser.lastName[0]}`.toUpperCase()}
                />
                <AvatarFallback className="bg-forko-pink text-forko-green-dark font-semibold">
                  {`${selectedUser.firstName[0]}${selectedUser.lastName[0]}`.toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <h4 className="font-semibold text-forko-green-dark">
                  {selectedUser.firstName} {selectedUser.lastName}
                </h4>
                <p className="text-xs text-gray-500">{selectedUser.position}</p>
              </div>
            </div>

            <div className="flex-1 p-4">
              <textarea
                placeholder="Votre message..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full p-3 border border-gray-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-forko-green"
                rows={6}
              />
            </div>

            <div className="p-4 border-t">
              <Button
                onClick={handleSendMessage}
                disabled={!message.trim() || isSending}
                className="w-full bg-forko-green hover:bg-forko-green-dark text-white"
              >
                <Send className="w-4 h-4 mr-2" />
                {isSending ? "Envoi..." : "Envoyer le message"}
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
