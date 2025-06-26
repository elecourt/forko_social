"use client"

import type { ReactNode } from "react"
import { TabBar } from "./tab-bar"

interface MobileLayoutProps {
  children: ReactNode
  showTabBar?: boolean
}

export function MobileLayout({ children, showTabBar = true }: MobileLayoutProps) {
  return (
    <div className="w-full min-h-screen relative">
      <div className={showTabBar ? "pb-16" : ""}>{children}</div>
      {showTabBar && <TabBar />}
    </div>
  )
}
