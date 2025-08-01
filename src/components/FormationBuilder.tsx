import React, { useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { CustomFormation } from '@/hooks/useCustomFormations'
import { Trash2, Save, Plus } from 'lucide-react'

interface FormationBuilderProps {
  formation?: CustomFormation
  onSave: (formation: Omit<CustomFormation, 'id' | 'created_at' | 'updated_at' | 'created_by'>) => void
  onCancel: () => void
}

export const FormationBuilder: React.FC<FormationBuilderProps> = ({
  formation,
  onSave,
  onCancel
}) => {
  const [name, setName] = useState(formation?.name || '')
  const [defenders, setDefenders] = useState(formation?.defenders || 4)
  const [midfielders, setMidfielders] = useState(formation?.midfielders || 4)
  const [forwards, setForwards] = useState(formation?.forwards || 2)
  const [positions, setPositions] = useState(formation?.positions || [])
  const [draggedPosition, setDraggedPosition] = useState<string | null>(null)

  const totalPlayers = defenders + midfielders + forwards

  const generatePositions = useCallback(() => {
    const newPositions = []
    let positionId = 1

    // Goalkeeper (always present)
    newPositions.push({
      id: `gk`,
      name: `Portiere`,
      x: 50,
      y: 85,
      role: 'Portiere'
    })

    // Defenders
    const defenderSpacing = defenders > 1 ? 80 / (defenders - 1) : 0
    for (let i = 0; i < defenders; i++) {
      const x = defenders === 1 ? 50 : 10 + (i * defenderSpacing)
      newPositions.push({
        id: `def-${positionId}`,
        name: `Difensore ${positionId}`,
        x,
        y: 70,
        role: 'Difensore'
      })
      positionId++
    }

    // Midfielders
    const midfielderSpacing = midfielders > 1 ? 80 / (midfielders - 1) : 0
    for (let i = 0; i < midfielders; i++) {
      const x = midfielders === 1 ? 50 : 10 + (i * midfielderSpacing)
      newPositions.push({
        id: `mid-${positionId}`,
        name: `Centrocampista ${positionId}`,
        x,
        y: 45,
        role: 'Centrocampista'
      })
      positionId++
    }

    // Forwards
    const forwardSpacing = forwards > 1 ? 80 / (forwards - 1) : 0
    for (let i = 0; i < forwards; i++) {
      const x = forwards === 1 ? 50 : 10 + (i * forwardSpacing)
      newPositions.push({
        id: `fwd-${positionId}`,
        name: `Attaccante ${positionId}`,
        x,
        y: 20,
        role: 'Attaccante'
      })
      positionId++
    }

    setPositions(newPositions)
  }, [defenders, midfielders, forwards])

  const handlePositionDrag = (positionId: string, event: React.MouseEvent) => {
    const rect = event.currentTarget.parentElement?.getBoundingClientRect()
    if (!rect) return

    const x = ((event.clientX - rect.left) / rect.width) * 100
    const y = ((event.clientY - rect.top) / rect.height) * 100

    setPositions(prev => prev.map(pos => 
      pos.id === positionId 
        ? { ...pos, x: Math.max(5, Math.min(95, x)), y: Math.max(5, Math.min(95, y)) }
        : pos
    ))
  }

  const updatePositionRole = (positionId: string, role: string) => {
    setPositions(prev => prev.map(pos => 
      pos.id === positionId ? { ...pos, role } : pos
    ))
  }

  const handleSave = () => {
    if (!name.trim()) {
      return
    }

    onSave({
      name: name.trim(),
      defenders,
      midfielders,
      forwards,
      positions
    })
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>
            {formation ? 'Modifica Formazione' : 'Nuova Formazione'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="formation-name">Nome Formazione</Label>
            <Input
              id="formation-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="es. 4-3-3 Offensiva"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label>Difensori: {defenders}</Label>
              <Slider
                value={[defenders]}
                onValueChange={(value) => setDefenders(value[0])}
                min={3}
                max={5}
                step={1}
                className="mt-2"
              />
            </div>
            <div>
              <Label>Centrocampisti: {midfielders}</Label>
              <Slider
                value={[midfielders]}
                onValueChange={(value) => setMidfielders(value[0])}
                min={2}
                max={6}
                step={1}
                className="mt-2"
              />
            </div>
            <div>
              <Label>Attaccanti: {forwards}</Label>
              <Slider
                value={[forwards]}
                onValueChange={(value) => setForwards(value[0])}
                min={1}
                max={4}
                step={1}
                className="mt-2"
              />
            </div>
          </div>

          <div className="text-center text-sm text-muted-foreground">
            Totale giocatori: {totalPlayers + 1} (incluso portiere)
          </div>

          <Button 
            onClick={generatePositions} 
            variant="outline" 
            className="w-full"
          >
            <Plus className="w-4 h-4 mr-2" />
            Genera Posizioni
          </Button>
        </CardContent>
      </Card>

      {positions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Campo da Calcio - Posiziona i Giocatori</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative w-full aspect-[2/3] bg-green-500 rounded-lg overflow-hidden border-2 border-white">
              {/* Field markings */}
              <div className="absolute inset-0">
                {/* Center circle */}
                <div className="absolute left-1/2 top-1/2 w-20 h-20 border-2 border-white rounded-full transform -translate-x-1/2 -translate-y-1/2" />
                {/* Center line */}
                <div className="absolute left-0 right-0 top-1/2 h-0.5 bg-white transform -translate-y-1/2" />
                {/* Penalty areas */}
                <div className="absolute left-1/4 right-1/4 top-0 h-16 border-b-2 border-l-2 border-r-2 border-white" />
                <div className="absolute left-1/4 right-1/4 bottom-0 h-16 border-t-2 border-l-2 border-r-2 border-white" />
              </div>

              {/* Positions */}
              {positions.map((position) => (
                <div
                  key={position.id}
                  className="absolute w-8 h-8 bg-blue-600 rounded-full border-2 border-white cursor-move flex items-center justify-center transform -translate-x-1/2 -translate-y-1/2 hover:bg-blue-700 transition-colors"
                  style={{
                    left: `${position.x}%`,
                    top: `${position.y}%`
                  }}
                  onMouseDown={(e) => setDraggedPosition(position.id)}
                  onMouseMove={(e) => {
                    if (draggedPosition === position.id) {
                      handlePositionDrag(position.id, e)
                    }
                  }}
                  onMouseUp={() => setDraggedPosition(null)}
                  title={position.name}
                >
                  <span className="text-white text-xs font-bold">
                    {position.id === 'gk' ? 'P' : position.id.split('-')[1] || '1'}
                  </span>
                </div>
              ))}
            </div>

            {/* Position roles editor */}
            <div className="mt-4 space-y-2">
              <h4 className="font-semibold">Personalizza Ruoli</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {positions.map((position) => (
                  <div key={position.id} className="flex items-center space-x-2">
                    <Label className="min-w-0 flex-1 text-sm">{position.name}:</Label>
                    <Input
                      value={position.role || ''}
                      onChange={(e) => updatePositionRole(position.id, e.target.value)}
                      placeholder="es. Quinto, Regista..."
                      className="flex-1"
                    />
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex justify-end space-x-2">
        <Button variant="outline" onClick={onCancel}>
          Annulla
        </Button>
        <Button onClick={handleSave} disabled={!name.trim() || positions.length === 0}>
          <Save className="w-4 h-4 mr-2" />
          Salva Formazione
        </Button>
      </div>
    </div>
  )
}
