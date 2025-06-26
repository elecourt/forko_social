"use client";

import React, { useEffect, useRef, useState } from "react";
import { ArrowLeft, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MobileLayout } from "@/components/ui/mobile-layout";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { Message, User } from "@/lib/types";
import { getCurrentUser } from "@/lib/api";
import Link from "next/link";
import { io, Socket } from "socket.io-client";

interface ChatPageProps {
  params: {
    id: string; 
  };
}

export default function ChatPage({ params }: ChatPageProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [otherUser, setOtherUser] = useState<User | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);

      const userData = await getCurrentUser();
      setCurrentUser(userData);

      const participantsResponse = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/conversations/${params.id}/participants`,
        { credentials: "include" }
      );

      if (participantsResponse.ok) {
        const participants = await participantsResponse.json();
        const other = participants.find((p: User) => p.id !== userData?.id);
        if (other) setOtherUser(other);
      }


      const messagesResponse = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/conversations/${params.id}/messages`,
        { credentials: "include" }
      );
      if (messagesResponse.ok) {
        const messagesData = await messagesResponse.json();
        setMessages(messagesData);
      }

      setIsLoading(false);
    }
    loadData();
  }, [params.id]);

  useEffect(() => {
    socketRef.current = io(process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001", {
      withCredentials: true,
    });

    socketRef.current.emit("join", params.id);

    socketRef.current.on("receiveMessage", (message: Message) => {
      setMessages((prev) => [...prev, message]);
    });

    return () => {
      socketRef.current?.disconnect();
    };
  }, [params.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || isSending || !currentUser) return;

    setIsSending(true);

    socketRef.current?.emit("sendMessage", {
      conversationId: params.id,
      senderId: currentUser.id,
      content: newMessage.trim(),
    });

    setNewMessage("");
    setIsSending(false);
  };

  const otherUserInitials = otherUser
    ? `${otherUser.firstName[0]}${otherUser.lastName[0]}`.toUpperCase()
    : "??";
  const otherUserName = otherUser ? `${otherUser.firstName} ${otherUser.lastName}` : "Chargement...";

  return (
    <MobileLayout showTabBar={false}>
      <div className="flex flex-col h-screen">
        {/* Header */}
        <div className="bg-forko-green border-b border-forko-green-dark px-4 py-3">
          <div className="flex items-center">
            <Link href="/messages">
              <Button variant="ghost" size="sm" className="mr-2 text-white hover:bg-forko-green-dark">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>

            <Avatar className="w-10 h-10 mr-3">
              <AvatarImage
                src={otherUser?.avatar ? `${process.env.NEXT_PUBLIC_API_URL}${otherUser.avatar}` : "/placeholder.svg"}
                alt={otherUserName}
              />
              <AvatarFallback className="bg-forko-pink text-forko-green-dark font-semibold">{otherUserInitials}</AvatarFallback>
            </Avatar>

            <div>
              <h2 className="font-semibold text-white">{otherUserName}</h2>
              <p className="text-sm text-green-100">{otherUser?.position || "En ligne"}</p>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-100">
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className={`flex ${i % 2 === 0 ? "justify-start" : "justify-end"}`}>
                  <div className="bg-gray-200 rounded-lg p-3 max-w-xs animate-pulse">
                    <div className="h-4 bg-gray-300 rounded mb-2"></div>
                    <div className="h-3 bg-gray-300 rounded w-16"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-500">
              <p className="text-lg mb-2">Aucun message</p>
              <p className="text-sm">Commencez la conversation !</p>
            </div>
          ) : (
            <>
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.senderId === currentUser?.id ? "justify-end" : "justify-start"}`}
                >
                  <div className="flex items-end space-x-2 max-w-xs lg:max-w-md">
                    {message.senderId !== currentUser?.id && (
                      <Avatar className="w-8 h-8">
                        <AvatarImage
                          src={otherUser?.avatar ? `${process.env.NEXT_PUBLIC_API_URL}${otherUser.avatar}` : "/placeholder.svg"}
                          alt={otherUser?.firstName || ""}
                        />
                        <AvatarFallback className="bg-forko-pink text-forko-green-dark text-xs font-semibold">
                          {otherUserInitials}
                        </AvatarFallback>
                      </Avatar>
                    )}

                    <div
                      className={`px-4 py-2 rounded-lg ${
                        message.senderId === currentUser?.id
                          ? "bg-forko-green text-white rounded-br-none"
                          : "bg-white text-forko-green rounded-bl-none"
                      }`}
                    >
                      <p>{message.content}</p>
                      <small className="block mt-1 text-xs text-gray-400">
                        {new Date(message.createdAt).toLocaleTimeString()}
                      </small>
                    </div>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* Input */}
        <form onSubmit={handleSendMessage} className="p-3 border-t flex space-x-2 bg-white">
          <Input
            placeholder="Écrire un message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            disabled={isSending}
          />
          <Button type="submit" disabled={isSending || newMessage.trim() === ""}>
            <Send className="w-5 h-5" />
          </Button>
        </form>
      </div>
    </MobileLayout>
  );
}
