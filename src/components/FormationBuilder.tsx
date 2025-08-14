import React, { useState, useCallback, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { CustomFormation } from '@/hooks/useCustomFormations'
import { normalizeRoleCodeFrom } from '@/utils/roleNormalization'
import { useRoles } from '@/hooks/useRoles'
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
  const { data: roles = [] } = useRoles();
  const [name, setName] = useState(formation?.name || '')
  const [defenders, setDefenders] = useState(formation?.defenders || 4)
  const [midfielders, setMidfielders] = useState(formation?.midfielders || 4)
  const [forwards, setForwards] = useState(formation?.forwards || 2)
  const [positions, setPositions] = useState(formation?.positions || [])
  const [draggedPosition, setDraggedPosition] = useState<string | null>(null)
  const [editingRole, setEditingRole] = useState<string | null>(null)

  // Load field options on component mount
  useEffect(() => {
    // roles are loaded via react-query
  }, []);

  // Roles from roles table
  const playerRoles = roles;

  const totalPlayers = defenders + midfielders + forwards

  const generatePositions = useCallback(() => {
    const newPositions = []
    let positionId = 1

    // Get default roles for each position type
    const getDefaultRole = (type: 'defender' | 'midfielder' | 'forward') => {
      const roles = playerRoles.filter(role => {
        const value = role.label.toLowerCase();
        switch (type) {
          case 'defender':
            return value.includes('difensore') || value.includes('terzino') || value.includes('esterno');
          case 'midfielder':
            return value.includes('mediano') || value.includes('regista') || value.includes('mezzala') || value.includes('interno') || value.includes('trequartista');
          case 'forward':
            return value.includes('ala') || value.includes('punta') || value.includes('nove') || value.includes('centravanti');
          default:
            return false;
        }
      });
      return roles.length > 0 ? roles[0] : null;
    };

    // Goalkeeper (always present)
    newPositions.push({
      id: `gk`,
      name: `Portiere`,
      x: 50,
      y: 85,
      role: 'Portiere',
      roleShort: 'P',
      role_code: 'P'
    })

    // Defenders
    const defenderSpacing = defenders > 1 ? 80 / (defenders - 1) : 0
    const defaultDefenderRole = getDefaultRole('defender');
    for (let i = 0; i < defenders; i++) {
      const x = defenders === 1 ? 50 : 10 + (i * defenderSpacing)
      newPositions.push({
        id: `def-${positionId}`,
        name: `Difensore ${positionId}`,
        x,
        y: 70,
        role: defaultDefenderRole?.label || 'Difensore',
        roleShort: defaultDefenderRole?.abbreviation || 'D',
        role_code: defaultDefenderRole?.code || 'DC'
      })
      positionId++
    }

    // Midfielders
    const midfielderSpacing = midfielders > 1 ? 80 / (midfielders - 1) : 0
    const defaultMidfielderRole = getDefaultRole('midfielder');
    for (let i = 0; i < midfielders; i++) {
      const x = midfielders === 1 ? 50 : 10 + (i * midfielderSpacing)
      newPositions.push({
        id: `mid-${positionId}`,
        name: `Centrocampista ${positionId}`,
        x,
        y: 45,
        role: defaultMidfielderRole?.label || 'Centrocampista',
        roleShort: defaultMidfielderRole?.abbreviation || 'C',
        role_code: defaultMidfielderRole?.code || 'MC'
      })
      positionId++
    }

    // Forwards
    const forwardSpacing = forwards > 1 ? 80 / (forwards - 1) : 0
    const defaultForwardRole = getDefaultRole('forward');
    for (let i = 0; i < forwards; i++) {
      const x = forwards === 1 ? 50 : 10 + (i * forwardSpacing)
      newPositions.push({
        id: `fwd-${positionId}`,
        name: `Attaccante ${positionId}`,
        x,
        y: 20,
        role: defaultForwardRole?.label || 'Attaccante',
        roleShort: defaultForwardRole?.abbreviation || 'A',
        role_code: defaultForwardRole?.code || 'ATT'
      })
      positionId++
    }

    setPositions(newPositions)
  }, [defenders, midfielders, forwards, playerRoles])

  const handlePositionDrag = useCallback((positionId: string, event: React.MouseEvent | React.TouchEvent) => {
    event.preventDefault()
    
    const rect = (event.currentTarget as HTMLElement).closest('.field-container')?.getBoundingClientRect()
    if (!rect) return

    let clientX, clientY
    if ('touches' in event && event.touches.length > 0) {
      clientX = event.touches[0].clientX
      clientY = event.touches[0].clientY
    } else {
      clientX = (event as React.MouseEvent).clientX
      clientY = (event as React.MouseEvent).clientY
    }

    const x = ((clientX - rect.left) / rect.width) * 100
    const y = ((clientY - rect.top) / rect.height) * 100

    setPositions(prev => prev.map(pos => 
      pos.id === positionId 
        ? { ...pos, x: Math.max(5, Math.min(95, x)), y: Math.max(5, Math.min(95, y)) }
        : pos
    ))
  }, [])

  const updatePositionRole = (positionId: string, role: string, roleShort?: string, roleCode?: string) => {
    setPositions(prev => prev.map(pos => {
      if (pos.id !== positionId) return pos
      const next = { ...pos, role, roleShort }
      const role_code = roleCode || normalizeRoleCodeFrom(next)
      return { ...next, role_code }
    }))
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
      positions: positions.map(p => ({ ...p, role_code: normalizeRoleCodeFrom(p) }))
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
            <CardTitle>Campo da Calcio - Posiziona e Personalizza i Giocatori</CardTitle>
          </CardHeader>
          <CardContent>
            {/* Mobile version (under 1100px) */}
            <div className="block xl:hidden relative w-full max-w-md mx-auto">
              <div 
                className="relative bg-gradient-to-b from-green-100 to-green-200 border-4 border-white rounded-lg shadow-lg overflow-hidden field-container" 
                style={{ aspectRatio: '2/3', minHeight: '400px' }}
                onMouseMove={(e) => {
                  if (draggedPosition) {
                    handlePositionDrag(draggedPosition, e)
                  }
                }}
                onMouseUp={() => setDraggedPosition(null)}
                onMouseLeave={() => setDraggedPosition(null)}
              >
                {/* Mobile field content */}
                {/* Sfondo erba con pattern */}
                <div 
                  className="absolute inset-0 opacity-20" 
                  style={{
                    backgroundImage: 'repeating-linear-gradient(90deg, transparent, transparent 8px, rgba(0,100,0,0.1) 8px, rgba(0,100,0,0.1) 16px)'
                  }}
                />
                
                {/* Linee del campo - mobile */}
                <div className="absolute inset-0">
                  {/* Bordo campo */}
                  <div className="absolute inset-2 border-2 border-white rounded-sm" />
                  
                  {/* Area di rigore superiore */}
                  <div className="absolute top-2 left-1/2 transform -translate-x-1/2 w-2/5 h-1/6 border-2 border-white" />
                  {/* Area piccola superiore */}
                  <div className="absolute top-2 left-1/2 transform -translate-x-1/2 w-1/4 h-[8%] border-2 border-white" />
                  {/* Dischetto superiore */}
                  <div className="absolute top-[12%] left-1/2 transform -translate-x-1/2 w-1.5 h-1.5 bg-white rounded-full" />
                  
                  {/* Linea di metà campo */}
                  <div className="absolute top-1/2 left-2 right-2 border-t-2 border-white" />
                  {/* Cerchio di centrocampo */}
                  <div 
                    className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 border-2 border-white rounded-full"
                    style={{ width: '25%', aspectRatio: '1' }}
                  />
                  {/* Punto del centrocampo */}
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-white rounded-full" />
                  
                  {/* Area di rigore inferiore */}
                  <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 w-2/5 h-1/6 border-2 border-white" />
                  {/* Area piccola inferiore */}
                  <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 w-1/4 h-[8%] border-2 border-white" />
                  {/* Dischetto inferiore */}
                  <div className="absolute bottom-[12%] left-1/2 transform -translate-x-1/2 w-1.5 h-1.5 bg-white rounded-full" />
                  
                  {/* Porte */}
                  <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-1/6 h-1 bg-white" />
                  <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-1/6 h-1 bg-white" />
                </div>

                {/* Mobile Positions */}
                {positions.map((position) => (
                  <div
                    key={position.id}
                    className="absolute transform -translate-x-1/2 -translate-y-1/2 group"
                    style={{
                      left: `${position.x}%`,
                      top: `${position.y}%`
                    }}
                  >
                    <div className="flex flex-col items-center space-y-1">
                      {/* Player pin - mobile size */}
                      <div
                        className="w-6 h-6 bg-blue-600 rounded-full border-2 border-white cursor-move flex items-center justify-center hover:bg-blue-700 transition-colors shadow-lg"
                        onMouseDown={(e) => {
                          setDraggedPosition(position.id)
                          e.preventDefault()
                          e.stopPropagation()
                        }}
                        onTouchStart={(e) => {
                          setDraggedPosition(position.id)
                          e.preventDefault()
                          e.stopPropagation()
                        }}
                        title={position.name}
                      >
                        <span className="text-white text-xs font-bold">
                          {position.roleShort || position.id === 'gk' ? 'P' : position.id.split('-')[1] || '1'}
                        </span>
                      </div>
                      
                      {/* Role display/edit - mobile */}
                      {editingRole === position.id ? (
                        <select
                          value={position.role || ''}
                          onChange={(e) => {
                            const selectedRole = playerRoles.find(role => role.label === e.target.value)
                            updatePositionRole(
                              position.id,
                              selectedRole?.label || e.target.value,
                              selectedRole?.abbreviation || '',
                              selectedRole?.code
                            );
                            setEditingRole(null)
                          }}
                          className="text-xs bg-white border border-gray-300 rounded px-1 py-0.5 min-w-[90px]"
                          autoFocus
                        >
                          <option value="">Seleziona ruolo...</option>
                          {playerRoles.map((role) => (
                            <option key={role.code} value={role.label}>
                              {role.label} ({role.abbreviation})
                            </option>
                          ))}
                        </select>
                      ) : (
                        <div
                          className="text-xs font-semibold text-gray-800 bg-white bg-opacity-90 px-1 py-0.5 rounded cursor-pointer hover:bg-opacity-100 transition-all"
                          onClick={() => setEditingRole(position.id)}
                        >
                          {position.role || position.name}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Desktop version (1100px and above) */}
            <div className="hidden xl:block relative w-full max-w-6xl mx-auto">
              <div 
                className="relative bg-gradient-to-b from-green-100 to-green-200 border-4 border-white rounded-lg shadow-lg overflow-hidden field-container" 
                style={{ aspectRatio: '2/3', minHeight: '800px' }}
              onMouseMove={(e) => {
                if (draggedPosition) {
                  handlePositionDrag(draggedPosition, e)
                }
              }}
              onMouseUp={() => setDraggedPosition(null)}
              onMouseLeave={() => setDraggedPosition(null)}
            >
                {/* Desktop field content */}
                {/* Sfondo erba con pattern - desktop */}
                <div 
                  className="absolute inset-0 opacity-20" 
                  style={{
                    backgroundImage: 'repeating-linear-gradient(90deg, transparent, transparent 15px, rgba(0,100,0,0.1) 15px, rgba(0,100,0,0.1) 30px)'
                  }}
                />
                
                {/* Linee del campo - desktop */}
                <div className="absolute inset-0">
                  {/* Bordo campo */}
                  <div className="absolute inset-3 border-4 border-white rounded-sm" />
                  
                  {/* Area di rigore superiore */}
                  <div className="absolute top-3 left-1/2 transform -translate-x-1/2 w-2/5 h-1/6 border-4 border-white" />
                  {/* Area piccola superiore */}
                  <div className="absolute top-3 left-1/2 transform -translate-x-1/2 w-1/4 h-[8%] border-4 border-white" />
                  {/* Dischetto superiore */}
                  <div className="absolute top-[12%] left-1/2 transform -translate-x-1/2 w-3 h-3 bg-white rounded-full" />
                  
                  {/* Linea di metà campo */}
                  <div className="absolute top-1/2 left-3 right-3 border-t-4 border-white" />
                  {/* Cerchio di centrocampo */}
                  <div 
                    className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 border-4 border-white rounded-full"
                    style={{ width: '25%', aspectRatio: '1' }}
                  />
                  {/* Punto del centrocampo */}
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full" />
                  
                  {/* Area di rigore inferiore */}
                  <div className="absolute bottom-3 left-1/2 transform -translate-x-1/2 w-2/5 h-1/6 border-4 border-white" />
                  {/* Area piccola inferiore */}
                  <div className="absolute bottom-3 left-1/2 transform -translate-x-1/2 w-1/4 h-[8%] border-4 border-white" />
                  {/* Dischetto inferiore */}
                  <div className="absolute bottom-[12%] left-1/2 transform -translate-x-1/2 w-3 h-3 bg-white rounded-full" />
                  
                  {/* Porte */}
                  <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-1/6 h-1.5 bg-white" />
                  <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-1/6 h-1.5 bg-white" />
                </div>

                {/* Desktop Positions */}
                {positions.map((position) => (
                  <div
                    key={position.id}
                    className="absolute transform -translate-x-1/2 -translate-y-1/2 group"
                    style={{
                      left: `${position.x}%`,
                      top: `${position.y}%`
                    }}
                  >
                    <div className="flex flex-col items-center space-y-2">
                      {/* Player pin - desktop size */}
                      <div
                        className="w-12 h-12 bg-blue-600 rounded-full border-3 border-white cursor-move flex items-center justify-center hover:bg-blue-700 transition-colors shadow-lg"
                        onMouseDown={(e) => {
                          setDraggedPosition(position.id)
                          e.preventDefault()
                          e.stopPropagation()
                        }}
                        onTouchStart={(e) => {
                          setDraggedPosition(position.id)
                          e.preventDefault()
                          e.stopPropagation()
                        }}
                        title={position.name}
                      >
                        <span className="text-white text-sm font-bold">
                          {position.roleShort || position.id === 'gk' ? 'P' : position.id.split('-')[1] || '1'}
                        </span>
                      </div>
                      
                                             {/* Role display/edit - desktop */}
                       {editingRole === position.id ? (
                         <div 
                           className={`bg-white/95 backdrop-blur-sm rounded-lg px-4 py-3 shadow-lg min-w-[200px] space-y-3 absolute z-50 ${
                             position.x > 70 ? 'right-0' : position.x < 30 ? 'left-0' : 'left-1/2 -translate-x-1/2'
                           } ${
                             position.y < 30 ? 'top-full mt-3' : 'bottom-full mb-3'
                           }`}
                           onClick={(e) => e.stopPropagation()}
                         >
                           <div>
                             <Label className="text-xs text-gray-600">Ruolo</Label>
                             <select
                               value={position.role || ''}
                               onChange={(e) => {
                                 const selectedRole = playerRoles.find(role => role.label === e.target.value);
                                 updatePositionRole(
                                   position.id,
                                   selectedRole?.label || e.target.value,
                                   selectedRole?.abbreviation || '',
                                   selectedRole?.code
                                 );
                               }}
                               className="w-full text-sm h-9 px-3 py-1 border border-gray-300 rounded-md bg-white"
                               autoFocus
                             >
                               <option value="">Seleziona ruolo...</option>
                               {playerRoles.map((role) => (
                                 <option key={role.code} value={role.label}>
                                   {role.label} ({role.abbreviation})
                                 </option>
                               ))}
                             </select>
                           </div>
                           <div className="flex gap-2">
                             <Button 
                               size="sm" 
                               className="h-8 text-sm flex-1" 
                               onClick={(e) => {
                                 e.stopPropagation()
                                 setEditingRole(null)
                               }}
                             >
                               OK
                             </Button>
                           </div>
                         </div>
                       ) : (
                         <div
                           className="text-sm text-white font-medium px-3 py-1.5 bg-black/60 rounded-lg backdrop-blur-sm cursor-pointer hover:bg-black/80 transition-colors max-w-[100px] text-center"
                           onClick={(e) => {
                             e.stopPropagation()
                             setEditingRole(position.id)
                           }}
                           title="Clicca per modificare"
                         >
                           {position.role || position.name}
                         </div>
                       )}
                     </div>
                   </div>
                 ))}
               </div>
             </div>

            {/* Position fine-tuning controls */}
            <div className="mt-4 space-y-3">
              <h4 className="font-semibold">Controlli Posizionamento</h4>
              <div className="text-sm text-muted-foreground">
                • Trascina i pin sul campo per posizionare i giocatori
                • Clicca sui ruoli sotto i pin per personalizzarli
                • Usa le coordinate per regolazioni precise
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-60 overflow-y-auto">
                {positions.map((position) => (
                  <div key={position.id} className="flex items-center space-x-2 p-2 border rounded">
                    <div className="flex-1">
                      <div className="font-medium text-sm">{position.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {position.role} {position.roleShort && (
                          <span className="ml-1 text-xs bg-primary/10 text-primary px-1 rounded">
                            {position.roleShort}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex space-x-1">
                      <div className="text-xs">
                        <Label className="text-xs">X:</Label>
                        <Input
                          type="number"
                          value={Math.round(position.x)}
                          onChange={(e) => {
                            const x = Math.max(5, Math.min(95, parseInt(e.target.value) || 0))
                            setPositions(prev => prev.map(pos => 
                              pos.id === position.id ? { ...pos, x } : pos
                            ))
                          }}
                          className="w-16 h-6 text-xs"
                          min={5}
                          max={95}
                        />
                      </div>
                      <div className="text-xs">
                        <Label className="text-xs">Y:</Label>
                        <Input
                          type="number"
                          value={Math.round(position.y)}
                          onChange={(e) => {
                            const y = Math.max(5, Math.min(95, parseInt(e.target.value) || 0))
                            setPositions(prev => prev.map(pos => 
                              pos.id === position.id ? { ...pos, y } : pos
                            ))
                          }}
                          className="w-16 h-6 text-xs"
                          min={5}
                          max={95}
                        />
                      </div>
                    </div>
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
