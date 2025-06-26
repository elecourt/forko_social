"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function HomePage() {
  const router = useRouter()

  useEffect(() => {
    router.push("/feed")
  }, [router])

  return (
    <div className="min-h-screen bg-forko-green-dark flex items-center justify-center">
      <div className="text-center">
        <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 bg-white">
          <span className="text-2xl font-anton text-forko-green">FORKO</span>
        </div>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto"></div>
      </div>
    </div>
  )
}
