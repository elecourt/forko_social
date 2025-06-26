"use client"

import Image from "next/image"
import { Filter } from "lucide-react"
import { Button } from "./button"
import { NotificationSystem } from "./notification-system"

interface HeaderProps {
  title: string
  showFilter?: boolean
  showNotifications?: boolean
  onFilterClick?: () => void
}

export function Header({ title, showFilter, showNotifications, onFilterClick }: HeaderProps) {
  return (
    <div className="sticky top-0 z-10 bg-forko-green px-4 py-3">
      <div className="flex items-center justify-between">
        {/* Logo à gauche */}
        <div className="flex items-center space-x-3">
          <Image
            src="/logo-forko.png"
            alt="Logo Forko"
            width={40}
            height={40}
            className="object-contain"
            priority
          />
          <h1 className="text-xl font-anton text-white">{title}</h1>
        </div>

        <div className="flex items-center gap-2">
          {showFilter && (
            <Button variant="ghost" size="sm" onClick={onFilterClick} className="text-white">
              <Filter className="w-5 h-5" />
            </Button>
          )}
          {showNotifications && <NotificationSystem />}
        </div>
      </div>
    </div>
  )
}
