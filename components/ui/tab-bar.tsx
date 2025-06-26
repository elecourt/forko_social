"use client"

import { useState, useEffect } from "react"
import { Home, Users, MessageCircle,User as UserIcon, Settings } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { getCurrentUser } from "@/lib/auth"
import type { User } from "@/lib/types"

export function TabBar() {
  const pathname = usePathname()
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    async function fetchUser() {
      try {
        const currentUser = await getCurrentUser()
        setUser(currentUser)
      } catch (error) {
        console.error("Erreur chargement utilisateur :", error)
        setUser(null)
      }
    }
    fetchUser()
  }, [])

  const tabs = [
    { href: "/feed", icon: Home },
    { href: "/directory", icon: Users },
    { href: "/messages", icon: MessageCircle },
    { href: "/profile", icon: UserIcon },
  ]

  if (user?.isAdmin) {
    tabs.splice(3, 0, { href: "/admin/users", icon: Settings })
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 w-full bg-[#04383F] px-4 py-3">
      <div className="flex justify-around max-w-md mx-auto">
        {tabs.map((tab) => {
          const isActive = pathname.startsWith(tab.href)
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className="flex flex-col items-center justify-center p-2"
            >
              <tab.icon
                className={cn(
                  "w-6 h-6",
                  isActive ? "text-[#FDC3DC]" : "text-white"
                )}
              />
              <div
                className={cn(
                  "mt-1 h-[2px] w-8 rounded-full transition-all duration-300",
                  isActive ? "bg-[#FDC3DC]" : "bg-transparent"
                )}
              />
            </Link>
          )
        })}
      </div>
    </div>
  )
}
