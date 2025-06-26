"use client"

import { useState } from "react"
import { X } from "lucide-react"
import { Button } from "./button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./select"

interface FilterDialogProps {
  isOpen: boolean
  onClose: () => void
  onApply: (filters: { region?: string }) => void
}

const regions = [
  "Toutes les régions",
  "Île-de-France",
  "Auvergne-Rhône-Alpes",
  "Nouvelle-Aquitaine",
  "Occitanie",
  "Hauts-de-France",
  "Grand Est",
  "Provence-Alpes-Côte d'Azur",
  "Pays de la Loire",
  "Bretagne",
  "Normandie",
]

export function FilterDialog({ isOpen, onClose, onApply }: FilterDialogProps) {
  const [selectedRegion, setSelectedRegion] = useState<string>("Toutes les régions")

  if (!isOpen) return null

  const handleApply = () => {
    const filters = selectedRegion === "Toutes les régions" ? {} : { region: selectedRegion }
    onApply(filters)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-lg w-full max-w-sm shadow-lg">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-anton text-forko-green-dark">Filtrer</h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        <div className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Région</label>
            <Select value={selectedRegion} onValueChange={setSelectedRegion}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner une région" />
              </SelectTrigger>
              <SelectContent className="max-h-60 overflow-y-auto">
                {regions.map((region) => (
                  <SelectItem key={region} value={region}>
                    {region}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="p-4 border-t">
          <Button
            onClick={handleApply}
            className="w-full bg-forko-pink text-forko-green-dark hover:bg-forko-pink/80"
          >
            Appliquer les filtres
          </Button>
        </div>
      </div>
    </div>
  )
}
