"use client"

import { useEffect, useState } from "react"
import { Header } from "@/components/ui/header"
import { MobileLayout } from "@/components/ui/mobile-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { TabBar } from "@/components/ui/tab-bar"
import type { User } from "@/lib/types"
import { getUsers, createUser, deleteUser } from "@/lib/api"

const REGIONS = [
  "Auvergne-Rhône-Alpes",
  "Bourgogne-Franche-Comté",
  "Bretagne",
  "Centre-Val de Loire",
  "Corse",
  "Grand Est",
  "Hauts-de-France",
  "Île-de-France",
  "Normandie",
  "Nouvelle-Aquitaine",
  "Occitanie",
  "Pays de la Loire",
  "Provence-Alpes-Côte d'Azur",
]

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)

  const [email, setEmail] = useState("")
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [position, setPosition] = useState("")
  const [location, setLocation] = useState("")
  const [region, setRegion] = useState("")

  useEffect(() => {
    loadUsers()
  }, [])

  const loadUsers = async () => {
    setLoading(true)
    try {
      const data = await getUsers()
      setUsers(data)
    } catch {
      alert("Erreur lors du chargement des utilisateurs")
    } finally {
      setLoading(false)
    }
  }

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !firstName || !lastName) {
      alert("Merci de remplir les champs obligatoires")
      return
    }
    try {
      await createUser({ email, firstName, lastName, position, location, region })
      setEmail("")
      setFirstName("")
      setLastName("")
      setPosition("")
      setLocation("")
      setRegion("")
      loadUsers()
    } catch {
      alert("Erreur lors de la création de l'utilisateur")
    }
  }

  const handleDeleteUser = async (id: string) => {
    if (!confirm("Voulez-vous vraiment supprimer cet utilisateur ?")) return
    try {
      await deleteUser(id)
      loadUsers()
    } catch {
      alert("Erreur lors de la suppression de l'utilisateur")
    }
  }

  return (
    <MobileLayout>
      <Header title="Gestion des utilisateurs" />

      <div className="p-4 bg-[#187C71] min-h-screen">
        {loading ? (
          <div className="text-center text-white py-10">Chargement...</div>
        ) : (
          <>
            {/* Formulaire ajout utilisateur */}
            <form onSubmit={handleCreateUser} className="mb-6 space-y-3 bg-white rounded-lg p-4 shadow-md">
              <Input
                type="email"
                placeholder="Email *"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
              <Input
                type="text"
                placeholder="Prénom *"
                value={firstName}
                onChange={e => setFirstName(e.target.value)}
                required
              />
              <Input
                type="text"
                placeholder="Nom *"
                value={lastName}
                onChange={e => setLastName(e.target.value)}
                required
              />
              <Input
                type="text"
                placeholder="Poste"
                value={position}
                onChange={e => setPosition(e.target.value)}
              />
              <Input
                type="text"
                placeholder="Localisation"
                value={location}
                onChange={e => setLocation(e.target.value)}
              />
              <select
                className="w-full border rounded px-3 py-2"
                value={region}
                onChange={e => setRegion(e.target.value)}
              >
                <option value="">Sélectionnez une région</option>
                {REGIONS.map(r => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>

              <Button
                type="submit"
                disabled={!email || !firstName || !lastName}
                className="w-full"
              >
                Ajouter utilisateur
              </Button>
            </form>

            {/* Liste utilisateurs */}
            <ul className="space-y-3">
              {users.map(user => (
                <li
                  key={user.id}
                  className="bg-white rounded-lg p-4 flex justify-between items-center shadow"
                >
                  <div>
                    <span className="font-semibold">{user.firstName} {user.lastName}</span>{" "}
                    <span className="text-gray-600">({user.email})</span>{" "}
                    {user.isAdmin && <strong className="text-forko-pink">[Admin]</strong>}
                  </div>
                  <Button
                    variant="outline"
                    className="text-red-600 border-red-600 hover:bg-red-600 hover:text-white"
                    onClick={() => handleDeleteUser(user.id)}
                  >
                    Supprimer
                  </Button>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>

      <TabBar />
    </MobileLayout>
  )
}
