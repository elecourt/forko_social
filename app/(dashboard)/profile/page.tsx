"use client"

import { useState, useEffect } from "react"
import { Settings, MapPin, Briefcase, Save } from "lucide-react"
import { Header } from "@/components/ui/header"
import { MobileLayout } from "@/components/ui/mobile-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { getCurrentUser, logout } from "@/lib/auth"
import { useRouter } from "next/navigation"
import { getUsers } from "@/lib/api"
import type { User } from "@/lib/types"
import { UserCard } from "@/components/ui/user-card"

const REGIONS = [
  "Île-de-France",
  "Auvergne-Rhône-Alpes",
  "Nouvelle-Aquitaine",
  "Occitanie",
  "Provence-Alpes-Côte d'Azur",
  "Bretagne",
  "Normandie",
  "Hauts-de-France",
  "Grand Est",
  "Pays de la Loire",
  "Centre-Val de Loire",
  "Bourgogne-Franche-Comté",
  "Corse",
  "Autre",
]

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [suggestions, setSuggestions] = useState<User[]>([])
  const router = useRouter()

  useEffect(() => {
    loadUser()
  }, [])

  const loadUser = async () => {
    setIsLoading(true)
    try {
      const currentUser = await getCurrentUser()
      setUser(currentUser)

      if (currentUser?.region) {
        const users = await getUsers()
        const filtered = users.filter(
          (u) => u.region === currentUser.region && u.id !== currentUser.id
        )
        setSuggestions(filtered)
      }
    } catch (err) {
      console.error("Erreur de chargement :", err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogout = async () => {
    await logout()
    router.push("/login")
  }

  const handleSave = async () => {
    if (!user) return

    try {
      const res = await fetch(`${API_URL}/api/auth/me`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          firstName: user.firstName,
          lastName: user.lastName,
          position: user.position,
          region: user.region,
        }),
      })

      if (!res.ok) {
        throw new Error("Erreur lors de la mise à jour")
      }

      setIsEditing(false)
      await loadUser()
    } catch (err) {
      console.error("Erreur de mise à jour :", err)
    }
  }

  if (isLoading || !user) {
    return (
      <MobileLayout>
        <Header title="Mon profil" />
        <div className="p-6 text-center text-gray-500">Chargement...</div>
      </MobileLayout>
    )
  }

  const initials = `${user.firstName[0]}${user.lastName[0]}`.toUpperCase()

  return (
    <MobileLayout>
      <Header title="Mon profil" />

      <div className="p-4 bg-[#187C71] min-h-screen">
        <div className="bg-white rounded-lg p-6 mb-6 text-center">
          <Avatar className="w-24 h-24 mx-auto mb-4">
            <AvatarImage src={user.avatar || "/placeholder.svg"} />
            <AvatarFallback className="bg-forko-pink text-forko-green-dark text-2xl font-semibold">
              {initials}
            </AvatarFallback>
          </Avatar>

          {isEditing ? (
            <>
              <Input
                className="my-2"
                value={user.firstName}
                onChange={(e) => setUser({ ...user, firstName: e.target.value })}
              />
              <Input
                className="my-2"
                value={user.lastName}
                onChange={(e) => setUser({ ...user, lastName: e.target.value })}
              />
              <Input
                className="my-2"
                value={user.position}
                onChange={(e) => setUser({ ...user, position: e.target.value })}
              />
              <select
                className="my-2 w-full border border-gray-300 rounded px-3 py-2"
                value={user.region}
                onChange={(e) => setUser({ ...user, region: e.target.value })}
              >
                <option value="">Sélectionner une région</option>
                {REGIONS.map((region) => (
                  <option key={region} value={region}>
                    {region}
                  </option>
                ))}
              </select>
            </>
          ) : (
            <>
              <h1 className="text-xl font-anton text-forko-green-dark mb-2">
                {user.firstName} {user.lastName}
              </h1>
              <div className="text-gray-600 mb-1 flex items-center justify-center">
                <Briefcase className="w-4 h-4 mr-1" />
                {user.position}
              </div>
              <div className="text-gray-600 flex items-center justify-center mb-1">
                <MapPin className="w-4 h-4 mr-1" />
                {user.region}
              </div>
            </>
          )}

          <div className="flex gap-2 mt-4">
            <Button
              variant="outline"
              className="flex-1 border-forko-green text-forko-green hover:bg-forko-green hover:text-white"
              onClick={() => (isEditing ? handleSave() : setIsEditing(true))}
            >
              {isEditing ? <Save className="w-4 h-4 mr-1" /> : <Settings className="w-4 h-4 mr-1" />}
              {isEditing ? "Sauvegarder" : "Modifier"}
            </Button>
            <Button
              onClick={handleLogout}
              variant="outline"
              className="flex-1 border-red-500 text-red-500 hover:bg-red-500 hover:text-white"
            >
              Déconnexion
            </Button>
          </div>
        </div>

        {/* Suggestions */}
        <div>
          <h2 className="text-lg font-anton text-white mb-4">Suggestions dans ma région</h2>
          {suggestions.length > 0 ? (
            <ul className="space-y-2">
              {suggestions.map((suggestedUser) => (
                <li key={suggestedUser.id} className="bg-white rounded-lg p-4">
                  <UserCard user={suggestedUser} />
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-center text-gray-200">Aucune suggestion disponible</p>
          )}
        </div>
      </div>
    </MobileLayout>
  )
}
