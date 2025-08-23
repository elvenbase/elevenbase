import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { DndContext, DragEndEvent, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { SortableContext, arrayMove, rectSortingStrategy, useSortable } from '@dnd-kit/sortable'
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { GripVertical, RotateCcw } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

type GridModule = { 
  id: string; 
  title: string; 
  render: (period?: string) => JSX.Element; 
  gridClassName?: string;
  hasPeriodSelector?: boolean;
}

type GridProps = {
  modules: Array<GridModule>
  storageKey?: string
  userId?: string | null
  preferenceKey?: string
}

import { supabase } from '@/integrations/supabase/client'

export const DndGrid = ({ modules, storageKey = 'dashboard-layout', userId, preferenceKey = 'dashboard_layout' }: GridProps) => {
  const [periods, setPeriods] = useState<Record<string, string>>({})
  const scrollPositionRef = useRef<number>(0)
  const [order, setOrder] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem(storageKey)
      if (raw) {
        const parsed = JSON.parse(raw) as string[]
        const idsInit = modules.map(m => m.id)
        if (Array.isArray(parsed) && parsed.every(id => idsInit.includes(id))) return parsed
      }
    } catch {
      // Ignore JSON parsing errors
    }
    return []
  })
  const [locked, setLocked] = useState<boolean>(false)
  const ids = useMemo(() => modules.map(m => m.id), [modules])

  // Restore scroll position after period changes to prevent unwanted scrolling
  useLayoutEffect(() => {
    if (scrollPositionRef.current > 0) {
      window.scrollTo(0, scrollPositionRef.current)
      scrollPositionRef.current = 0
    }
  }, [periods])

  // Load and persist order (localStorage + user preference if available)
  useEffect(() => {
    // if state was empty at mount and localStorage has valid data, ensure it's applied
    if (order.length === 0) {
      try {
        const raw = localStorage.getItem(storageKey)
        if (raw) {
          const parsed = JSON.parse(raw) as string[]
          if (Array.isArray(parsed) && parsed.every(id => ids.includes(id))) setOrder(parsed)
        }
      } catch {
        // Ignore localStorage parsing errors
      }
    }
  }, [storageKey, ids, order.length])

  useEffect(() => {
    const loadFromDb = async () => {
      if (!userId) return
      const { data, error } = await supabase
        .from('user_preferences')
        .select('value')
        .eq('user_id', userId)
        .eq('key', preferenceKey)
        .maybeSingle()
      if (!error && data && data.value && Array.isArray(data.value.order)) {
        const arr = data.value.order as string[]
        if (arr.every(id => ids.includes(id))) setOrder(arr)
        if (typeof data.value.locked === 'boolean') setLocked(!!data.value.locked)
      }
    }
    loadFromDb()
  }, [userId, preferenceKey, ids])
  useEffect(() => {
    if (order.length > 0) localStorage.setItem(storageKey, JSON.stringify(order))
  }, [order, storageKey])

  const persistToDb = async (nextOrder: string[]) => {
    try {
      if (!userId) return
      const payload = { user_id: userId, key: preferenceKey, value: { order: nextOrder, locked } }
      const { error } = await supabase.from('user_preferences').upsert(payload, { onConflict: 'user_id,key' as any })
      if (error) console.error('Failed to persist layout', error)
    } catch (e) {
      console.error('Persist layout error', e)
    }
  }

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const handleDragEnd = (evt: DragEndEvent) => {
    const { active, over } = evt
    if (!over || active.id === over.id) return
    const current = order.length ? order : ids
    const oldIndex = current.indexOf(String(active.id))
    const newIndex = current.indexOf(String(over.id))
    const next = arrayMove(current, oldIndex, newIndex)
    setOrder(next)
    persistToDb(next)
  }

  const currentOrder = useMemo(() => {
    // Default base order ensures 'recent-activity' is last when no saved layout
    const defaultBase = (() => {
      const arr = [...ids]
      const idx = arr.indexOf('recent-activity')
      if (idx >= 0 && idx !== arr.length - 1) {
        arr.splice(idx, 1)
        arr.push('recent-activity')
      }
      return arr
    })()
    const base = order.length ? order : defaultBase
    const missing = ids.filter(id => !base.includes(id))
    return [...base, ...missing]
  }, [order, ids])
  const byId = new Map(modules.map(m => [m.id, m]))

  const SortableModule = ({ id }: { id: string }) => {
    const mod = byId.get(id)
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id })
    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
      zIndex: isDragging ? 50 : undefined,
    } as React.CSSProperties
    if (!mod) return null
    return (
      <div ref={setNodeRef} style={style} className={`min-w-0 ${mod.gridClassName || ''}`}>
        <Card className={`p-4 bg-card border-border transition-smooth ${isDragging ? 'shadow-lg ring-1 ring-primary/30' : 'hover:shadow-glow'}`}>
          <div className="mb-3 flex items-center justify-between gap-2">
            <h3 className="text-sm font-semibold text-foreground truncate">{mod.title}</h3>
            <div className="flex items-center gap-2">
              {mod.hasPeriodSelector && (
                <Select 
                  value={periods[mod.id] || 'current'} 
                  onValueChange={(value) => {
                    // Save current scroll position
                    scrollPositionRef.current = window.scrollY
                    setPeriods(prev => ({ ...prev, [mod.id]: value }))
                  }}
                >
                  <SelectTrigger className="w-[140px] h-8 text-xs border-border/40">
                    <SelectValue />
                  </SelectTrigger>
                                      <SelectContent 
                      align="end" 
                      side="bottom" 
                      sideOffset={4}
                      avoidCollisions={true}
                      position="popper"
                      onCloseAutoFocus={(e) => e.preventDefault()}
                    >
                      <SelectItem value="current" className="text-xs">Mese corrente</SelectItem>
                      <SelectItem value="previous" className="text-xs">Mese precedente</SelectItem>
                      <SelectItem value="beginning" className="text-xs">Dall'inizio</SelectItem>
                    </SelectContent>
                </Select>
              )}
              <button
                className="inline-flex items-center gap-2 rounded-md px-2 py-1 bg-muted text-muted-foreground hover:text-foreground hover:bg-muted/80 cursor-grab active:cursor-grabbing transition-bounce"
                aria-label="Trascina per spostare"
                title="Sposta modulo"
                {...(locked ? {} as any : { ...attributes, ...listeners })}
                disabled={locked}
              >
                <GripVertical className="h-4 w-4" />
                <span className="text-xs hidden sm:inline">Muovi</span>
              </button>
            </div>
          </div>
          <div>{mod.render(periods[mod.id] || 'current')}</div>
        </Card>
      </div>
    )
  }

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <SortableContext items={currentOrder} strategy={rectSortingStrategy}>
        <div className="mb-2 flex items-center justify-between gap-2">
          <label className="inline-flex items-center gap-2 text-xs text-muted-foreground select-none">
            <input type="checkbox" checked={locked} onChange={(e)=>{ setLocked(e.target.checked); persistToDb(order.length?order:ids) }} />
            Blocca disposizione
          </label>
          <Button
            variant="outline"
            size="sm"
            className="rounded-full px-3 py-1.5 hover:shadow-sm transition-bounce"
            onClick={()=>{ setOrder(ids); persistToDb(ids); localStorage.setItem(storageKey, JSON.stringify(ids)) }}
            title="Ripristina ordine predefinito"
          >
            <RotateCcw className="h-4 w-4" />
            <span className="text-xs">Reset layout</span>
          </Button>
        </div>
        <div className="grid grid-cols-1 gap-6">
          {currentOrder.map(id => (
            <SortableModule key={id} id={id} />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  )
}

export default DndGrid
